import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';

import { Event } from '../events/entity/event.entity';
import { LocationPlacesService } from '../location-places/location-places.service';

import { CommonScheduleValidator } from './common-schedule.validator';
import { SaveCommonScheduleItemDto } from './dto/save-common-schedule-item.dto';
import { CommonScheduleItem } from './entity/common-schedule-item.entity';
import { cleanText } from './utils/text.util';
import { normalizeTime } from './utils/time.util';

@Injectable()
export class CommonScheduleService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly locationPlacesService: LocationPlacesService,
        private readonly validator: CommonScheduleValidator,
    ) {}

    async findAllByEvent(eventId: number, manager: EntityManager = this.dataSource.manager): Promise<CommonScheduleItem[]> {
        return manager.getRepository(CommonScheduleItem).find({
            where: { eventId },
            relations: { locationPlace: { location: true } },
            order: { itemDate: 'ASC', startTime: 'ASC' },
        });
    }

    async create(eventId: number, dto: SaveCommonScheduleItemDto) {
        return this.dataSource.transaction(async (manager) => {
            const event = await this.findEvent(manager, eventId);
            const item = manager.getRepository(CommonScheduleItem).create({ eventId });
            await this.applyDto(manager, event, item, dto);
            return manager.getRepository(CommonScheduleItem).save(item);
        });
    }

    async update(eventId: number, commonItemId: number, dto: SaveCommonScheduleItemDto) {
        return this.dataSource.transaction(async (manager) => {
            const event = await this.findEvent(manager, eventId);
            const repo = manager.getRepository(CommonScheduleItem);
            const item = await repo.findOne({ where: { eventId, commonItemId } });

            if (!item) {
                throw new NotFoundException('Пункт общего расписания не найден у этого мероприятия');
            }

            const changed = await this.applyDto(manager, event, item, dto);

            if (changed) {
                await repo.save(item);
            }

            return repo.findOne({
                where: { eventId, commonItemId },
                relations: { locationPlace: { location: true } },
            });
        });
    }

    async replaceForEvent(manager: EntityManager, event: Event, dtos: SaveCommonScheduleItemDto[]): Promise<void> {
        const repo = manager.getRepository(CommonScheduleItem);
        const existing = await repo.find({ where: { eventId: event.eventId } });

        const existingById = new Map(existing.map((item) => [item.commonItemId, item]));

        const keptIds = new Set<number>();

        for (const dto of dtos) {
            let item: CommonScheduleItem;
            let isNew = false;

            if (dto.commonItemId != null) {
                const found = existingById.get(dto.commonItemId);

                if (!found) {
                    throw new BadRequestException(`Пункт общего расписания ${dto.commonItemId} не найден`);
                }

                if (keptIds.has(dto.commonItemId)) {
                    throw new BadRequestException(`Пункт общего расписания ${dto.commonItemId} передан дважды`);
                }

                item = found;
            } else {
                item = repo.create({ eventId: event.eventId });
                isNew = true;
            }

            const changed = await this.applyDto(manager, event, item, dto);

            if (isNew || changed) {
                item = await repo.save(item);
            }

            keptIds.add(item.commonItemId);
        }

        const removedIds = existing.filter((item) => !keptIds.has(item.commonItemId)).map((item) => item.commonItemId);

        if (removedIds.length > 0) {
            await repo.delete({
                eventId: event.eventId,
                commonItemId: In(removedIds),
            });
        }
    }

    async remove(eventId: number, commonItemId: number) {
        const result = await this.dataSource.getRepository(CommonScheduleItem).delete({ eventId, commonItemId });
        if (!result.affected) throw new NotFoundException('Пункт общего расписания не найден у этого мероприятия');
        return { message: 'Пункт общего расписания удалён' };
    }

    private async applyDto(manager: EntityManager, event: Event, item: CommonScheduleItem, dto: SaveCommonScheduleItemDto): Promise<boolean> {
        let changed = false;

        if (dto.name !== undefined) {
            const value = cleanText(dto.name);

            if (item.name !== value) {
                item.name = value;
                changed = true;
            }
        }

        if (dto.itemDate !== undefined) {
            const value = dto.itemDate ?? null;

            if (item.itemDate !== value) {
                item.itemDate = value;
                changed = true;
            }
        }

        if (dto.startTime !== undefined) {
            const value = dto.startTime ? normalizeTime(dto.startTime) : null;

            if (item.startTime !== value) {
                item.startTime = value;
                changed = true;
            }
        }

        if (dto.endTime !== undefined) {
            const value = dto.endTime ? normalizeTime(dto.endTime) : null;

            if (item.endTime !== value) {
                item.endTime = value;
                changed = true;
            }
        }

        if (dto.location !== undefined) {
            const locationPlaceId = await this.locationPlacesService.resolveId(manager, dto);

            if (item.locationPlaceId !== locationPlaceId) {
                item.locationPlaceId = locationPlaceId;
                item.locationPlace = null;
                changed = true;
            }
        }

        this.validator.validateSlot(event, item);

        return changed;
    }

    private async findEvent(manager: EntityManager, eventId: number): Promise<Event> {
        const event = await manager.getRepository(Event).findOne({ where: { eventId } });
        if (!event) throw new NotFoundException('Мероприятие не найдено');
        return event;
    }
}
