import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';

import { CommonScheduleService } from '../common-schedule/common-schedule.service';
import { Program } from '../programs/entity/program.entity';
import { ProgramsService } from '../programs/programs.service';
import { ScheduleService } from '../schedule/schedule.service';
import { User } from '../../users/entity/user.entity';

import { SaveEventDto } from './dto/save-event.dto';
import { Event } from './entity/event.entity';

@Injectable()
export class EventsService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly programsService: ProgramsService,
        private readonly commonScheduleService: CommonScheduleService,
        private readonly scheduleService: ScheduleService,
        @InjectRepository(Event) private readonly eventsRepository: Repository<Event>,
    ) {}

    async createDraft(userId: number, dto: SaveEventDto) {
        return this.dataSource.transaction('READ COMMITTED', async (manager) => {
            const user = await manager.getRepository(User).findOne({ where: { userId } });
            if (!user) throw new NotFoundException('Пользователь не найден');

            this.validateEventDates(dto.startDate, dto.endDate);

            const event = manager.getRepository(Event).create({
                title: dto.title ?? null,
                description: dto.description ?? null,
                startDate: dto.startDate ?? null,
                endDate: dto.endDate ?? null,
                status: 'draft',
                createdBy: userId,
                creator: user,
            });
            const saved = await manager.getRepository(Event).save(event);

            if (dto.programs !== undefined) {
                await this.programsService.replaceForEvent(manager, saved, dto.programs);
            }
            if (dto.commonSchedule !== undefined) {
                await this.commonScheduleService.replaceForEvent(manager, saved, dto.commonSchedule);
            }

            return this.buildEventDetails(manager, saved.eventId);
        });
    }

    async updateEvent(eventId: number, dto: SaveEventDto) {
        return this.dataSource.transaction('READ COMMITTED', async (manager) => {
            const repo = manager.getRepository(Event);
            const event = await repo.findOne({ where: { eventId } });
            if (!event) throw new NotFoundException('Мероприятие не найдено');

            const nextStart = dto.startDate !== undefined ? dto.startDate : event.startDate;
            const nextEnd = dto.endDate !== undefined ? dto.endDate : event.endDate;
            this.validateEventDates(nextStart, nextEnd);

            if (dto.title !== undefined) event.title = dto.title ?? null;
            if (dto.description !== undefined) event.description = dto.description ?? null;
            if (dto.startDate !== undefined) event.startDate = dto.startDate ?? null;
            if (dto.endDate !== undefined) event.endDate = dto.endDate ?? null;
            await repo.save(event);

            if (dto.programs !== undefined) {
                await this.programsService.replaceForEvent(manager, event, dto.programs);
            }
            if (dto.commonSchedule !== undefined) {
                await this.commonScheduleService.replaceForEvent(manager, event, dto.commonSchedule);
            }

            return this.buildEventDetails(manager, eventId);
        });
    }

    async publish(eventId: number) {
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(Event);
            const event = await repo.findOne({ where: { eventId } });
            if (!event) throw new NotFoundException('Мероприятие не найдено');
            if (event.status === 'published') throw new BadRequestException('Мероприятие уже опубликовано');

            await this.validateForPublication(manager, event);
            event.status = 'published';
            await repo.save(event);

            return this.buildEventDetails(manager, eventId);
        });
    }

    async findPublished() {
        const events = await this.eventsRepository.find({
            where: { status: 'published' },
            order: { startDate: 'ASC' },
        });
        return this.mapDetails(events.map((e) => e.eventId));
    }

    async findMine(userId: number) {
        const events = await this.eventsRepository.find({
            where: { createdBy: userId },
            order: { eventId: 'DESC' },
        });
        return this.mapDetails(events.map((e) => e.eventId));
    }

    async findDrafts() {
        const events = await this.eventsRepository.find({
            where: { status: 'draft' },
            order: { eventId: 'DESC' },
        });
        return this.mapDetails(events.map((e) => e.eventId));
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
        return this.dataSource.transaction('READ COMMITTED', async (manager) => {
            const event = await manager.getRepository(Event).findOne({ where: { eventId } });
            if (!event) throw new NotFoundException('Мероприятие не найдено');

            try {
                const slotIds = await this.scheduleService.findEventSlotIds(manager, eventId);
                await manager.getRepository(Event).remove(event);
                await this.scheduleService.removeOrphans(manager, slotIds);
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
        });
    }

    private async mapDetails(eventIds: number[]) {
        return Promise.all(eventIds.map((id) => this.buildEventDetails(this.dataSource.manager, id)));
    }

    private async buildEventDetails(manager: EntityManager, eventId: number) {
        const event = await manager.getRepository(Event).findOne({ where: { eventId } });
        if (!event) throw new NotFoundException('Мероприятие не найдено');

        const { programs, commonScheduleByDate } = await this.scheduleService.buildSchedule(eventId, manager);

        return {
            eventId: event.eventId,
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            status: event.status,
            createdBy: event.createdBy,
            programs,
            commonScheduleByDate,
        };
    }

    private validateEventDates(startDate?: string | null, endDate?: string | null) {
        if (startDate && endDate && endDate < startDate) {
            throw new BadRequestException('Дата окончания не может быть раньше даты начала');
        }
    }

    private async validateForPublication(manager: EntityManager, event: Event) {
        if (!event.title?.trim()) throw new BadRequestException('Укажите название');
        if (!event.description?.trim()) throw new BadRequestException('Укажите описание');
        if (!event.startDate) throw new BadRequestException('Укажите дату начала');
        if (!event.endDate) throw new BadRequestException('Укажите дату окончания');

        this.validateEventDates(event.startDate, event.endDate);

        const programs = await manager.getRepository(Program).find({
            where: { eventId: event.eventId },
            relations: { programSchedules: { scheduleItem: true } },
        });
        if (programs.length === 0) throw new BadRequestException('Добавьте хотя бы одну программу');

        for (const program of programs) {
            if (!program.name?.trim()) throw new BadRequestException('У каждой программы должно быть название');
            if (program.programSchedules.length === 0) {
                throw new BadRequestException(`Программа "${program.name}" должна содержать хотя бы один пункт расписания`);
            }
            for (const link of program.programSchedules) {
                const item = link.scheduleItem;
                if (!item.itemDate) throw new BadRequestException('Укажите дату каждого пункта расписания');
                if (!item.startTime) throw new BadRequestException('Укажите время начала');
                if (!item.endTime) throw new BadRequestException('Укажите время окончания');
                if (this.timeToSeconds(item.endTime) <= this.timeToSeconds(item.startTime)) {
                    throw new BadRequestException('Время окончания должно быть позже времени начала');
                }
                if (item.itemDate < event.startDate || item.itemDate > event.endDate) {
                    throw new BadRequestException('Даты расписания должны входить в период мероприятия');
                }
            }
        }
    }

    private timeToSeconds(time: string): number {
        const [h, m, s = '0'] = time.split(':');
        return Number(h) * 3600 + Number(m) * 60 + Number(s);
    }
}
