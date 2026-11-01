import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, QueryFailedError, Repository } from 'typeorm';

import { Event } from '../../../models/events/event.entity';
import { ScheduleItem } from '../../../models/schedule/schedule-item.entity';
import { User } from '../../../models/users/user.entity';
import { Venue } from '../../../models/venues/venue.entity';
import { VenueLocation } from '../../../models/venues/venue-location.entity';
import { Location } from '../../../models/locations/location.entity';

import { SaveEventDto } from './dto/save-event.dto';
import { SaveVenueDto } from '../venues/dto/save-venue.dto';
import { SaveLocationDto } from '../locations/dto/save-location.dto';
import { SaveScheduleItemDto } from '../schedule/dto/save-schedule-item.dto';

type PostgresError = Error & {
    code?: string;
};

@Injectable()
export class EventsService {
    constructor(
        private readonly dataSource: DataSource,

        @InjectRepository(Event)
        private readonly eventsRepository: Repository<Event>,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,

        @InjectRepository(ScheduleItem)
        private readonly scheduleRepository: Repository<ScheduleItem>,

        @InjectRepository(Venue)
        private readonly venuesRepository: Repository<Venue>,

        @InjectRepository(VenueLocation)
        private readonly venueLocationsRepository: Repository<VenueLocation>,

        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,
    ) {}

    // Создание черновика мероприятия.
    // userId сохраняется как автор мероприятия.
    async createDraft(userId: number, dto: SaveEventDto) {
        return this.dataSource.transaction(async (manager) => {
            const users = manager.getRepository(User);
            const events = manager.getRepository(Event);

            const user = await users.findOne({
                where: { userId },
            });

            if (!user) {
                throw new NotFoundException('Пользователь не найден');
            }

            this.validateEventDates(dto.startDate, dto.endDate);

            const event = events.create({
                title: dto.title?.trim() || null,
                description: dto.description?.trim() || null,
                startDate: dto.startDate || null,
                endDate: dto.endDate || null,
                status: 'draft',
                userId,
                organizer: user,
            });

            const savedEvent = await events.save(event);

            if (dto.venues !== undefined) {
                await this.syncVenues(manager, savedEvent.eventId, dto.venues);
            }

            if (dto.schedule !== undefined) {
                await this.syncSchedule(manager, savedEvent.eventId, dto.schedule);
            }

            return this.buildEventDetails(manager, savedEvent);
        });
    }

    // Обновление мероприятия.
    async updateEvent(eventId: number, dto: SaveEventDto) {
        return this.dataSource.transaction(async (manager) => {
            const events = manager.getRepository(Event);

            const event = await events.findOne({
                where: { eventId },
            });

            if (!event) {
                throw new NotFoundException('Мероприятие не найдено');
            }

            const nextStartDate = dto.startDate !== undefined ? dto.startDate : event.startDate;

            const nextEndDate = dto.endDate !== undefined ? dto.endDate : event.endDate;

            this.validateEventDates(nextStartDate, nextEndDate);

            if (dto.title !== undefined) {
                event.title = dto.title?.trim() || null;
            }

            if (dto.description !== undefined) {
                event.description = dto.description?.trim() || null;
            }

            if (dto.startDate !== undefined) {
                event.startDate = dto.startDate || null;
            }

            if (dto.endDate !== undefined) {
                event.endDate = dto.endDate || null;
            }

            await events.save(event);

            if (dto.venues !== undefined) {
                await this.syncVenues(manager, eventId, dto.venues);
            }

            if (dto.schedule !== undefined) {
                await this.syncSchedule(manager, eventId, dto.schedule);
            }

            return this.buildEventDetails(manager, event);
        });
    }

    // Публикация мероприятия с серверной проверкой всех обязательных данных.
    async publish(eventId: number) {
        return this.dataSource.transaction(async (manager) => {
            const events = manager.getRepository(Event);

            const event = await events.findOne({
                where: { eventId },
            });

            if (!event) {
                throw new NotFoundException('Мероприятие не найдено');
            }

            if (event.status === 'published') {
                throw new BadRequestException('Мероприятие уже опубликовано');
            }

            await this.validateForPublication(manager, eventId, event);

            event.status = 'published';

            await events.save(event);

            return this.buildEventDetails(manager, event);
        });
    }

