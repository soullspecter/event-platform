import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, QueryFailedError, Repository } from 'typeorm';

import { Event } from './entity/event.entity';
import { ScheduleItem } from '../schedule/entity/schedule-item.entity';
import { User } from '../../users/entity/user.entity';
import { Program } from '../programs/entity/program.entity';
import { Location } from '../locations/entity/location.entity';
import { LocationPlace } from '../location-places/entity/location-place.entity';

import { SaveEventDto } from './dto/save-event.dto';
import { SaveProgramDto } from '../programs/dto/save-program.dto';
import { SaveScheduleItemDto } from '../schedule/dto/save-schedule-item.dto';

@Injectable()
export class EventsService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Event) private readonly eventsRepository: Repository<Event>,
    ) {}

    async createDraft(userId: number, dto: SaveEventDto) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.getRepository(User).findOne({ where: { userId } });
            if (!user) throw new NotFoundException('Пользователь не найден');

            this.validateEventDates(dto.startDate, dto.endDate);

            const event = manager.getRepository(Event).create({
                title: dto.title?.trim() || null,
                description: dto.description?.trim() || null,
                startDate: dto.startDate || null,
                endDate: dto.endDate || null,
                status: 'draft',
                userId,
                organizer: user,
            });

            const savedEvent = await manager.getRepository(Event).save(event);

            let savedScheduleItems: ScheduleItem[] = [];
            if (dto.schedule !== undefined) {
                savedScheduleItems = await this.syncSchedule(manager, savedEvent.eventId, dto.schedule);
            }

            if (dto.programs !== undefined) {
                await this.syncPrograms(manager, dto.programs, savedScheduleItems);
            }

            return this.buildEventDetails(manager, savedEvent.eventId);
        });
    }

    async updateEvent(eventId: number, dto: SaveEventDto) {
        return this.dataSource.transaction(async (manager) => {
            const events = manager.getRepository(Event);
            const event = await events.findOne({ where: { eventId } });
            if (!event) throw new NotFoundException('Мероприятие не найдено');

            const nextStartDate = dto.startDate !== undefined ? dto.startDate : event.startDate;
            const nextEndDate = dto.endDate !== undefined ? dto.endDate : event.endDate;
            this.validateEventDates(nextStartDate, nextEndDate);

            if (dto.title !== undefined) event.title = dto.title?.trim() || null;
            if (dto.description !== undefined) event.description = dto.description?.trim() || null;
            if (dto.startDate !== undefined) event.startDate = dto.startDate || null;
            if (dto.endDate !== undefined) event.endDate = dto.endDate || null;

            await events.save(event);

            let scheduleItemsForPrograms: ScheduleItem[];
            if (dto.schedule !== undefined) {
                scheduleItemsForPrograms = await this.syncSchedule(manager, eventId, dto.schedule);
            } else {
                scheduleItemsForPrograms = await manager.getRepository(ScheduleItem).find({
                    where: { eventId },
                    order: { itemDate: 'ASC', startTime: 'ASC' },
                });
            }

            if (dto.programs !== undefined) {
                await this.syncPrograms(manager, dto.programs, scheduleItemsForPrograms);
            }

            return this.buildEventDetails(manager, eventId);
        });
    }

    async publish(eventId: number) {
        return this.dataSource.transaction(async (manager) => {
            const events = manager.getRepository(Event);
            const event = await events.findOne({ where: { eventId } });
            if (!event) throw new NotFoundException('Мероприятие не найдено');
            if (event.status === 'published') throw new BadRequestException('Мероприятие уже опубликовано');

            await this.validateForPublication(manager, eventId, event);
            event.status = 'published';
            await events.save(event);

            return this.buildEventDetails(manager, eventId);
        });
    }

    async findPublished() {
        const events = await this.eventsRepository.find({ where: { status: 'published' }, order: { startDate: 'ASC' } });
        return Promise.all(events.map((e) => this.buildEventDetails(this.dataSource.manager, e.eventId)));
    }

    async findMine(userId: number) {
        const events = await this.eventsRepository.find({ where: { userId }, order: { eventId: 'DESC' } });
        return Promise.all(events.map((e) => this.buildEventDetails(this.dataSource.manager, e.eventId)));
    }

    async findDrafts() {
        const events = await this.eventsRepository.find({ where: { status: 'draft' }, order: { eventId: 'DESC' } });
        return Promise.all(events.map((e) => this.buildEventDetails(this.dataSource.manager, e.eventId)));
    }

    async findForManagement(eventId: number) {
        const event = await this.eventsRepository.findOne({ where: { eventId } });
        if (!event) throw new NotFoundException('Мероприятие не найдено');
        return this.buildEventDetails(this.dataSource.manager, eventId);
    }

    async findPublishedById(eventId: number) {
        const event = await this.eventsRepository.findOne({ where: { eventId, status: 'published' } });
        if (!event) throw new NotFoundException('Опубликованное мероприятие не найдено');
        return this.buildEventDetails(this.dataSource.manager, eventId);
    }

    async remove(eventId: number) {
        const event = await this.eventsRepository.findOne({ where: { eventId } });
        if (!event) throw new NotFoundException('Мероприятие не найдено');
        try {
            await this.eventsRepository.remove(event);
            return { message: 'Мероприятие успешно удалено' };
        } catch (error) {
            if (error instanceof QueryFailedError) {
                const driverError = (error as QueryFailedError & { driverError?: { code?: string } }).driverError;
                if (driverError?.code === '23503') {
                    throw new ConflictException('Нельзя удалить мероприятие: существуют связанные записи');
                }
            }
            throw error;
        }
    }

    private async buildEventDetails(manager: EntityManager, eventId: number) {
        const event = await manager.getRepository(Event).findOne({ where: { eventId } });
        if (!event) throw new NotFoundException('Мероприятие не найдено');

        const schedule = await manager.getRepository(ScheduleItem).find({
            where: { eventId },
            relations: {
                programs: {
                    locationPlace: { location: true },
                },
            },
            order: { itemDate: 'ASC', startTime: 'ASC' },
        });

        const programs = schedule.flatMap((item) => item.programs || []);

        return { ...event, schedule, programs };
    }

    private async syncSchedule(manager: EntityManager, eventId: number, scheduleDtos: SaveScheduleItemDto[]): Promise<ScheduleItem[]> {
        const repository = manager.getRepository(ScheduleItem);
        const existingItems = await repository.find({ where: { eventId } });
        const existingById = new Map(existingItems.map((item) => [item.scheduleItemId, item]));
        const processedIds = new Set<number>();
        const savedItems: ScheduleItem[] = [];

        for (const dto of scheduleDtos) {
            let item: ScheduleItem;

            if (dto.scheduleItemId != null) {
                const existingItem = existingById.get(dto.scheduleItemId);
                if (!existingItem) throw new BadRequestException(`Пункт расписания ${dto.scheduleItemId} не найден`);
                if (processedIds.has(dto.scheduleItemId)) throw new BadRequestException(`Пункт расписания ${dto.scheduleItemId} передан дважды`);
                item = existingItem;
            } else {
                item = repository.create({ eventId });
            }

            if (dto.name !== undefined) item.name = dto.name?.trim() || null;
            if (dto.itemDate !== undefined) item.itemDate = dto.itemDate || null;
            if (dto.startTime !== undefined) item.startTime = dto.startTime || null;
            if (dto.endTime !== undefined) item.endTime = dto.endTime || null;

            this.validateScheduleTimes(item.startTime, item.endTime);
            item = await repository.save(item);
            processedIds.add(item.scheduleItemId);
            savedItems.push(item);
        }

        const removedIds = existingItems.filter((item) => !processedIds.has(item.scheduleItemId)).map((item) => item.scheduleItemId);
        if (removedIds.length > 0) {
            await repository.delete({ scheduleItemId: In(removedIds) });
        }

        return savedItems;
    }

    private async syncPrograms(manager: EntityManager, dtos: SaveProgramDto[], savedScheduleItems: ScheduleItem[]) {
        const programsRepository = manager.getRepository(Program);
        const locationsRepository = manager.getRepository(Location);
        const locationPlacesRepository = manager.getRepository(LocationPlace);

        for (const dto of dtos) {
            let program: Program;

            if (dto.programId != null) {
                const existing = await programsRepository.findOne({ where: { programId: dto.programId } });
                if (!existing) throw new BadRequestException(`Программа ${dto.programId} не найдена`);
                program = existing;
            } else {
                program = programsRepository.create();
            }

            let scheduleItemId: number | null = null;
            if (dto.scheduleItemId != null && dto.scheduleItemId > 0) {
                scheduleItemId = dto.scheduleItemId;
            } else if (dto.scheduleItemIndex != null && savedScheduleItems[dto.scheduleItemIndex]) {
                scheduleItemId = savedScheduleItems[dto.scheduleItemIndex].scheduleItemId;
            }

            program.scheduleItemId = scheduleItemId;

            if (dto.name !== undefined) program.name = dto.name?.trim() || 'Без названия';
            if (dto.description !== undefined) program.description = dto.description?.trim() || null;

            let finalLocationPlaceId = dto.locationPlaceId ?? null;

            if (!finalLocationPlaceId && dto.manualLocation) {
                const locName = dto.manualLocation.name?.trim() || null;
                const locAddress = dto.manualLocation.address?.trim() || null;
                const placeName = dto.manualLocation.place?.trim() || null;

                if (locName || locAddress || placeName) {
                    let location = await locationsRepository
                        .createQueryBuilder('location')
                        .where("LOWER(TRIM(COALESCE(location.name, ''))) = LOWER(TRIM(COALESCE(:name, '')))", { name: locName })
                        .andWhere("LOWER(TRIM(COALESCE(location.address, ''))) = LOWER(TRIM(COALESCE(:address, '')))", { address: locAddress })
                        .getOne();

                    if (!location) {
                        location = locationsRepository.create({ name: locName, address: locAddress });
                        await locationsRepository.save(location);
                    }

                    let place = await locationPlacesRepository.findOne({
                        where: {
                            locationId: location.locationId,
                            place: placeName === null ? undefined : placeName,
                        },
                    });

                    if (!place) {
                        place = locationPlacesRepository.create({
                            locationId: location.locationId,
                            place: placeName,
                        });
                        await locationPlacesRepository.save(place);
                    }

                    finalLocationPlaceId = place.locationPlaceId;
                }
            }

            program.locationPlaceId = finalLocationPlaceId;

            await programsRepository.save(program);
        }
    }

    private validateEventDates(startDate?: string | null, endDate?: string | null) {
        if (startDate && endDate && endDate < startDate) throw new BadRequestException('Дата окончания не может быть раньше даты начала');
    }

    private validateScheduleTimes(startTime?: string | null, endTime?: string | null) {
        if (startTime && endTime && this.timeToSeconds(endTime) <= this.timeToSeconds(startTime)) {
            throw new BadRequestException('Время окончания должно быть позже времени начала');
        }
    }

    private timeToSeconds(time: string): number {
        const [h, m, s = '0'] = time.split(':');
        return Number(h) * 3600 + Number(m) * 60 + Number(s);
    }

    private async validateForPublication(manager: EntityManager, eventId: number, event: Event) {
        if (!event.title?.trim()) throw new BadRequestException('Укажите название');
        if (!event.description?.trim()) throw new BadRequestException('Укажите описание');
        if (!event.startDate) throw new BadRequestException('Укажите дату начала');
        if (!event.endDate) throw new BadRequestException('Укажите дату окончания');

        this.validateEventDates(event.startDate, event.endDate);

        const scheduleItems = await manager.getRepository(ScheduleItem).find({ where: { eventId } });
        const scheduleIds = scheduleItems.map((i) => i.scheduleItemId);

        const programs = await manager.getRepository(Program).find({
            where: { scheduleItemId: In(scheduleIds) },
        });

        if (programs.length === 0) throw new BadRequestException('Добавьте хотя бы одну программу');

        for (const program of programs) {
            if (!program.scheduleItemId) throw new BadRequestException(`Программа "${program.name}" должна быть привязана к пункту расписания`);
            if (!program.name?.trim()) throw new BadRequestException('У каждой программы должно быть название');
        }

        for (const item of scheduleItems) {
            if (!item.itemDate) throw new BadRequestException('Укажите дату каждого пункта расписания');
            if (item.itemDate < event.startDate || item.itemDate > event.endDate) {
                throw new BadRequestException('Даты расписания должны входить в период мероприятия');
            }
            if (!item.startTime) throw new BadRequestException('Укажите время начала');
            if (!item.endTime) throw new BadRequestException('Укажите время окончания');
            this.validateScheduleTimes(item.startTime, item.endTime);
        }
    }
}
