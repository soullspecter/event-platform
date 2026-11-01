import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Event } from '../../../models/events/event.entity';
import { Venue } from '../../../models/venues/venue.entity';
import { VenueLocation } from '../../../models/venues/venue-location.entity';
import { Location } from '../../../models/locations/location.entity';
import { SaveVenueDto } from './dto/save-venue.dto';

@Injectable()
export class VenuesService {
    constructor(
        @InjectRepository(Event)
        private readonly eventsRepository: Repository<Event>,

        @InjectRepository(Venue)
        private readonly venuesRepository: Repository<Venue>,

        @InjectRepository(Location)
        private readonly locationsRepository: Repository<Location>,

        @InjectRepository(VenueLocation)
        private readonly venueLocationsRepository: Repository<VenueLocation>,
    ) {}

    // Создание площадки.
    async create(eventId: number, dto: SaveVenueDto) {
        const event = await this.getEvent(eventId);

        this.validateVenueData(event, dto);

        const venue = this.venuesRepository.create({
            eventId,
            name: dto.name?.trim() || null,
            description: dto.description?.trim() || null,
            venueDate: dto.venueDate || null,
            startTime: dto.startTime || null,
            endTime: dto.endTime || null,
        });

        const savedVenue = await this.venuesRepository.save(venue);

        return this.findOne(eventId, savedVenue.venueId);
    }

    // Получение всех площадок мероприятия.
    async findAll(eventId: number) {
        await this.getEvent(eventId);

        const venues = await this.venuesRepository.find({
            where: { eventId },
            order: {
                venueDate: 'ASC',
                startTime: 'ASC',
                venueId: 'ASC',
            },
        });

        return Promise.all(venues.map((venue) => this.withLocations(venue)));
    }

    // Получение одной площадки.
    async findOne(eventId: number, venueId: number) {
        await this.getEvent(eventId);

        const venue = await this.getVenue(eventId, venueId);

        return this.withLocations(venue);
    }

    // Обновление площадки.
    async update(eventId: number, venueId: number, dto: SaveVenueDto) {
        const event = await this.getEvent(eventId);
        const venue = await this.getVenue(eventId, venueId);

        const updatedData = {
            name: dto.name !== undefined ? dto.name?.trim() || null : venue.name,

            description: dto.description !== undefined ? dto.description?.trim() || null : venue.description,

            venueDate: dto.venueDate !== undefined ? dto.venueDate || null : venue.venueDate,

            startTime: dto.startTime !== undefined ? dto.startTime || null : venue.startTime,

            endTime: dto.endTime !== undefined ? dto.endTime || null : venue.endTime,
        };

        this.validateVenueData(event, updatedData);

        Object.assign(venue, updatedData);

        await this.venuesRepository.save(venue);

        return this.findOne(eventId, venueId);
    }

    // Удаление площадки.
    async remove(eventId: number, venueId: number) {
        await this.getEvent(eventId);

        const venue = await this.getVenue(eventId, venueId);

        await this.venuesRepository.remove(venue);

        return {
            message: 'Площадка успешно удалена',
        };
    }

    // Привязка физической локации к площадке.
    async attachLocation(eventId: number, venueId: number, locationId: number) {
        await this.getEvent(eventId);
        await this.getVenue(eventId, venueId);

        const location = await this.locationsRepository.findOneBy({
            locationId,
        });

        if (!location) {
            throw new NotFoundException(`Физическая локация ${locationId} не найдена`);
        }

        const existing = await this.venueLocationsRepository.findOneBy({
            venueId,
            locationId,
        });

        if (existing) {
            throw new ConflictException('Эта локация уже привязана к площадке');
        }

        const relation = this.venueLocationsRepository.create({
            venueId,
            locationId,
        });

        await this.venueLocationsRepository.save(relation);

        return this.findOne(eventId, venueId);
    }

    // Отвязка физической локации от площадки.
    async detachLocation(eventId: number, venueId: number, locationId: number) {
        await this.getEvent(eventId);
        await this.getVenue(eventId, venueId);

        const relation = await this.venueLocationsRepository.findOneBy({
            venueId,
            locationId,
        });

        if (!relation) {
            throw new NotFoundException('Эта локация не привязана к площадке');
        }

        await this.venueLocationsRepository.remove(relation);

        return this.findOne(eventId, venueId);
    }

    // Проверка существования мероприятия.
    private async getEvent(eventId: number) {
        const event = await this.eventsRepository.findOne({
            where: { eventId },
        });

        if (!event) {
            throw new NotFoundException(`Мероприятие ${eventId} не найдено`);
        }

        return event;
    }

    // Проверка принадлежности площадки мероприятию.
    private async getVenue(eventId: number, venueId: number) {
        const venue = await this.venuesRepository.findOneBy({
            venueId,
            eventId,
        });

        if (!venue) {
            throw new NotFoundException(`Площадка ${venueId} не найдена у мероприятия ${eventId}`);
        }

        return venue;
    }

    // Получение площадки вместе с физическими локациями.
    private async withLocations(venue: Venue) {
        const relations = await this.venueLocationsRepository.find({
            where: {
                venueId: venue.venueId,
            },
        });

        const locations = await Promise.all(
            relations.map((relation) =>
                this.locationsRepository.findOneBy({
                    locationId: relation.locationId,
                }),
            ),
        );

        return {
            ...venue,
            locations: locations.filter((location) => location !== null),
        };
    }

    // Проверка дат и времени площадки.
    private validateVenueData(
        event: Event,
        data: {
            venueDate?: string | Date | null;
            startTime?: string | null;
            endTime?: string | null;
        },
    ) {
        if (data.startTime && data.endTime && this.timeToSeconds(data.endTime) <= this.timeToSeconds(data.startTime)) {
            throw new BadRequestException('Время окончания должно быть позже времени начала');
        }

        if (data.venueDate) {
            const venueDate = this.toDateString(data.venueDate);

            if (event.startDate) {
                const eventStart = this.toDateString(event.startDate);

                if (venueDate < eventStart) {
                    throw new BadRequestException('Дата площадки не может быть раньше начала мероприятия');
                }
            }

            if (event.endDate) {
                const eventEnd = this.toDateString(event.endDate);

                if (venueDate > eventEnd) {
                    throw new BadRequestException('Дата площадки не может быть позже окончания мероприятия');
                }
            }
        }
    }

    private toDateString(value: string | Date): string {
        if (value instanceof Date) {
            return value.toISOString().slice(0, 10);
        }

        return value.slice(0, 10);
    }

    private timeToSeconds(time: string): number {
        const [hours, minutes, seconds = '0'] = time.split(':');

        return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    }
}