    // Список опубликованных мероприятий.
    async findPublished() {
        return this.eventsRepository.find({
            where: { status: 'published' },
            order: {
                startDate: 'ASC',
                eventId: 'DESC',
            },
        });
    }

    // Список мероприятий для административного управления.
    async findMine(userId: number) {
        return this.eventsRepository.find({
            where: { userId },
            order: { eventId: 'DESC' },
        });
    }

    // Получение мероприятия для административного управления.
    async findForManagement(eventId: number) {
        const event = await this.eventsRepository.findOne({
            where: { eventId },
        });

        if (!event) {
            throw new NotFoundException('Мероприятие не найдено');
        }

        return this.buildEventDetails(this.dataSource.manager, event);
    }

    // Получение опубликованного мероприятия для публичной страницы.
    async findPublishedById(eventId: number) {
        const event = await this.eventsRepository.findOne({
            where: {
                eventId,
                status: 'published',
            },
        });

        if (!event) {
            throw new NotFoundException('Опубликованное мероприятие не найдено');
        }

        return this.buildEventDetails(this.dataSource.manager, event);
    }

    // Удаление мероприятия.
    async remove(eventId: number) {
        const event = await this.eventsRepository.findOne({
            where: { eventId },
        });

        if (!event) {
            throw new NotFoundException('Мероприятие не найдено');
        }

        try {
            await this.eventsRepository.remove(event);

            return {
                message: 'Мероприятие успешно удалено',
            };
        } catch (error) {
            if (
                error instanceof QueryFailedError &&
                (
                    error as QueryFailedError & {
                        driverError?: { code?: string };
                    }
                ).driverError?.code === '23503'
            ) {
                throw new ConflictException('Нельзя удалить мероприятие: существуют связанные записи');
            }

            throw error;
        }
    }

    // Проверка периода мероприятия.
    private validateEventDates(startDate?: string | null, endDate?: string | null) {
        if (startDate && endDate && endDate < startDate) {
            throw new BadRequestException('Дата окончания не может быть раньше даты начала');
        }
    }

    // Синхронизация площадок и их физических локаций.
    // Объекты с ID обновляются, без ID создаются.
    // Отсутствующие в массиве объекты удаляются.
    private async syncVenues(manager: EntityManager, eventId: number, venueDtos: SaveVenueDto[]) {
        const venuesRepository = manager.getRepository(Venue);
        const relationsRepository = manager.getRepository(VenueLocation);
        const locationsRepository = manager.getRepository(Location);

        const existingVenues = await venuesRepository.find({
            where: { eventId },
        });

        const existingById = new Map(existingVenues.map((venue) => [venue.venueId, venue]));

        const processedVenueIds = new Set<number>();

        for (const dto of venueDtos) {
            let venue: Venue;

            if (dto.venueId !== undefined) {
                const existingVenue = existingById.get(dto.venueId);

                if (!existingVenue) {
                    throw new BadRequestException(`Площадка ${dto.venueId} не найдена у этого мероприятия`);
                }

                if (processedVenueIds.has(dto.venueId)) {
                    throw new BadRequestException(`Площадка ${dto.venueId} передана несколько раз`);
                }

                venue = existingVenue;
            } else {
                venue = venuesRepository.create({
                    eventId,
                });
            }

            if (dto.name !== undefined) {
                venue.name = dto.name?.trim() || null;
            }

            if (dto.description !== undefined) {
                venue.description = dto.description?.trim() || null;
            }

            if (dto.venueDate !== undefined) {
                venue.venueDate = dto.venueDate || null;
            }

            if (dto.startTime !== undefined) {
                venue.startTime = dto.startTime || null;
            }

            if (dto.endTime !== undefined) {
                venue.endTime = dto.endTime || null;
            }

            this.validateVenueTimes(venue.startTime, venue.endTime);

            venue = await venuesRepository.save(venue);
            processedVenueIds.add(venue.venueId);

            const locationIds = new Set<number>((dto.locationIds ?? []).map(Number));

            for (const manualLocation of dto.manualLocations ?? []) {
                const locationId = await this.resolveManualLocation(locationsRepository, manualLocation);

                if (locationId !== null) {
                    locationIds.add(locationId);
                }
            }

            if (locationIds.size > 0) {
                const foundLocations = await locationsRepository.find({
                    where: {
                        locationId: In([...locationIds]),
                    },
                });

                if (foundLocations.length !== locationIds.size) {
                    throw new BadRequestException('Одна или несколько выбранных физических локаций не найдены');
                }
            }

            // Заменяем связи площадки с локациями.
            await relationsRepository.delete({
                venueId: venue.venueId,
            });

            if (locationIds.size > 0) {
                await relationsRepository.save(
                    [...locationIds].map((locationId) =>
                        relationsRepository.create({
                            venueId: venue.venueId,
                            locationId,
                        }),
                    ),
                );
            }
        }

        // Удаляем площадки, которых больше нет в переданном массиве.
        const removedVenueIds = existingVenues.filter((venue) => !processedVenueIds.has(venue.venueId)).map((venue) => venue.venueId);

        if (removedVenueIds.length > 0) {
            await relationsRepository.delete({
                venueId: In(removedVenueIds),
            });

            await venuesRepository.delete({
                venueId: In(removedVenueIds),
            });
        }
    }

