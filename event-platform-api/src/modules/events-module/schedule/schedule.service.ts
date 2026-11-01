import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Event } from '../../../models/events/event.entity';
import { ScheduleItem } from '../../../models/schedule/schedule-item.entity';
import { SaveScheduleItemDto } from './dto/save-schedule-item.dto';

@Injectable()
export class ScheduleService {
    constructor(
        @InjectRepository(Event)
        private readonly eventsRepository: Repository<Event>,

        @InjectRepository(ScheduleItem)
        private readonly scheduleRepository: Repository<ScheduleItem>,
    ) {}

    // Создание пункта расписания.
    async create(eventId: number, dto: SaveScheduleItemDto) {
        const event = await this.findEvent(eventId);

        this.validateScheduleItem(event, dto);

        const item = this.scheduleRepository.create({
            eventId,
            description: dto.description?.trim() || null,
            itemDate: dto.itemDate ?? null,
            startTime: dto.startTime ?? null,
            endTime: dto.endTime ?? null,
        });

        return this.scheduleRepository.save(item);
    }

    // Получение расписания опубликованного мероприятия.
    async findPublished(eventId: number) {
        const event = await this.eventsRepository.findOne({
            where: {
                eventId,
                status: 'published',
            },
        });

        if (!event) {
            throw new NotFoundException('Опубликованное мероприятие не найдено');
        }

        return this.getSchedule(eventId);
    }

    // Получение расписания для административного управления.
    async findMine(eventId: number) {
        await this.findEvent(eventId);

        return this.getSchedule(eventId);
    }

    // Обновление пункта расписания.
    async update(eventId: number, scheduleItemId: number, dto: SaveScheduleItemDto) {
        const event = await this.findEvent(eventId);
        const item = await this.findItem(eventId, scheduleItemId);

        if (dto.description !== undefined) {
            item.description = dto.description?.trim() || null;
        }

        if (dto.itemDate !== undefined) {
            item.itemDate = dto.itemDate;
        }

        if (dto.startTime !== undefined) {
            item.startTime = dto.startTime;
        }

        if (dto.endTime !== undefined) {
            item.endTime = dto.endTime;
        }

        this.validateScheduleItem(event, {
            description: item.description,
            itemDate: item.itemDate,
            startTime: item.startTime,
            endTime: item.endTime,
        });

        return this.scheduleRepository.save(item);
    }

    // Удаление пункта расписания.
    async remove(eventId: number, scheduleItemId: number) {
        await this.findEvent(eventId);

        const item = await this.findItem(eventId, scheduleItemId);

        await this.scheduleRepository.remove(item);

        return {
            message: 'Пункт расписания удалён',
        };
    }

    // Получение и сортировка пунктов расписания.
    private async getSchedule(eventId: number) {
        const items = await this.scheduleRepository.find({
            where: { eventId },
        });

        return items.sort((a, b) => {
            const dateA = a.itemDate ?? '';
            const dateB = b.itemDate ?? '';

            if (dateA !== dateB) {
                return dateA.localeCompare(dateB);
            }

            const timeA = a.startTime ?? '';
            const timeB = b.startTime ?? '';

            if (timeA !== timeB) {
                return timeA.localeCompare(timeB);
            }

            return a.scheduleItemId - b.scheduleItemId;
        });
    }

    // Проверка существования мероприятия.
    private async findEvent(eventId: number) {
        const event = await this.eventsRepository.findOne({
            where: { eventId },
        });

        if (!event) {
            throw new NotFoundException('Мероприятие не найдено');
        }

        return event;
    }

    // Проверка принадлежности пункта расписания мероприятию.
    private async findItem(eventId: number, scheduleItemId: number) {
        const item = await this.scheduleRepository.findOne({
            where: {
                eventId,
                scheduleItemId,
            },
        });

        if (!item) {
            throw new NotFoundException('Пункт расписания не найден у этого мероприятия');
        }

        return item;
    }

    // Проверка даты и времени пункта расписания.
    private validateScheduleItem(
        event: Event,
        data: {
            description?: string | null;
            itemDate?: string | null;
            startTime?: string | null;
            endTime?: string | null;
        },
    ) {
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
