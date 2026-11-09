import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Event } from '../events/entity/event.entity';
import { ScheduleItem } from './entity/schedule-item.entity';
import { SaveScheduleItemDto } from './dto/save-schedule-item.dto';

@Injectable()
export class ScheduleService {
    constructor(
        @InjectRepository(Event)
        private readonly eventsRepository: Repository<Event>,

        @InjectRepository(ScheduleItem)
        private readonly scheduleRepository: Repository<ScheduleItem>,
    ) {}

    async create(eventId: number, dto: SaveScheduleItemDto) {
        const event = await this.findEvent(eventId);
        this.validateScheduleItem(event, dto);

        const item = new ScheduleItem();
        item.eventId = eventId;
        item.name = dto.name?.trim() || null;
        item.itemDate = dto.itemDate ?? null;
        item.startTime = dto.startTime ?? null;
        item.endTime = dto.endTime ?? null;

        return this.scheduleRepository.save(item);
    }

    async findPublished(eventId: number) {
        const event = await this.eventsRepository.findOne({
            where: { eventId, status: 'published' },
        });
        if (!event) throw new NotFoundException('Опубликованное мероприятие не найдено');
        return this.getSchedule(eventId);
    }

    async findMine(eventId: number) {
        await this.findEvent(eventId);
        return this.getSchedule(eventId);
    }

    async update(eventId: number, scheduleItemId: number, dto: SaveScheduleItemDto) {
        const event = await this.findEvent(eventId);
        const item = await this.findItem(eventId, scheduleItemId);

        if (dto.name !== undefined) item.name = dto.name?.trim() || null;
        if (dto.itemDate !== undefined) item.itemDate = dto.itemDate || null;
        if (dto.startTime !== undefined) item.startTime = dto.startTime || null;
        if (dto.endTime !== undefined) item.endTime = dto.endTime || null;

        this.validateScheduleItem(event, {
            itemDate: item.itemDate,
            startTime: item.startTime,
            endTime: item.endTime,
        });

        return this.scheduleRepository.save(item);
    }

    async remove(eventId: number, scheduleItemId: number) {
        await this.findEvent(eventId);
        const item = await this.findItem(eventId, scheduleItemId);
        await this.scheduleRepository.remove(item);
        return { message: 'Пункт расписания удалён' };
    }

    private async getSchedule(eventId: number) {
        const items = await this.scheduleRepository.find({
            where: { eventId },
            relations: { programs: { locationPlace: { location: true } } },
        });
        return items.sort((a, b) => {
            const dateA = a.itemDate ?? '';
            const dateB = b.itemDate ?? '';
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            const timeA = a.startTime ?? '';
            const timeB = b.startTime ?? '';
            if (timeA !== timeB) return timeA.localeCompare(timeB);
            return a.scheduleItemId - b.scheduleItemId;
        });
    }

    private async findEvent(eventId: number) {
        const event = await this.eventsRepository.findOne({ where: { eventId } });
        if (!event) throw new NotFoundException('Мероприятие не найдено');
        return event;
    }

    private async findItem(eventId: number, scheduleItemId: number) {
        const item = await this.scheduleRepository.findOne({
            where: { eventId, scheduleItemId },
        });
        if (!item) throw new NotFoundException('Пункт расписания не найден у этого мероприятия');
        return item;
    }

    private validateScheduleItem(event: Event, data: { itemDate?: string | null; startTime?: string | null; endTime?: string | null }) {
        if (data.itemDate && event.startDate && data.itemDate < event.startDate) {
            throw new BadRequestException('Дата пункта расписания раньше даты начала мероприятия');
        }
        if (data.itemDate && event.endDate && data.itemDate > event.endDate) {
            throw new BadRequestException('Дата пункта расписания позже даты окончания мероприятия');
        }
        if (data.startTime && data.endTime && this.timeToSeconds(data.endTime) <= this.timeToSeconds(data.startTime)) {
            throw new BadRequestException('Время окончания должно быть позже времени начала');
        }
    }

    private timeToSeconds(time: string): number {
        const [hours, minutes, seconds = '0'] = time.split(':');
        return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    }
}