    // Привязка существующей локации или создание новой.
    // Поиск по содержимому (name, place, address), чтобы не плодить дубликаты.
    private async resolveManualLocation(locationsRepository: Repository<Location>, dto: SaveLocationDto): Promise<number | null> {
        if (dto.locationId !== undefined) {
            const location = await locationsRepository.findOne({
                where: {
                    locationId: dto.locationId,
                },
            });

            if (!location) {
                throw new BadRequestException(`Физическая локация ${dto.locationId} не найдена`);
            }

            return location.locationId;
        }

        const name = dto.name?.trim() || null;
        const place = dto.place?.trim() || null;
        const address = dto.address?.trim() || null;

        if (!name && !place && !address) {
            return null;
        }

        const existing = await this.findLocationByContent(locationsRepository, {
            name,
            place,
            address,
        });

        if (existing) {
            return existing.locationId;
        }

        try {
            const location = await locationsRepository.save(
                locationsRepository.create({
                    name,
                    place,
                    address,
                }),
            );

            return location.locationId;
        } catch (error) {
            // Параллельный запрос мог успеть создать такую же локацию.
            // Уникальный индекс locations_unique_content выбросит 23505.
            if (error instanceof QueryFailedError && (error.driverError as PostgresError).code === '23505') {
                const retry = await this.findLocationByContent(locationsRepository, {
                    name,
                    place,
                    address,
                });

                if (retry) {
                    return retry.locationId;
                }
            }

            throw error;
        }
    }

    // Поиск локации по нормализованному содержимому.
    private async findLocationByContent(
        locationsRepository: Repository<Location>,
        data: {
            name: string | null;
            place: string | null;
            address: string | null;
        },
    ): Promise<Location | null> {
        return locationsRepository
            .createQueryBuilder('location')
            .where("LOWER(TRIM(COALESCE(location.name, ''))) = LOWER(TRIM(COALESCE(:name, '')))", {
                name: data.name,
            })
            .andWhere("LOWER(TRIM(COALESCE(location.place, ''))) = LOWER(TRIM(COALESCE(:place, '')))", {
                place: data.place,
            })
            .andWhere("LOWER(TRIM(COALESCE(location.address, ''))) = LOWER(TRIM(COALESCE(:address, '')))", {
                address: data.address,
            })
            .getOne();
    }

    // Синхронизация расписания с сохранением ID существующих пунктов.
    private async syncSchedule(manager: EntityManager, eventId: number, scheduleDtos: SaveScheduleItemDto[]) {
        const repository = manager.getRepository(ScheduleItem);

        const existingItems = await repository.find({
            where: { eventId },
        });

        const existingById = new Map(existingItems.map((item) => [item.scheduleItemId, item]));

        const processedIds = new Set<number>();

        for (const dto of scheduleDtos) {
            let item: ScheduleItem;

            if (dto.scheduleItemId !== undefined) {
                const existingItem = existingById.get(dto.scheduleItemId);

                if (!existingItem) {
                    throw new BadRequestException(`Пункт расписания ${dto.scheduleItemId} не найден у этого мероприятия`);
                }

                if (processedIds.has(dto.scheduleItemId)) {
                    throw new BadRequestException(`Пункт расписания ${dto.scheduleItemId} передан несколько раз`);
                }

                item = existingItem;
            } else {
                item = repository.create({
                    eventId,
                });
            }

            if (dto.description !== undefined) {
                item.description = dto.description?.trim() || null;
            }

            if (dto.itemDate !== undefined) {
                item.itemDate = dto.itemDate || null;
            }

            if (dto.startTime !== undefined) {
                item.startTime = dto.startTime || null;
            }

            if (dto.endTime !== undefined) {
                item.endTime = dto.endTime || null;
            }

            this.validateScheduleTimes(item.startTime, item.endTime);

            item = await repository.save(item);
            processedIds.add(item.scheduleItemId);
        }

        // Удаляем пункты, отсутствующие в переданном массиве.
        const removedIds = existingItems.filter((item) => !processedIds.has(item.scheduleItemId)).map((item) => item.scheduleItemId);

        if (removedIds.length > 0) {
            await repository.delete({
                scheduleItemId: In(removedIds),
            });
        }
    }

    // Проверка времени площадки или пункта расписания.
    private validateVenueTimes(startTime?: string | null, endTime?: string | null) {
        if (startTime && endTime && this.timeToSeconds(endTime) <= this.timeToSeconds(startTime)) {
            throw new BadRequestException('Время окончания должно быть позже времени начала');
        }
    }

    private validateScheduleTimes(startTime?: string | null, endTime?: string | null) {
        if (startTime && endTime && this.timeToSeconds(endTime) <= this.timeToSeconds(startTime)) {
            throw new BadRequestException('Время окончания пункта расписания должно быть позже времени начала');
        }
    }

    private timeToSeconds(time: string): number {
        const [hours, minutes, seconds = '0'] = time.split(':');

        return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    }

    // Проверка всех обязательных полей перед публикацией.
    private async validateForPublication(manager: EntityManager, eventId: number, event: Event) {
        // Общая информация мероприятия.
        if (!event.title?.trim()) {
            throw new BadRequestException('Укажите название мероприятия');
        }

        if (!event.description?.trim()) {
            throw new BadRequestException('Укажите описание мероприятия');
        }

        if (!event.startDate) {
            throw new BadRequestException('Укажите дату начала мероприятия');
        }

        if (!event.endDate) {
            throw new BadRequestException('Укажите дату окончания мероприятия');
        }

        this.validateEventDates(event.startDate, event.endDate);

        const venuesRepository = manager.getRepository(Venue);
        const relationsRepository = manager.getRepository(VenueLocation);
        const locationsRepository = manager.getRepository(Location);
        const scheduleRepository = manager.getRepository(ScheduleItem);

        // Проверка площадок.
        const venues = await venuesRepository.find({
            where: { eventId },
        });

        if (venues.length === 0) {
            throw new BadRequestException('Добавьте хотя бы одну площадку мероприятия');
        }

        for (const venue of venues) {
            if (!venue.name?.trim()) {
                throw new BadRequestException('У каждой площадки должно быть название');
            }

            if (!venue.description?.trim()) {
                throw new BadRequestException(`Заполните описание площадки «${venue.name}»`);
            }

            if (!venue.venueDate) {
                throw new BadRequestException(`Укажите дату площадки «${venue.name}»`);
            }

            if (venue.venueDate < event.startDate || venue.venueDate > event.endDate) {
                throw new BadRequestException(`Дата площадки «${venue.name}» должна входить в период мероприятия`);
            }

            if (!venue.startTime) {
                throw new BadRequestException(`Укажите время начала площадки «${venue.name}»`);
            }

            if (!venue.endTime) {
                throw new BadRequestException(`Укажите время окончания площадки «${venue.name}»`);
            }

            this.validateVenueTimes(venue.startTime, venue.endTime);

            // Проверяем физические локации площадки.
            const relations = await relationsRepository.find({
                where: { venueId: venue.venueId },
            });

            if (relations.length === 0) {
                throw new BadRequestException(`Добавьте локацию для площадки «${venue.name}»`);
            }

            const locationIds = relations.map((relation) => relation.locationId);

            const locations = await locationsRepository.find({
                where: {
                    locationId: In(locationIds),
                },
            });

            for (const location of locations) {
                if (!location.name?.trim()) {
                    throw new BadRequestException(`Укажите название локации для площадки «${venue.name}»`);
                }

                if (!location.place?.trim()) {
                    throw new BadRequestException(`Укажите место расположения локации «${location.name}»`);
                }

                if (!location.address?.trim()) {
                    throw new BadRequestException(`Укажите адрес  локации «${location.name}»`);
                }
            }

            if (locations.length !== relations.length) {
                throw new BadRequestException(`Не все физические локации площадки «${venue.name}» существуют`);
            }
        }

        // Проверка расписания.
        const schedule = await scheduleRepository.find({
            where: { eventId },
        });

        if (schedule.length === 0) {
            throw new BadRequestException('Добавьте хотя бы один пункт расписания');
        }

        for (const item of schedule) {
            if (!item.description?.trim()) {
                throw new BadRequestException('Заполните описание каждого пункта расписания');
            }

            if (!item.itemDate) {
                throw new BadRequestException('Укажите дату каждого пункта расписания');
            }

            if (item.itemDate < event.startDate || item.itemDate > event.endDate) {
                throw new BadRequestException('Даты расписания должны входить в период мероприятия');
            }

            if (!item.startTime) {
                throw new BadRequestException('Укажите время начала каждого пункта расписания');
            }

            if (!item.endTime) {
                throw new BadRequestException('Укажите время окончания каждого пункта расписания');
            }

            this.validateScheduleTimes(item.startTime, item.endTime);
        }
    }

    // Формирование мероприятия вместе с площадками, локациями и расписанием.
    private async buildEventDetails(manager: EntityManager, event: Event) {
        const venuesRepository = manager.getRepository(Venue);
        const relationsRepository = manager.getRepository(VenueLocation);
        const locationsRepository = manager.getRepository(Location);
        const scheduleRepository = manager.getRepository(ScheduleItem);

        const venues = await venuesRepository.find({
            where: {
                eventId: event.eventId,
            },
            order: {
                venueDate: 'ASC',
                startTime: 'ASC',
                venueId: 'ASC',
            },
        });

        const detailedVenues = await Promise.all(
            venues.map(async (venue) => {
                const relations = await relationsRepository.find({
                    where: {
                        venueId: venue.venueId,
                    },
                });

                const locationIds = relations.map((relation) => relation.locationId);

                const locations =
                    locationIds.length > 0
                        ? await locationsRepository.find({
                              where: {
                                  locationId: In(locationIds),
                              },
                          })
                        : [];

                return {
                    ...venue,
                    locations,
                };
            }),
        );

        const schedule = await scheduleRepository.find({
            where: {
                eventId: event.eventId,
            },
            order: {
                itemDate: 'ASC',
                startTime: 'ASC',
                scheduleItemId: 'ASC',
            },
        });

        return {
            ...event,
            venues: detailedVenues,
            schedule,
        };
    }
}
