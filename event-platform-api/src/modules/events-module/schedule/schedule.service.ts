import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { CommonScheduleService } from '../common-schedule/common-schedule.service';
import { CommonScheduleItem } from '../common-schedule/entity/common-schedule-item.entity';
import { Event } from '../events/entity/event.entity';
import { LocationPlacesService } from '../location-places/location-places.service';
import { ProgramSchedule } from '../program-schedule/entity/program-schedule.entity';
import { Program } from '../programs/entity/program.entity';
import { SaveScheduleItemDto } from './dto/save-schedule-item.dto';
import { ScheduleItem } from './entity/schedule-item.entity';
import { ScheduleItemName } from './entity/schedule-item-name.entity';

@Injectable()
export class ScheduleService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly commonScheduleService: CommonScheduleService,
        private readonly locationPlacesService: LocationPlacesService,
        @InjectRepository(Event)
        private readonly eventsRepository: Repository<Event>,
    ) {}

    async findPublished(eventId: number) {
        const event = await this.eventsRepository.findOne({
            where: { eventId, status: 'published' },
        });

        if (!event) {
            throw new NotFoundException('Опубликованное мероприятие не найдено');
        }

        return this.buildSchedule(eventId);
    }

    async findMine(eventId: number) {
        await this.findEvent(this.dataSource.manager, eventId);
        return this.buildSchedule(eventId);
    }

    async update(eventId: number, scheduleItemId: number, dto: SaveScheduleItemDto) {
        return this.dataSource.transaction(async (manager) => {
            const event = await this.findEvent(manager, eventId);
            const item = await this.findEventSlot(manager, eventId, scheduleItemId);

            if (dto.itemDate !== undefined) {
                item.itemDate = dto.itemDate ?? null;
            }

            if (dto.startTime !== undefined) {
                item.startTime = dto.startTime ? this.normalizeTime(dto.startTime) : null;
            }

            if (dto.endTime !== undefined) {
                item.endTime = dto.endTime ? this.normalizeTime(dto.endTime) : null;
            }

            if (dto.location !== undefined) {
                item.locationPlaceId = await this.locationPlacesService.resolveId(manager, dto);
                item.locationPlace = null;
            }

            this.validateSlot(event, item);

            const savedItem = await manager.getRepository(ScheduleItem).save(item);

            // Если names передан, полностью заменяем список названий.
            if (dto.names !== undefined) {
                await this.replaceNames(manager, savedItem.scheduleItemId, dto.names);
            }

            const names = await this.findNames(manager, savedItem.scheduleItemId);

            return {
                ...savedItem,
                names,
            };
        });
    }

    async remove(eventId: number, scheduleItemId: number) {
        return this.dataSource.transaction(async (manager) => {
            await this.findEvent(manager, eventId);

            const item = await this.findEventSlot(manager, eventId, scheduleItemId);

            await manager.getRepository(ScheduleItem).remove(item);

            return { message: 'Пункт расписания удалён' };
        });
    }

    async getOrCreateSlot(manager: EntityManager, event: Event, dto: SaveScheduleItemDto): Promise<ScheduleItem> {
        const data = {
            itemDate: dto.itemDate ?? null,
            startTime: dto.startTime ? this.normalizeTime(dto.startTime) : null,
            endTime: dto.endTime ? this.normalizeTime(dto.endTime) : null,
            locationPlaceId: await this.locationPlacesService.resolveId(manager, dto),
        };

        this.validateSlot(event, data);

        const repository = manager.getRepository(ScheduleItem);

        // Ищем слот по дате, времени и месту.
        // Названия не участвуют в поиске: у одного слота их может быть несколько.
        const query = repository.createQueryBuilder('si').innerJoin('si.programSchedules', 'ps').innerJoin('ps.program', 'p', 'p.eventId = :eventId', {
            eventId: event.eventId,
        });

        const columns = {
            itemDate: 'si.itemDate',
            startTime: 'si.startTime',
            endTime: 'si.endTime',
            locationPlaceId: 'si.locationPlaceId',
        } as const;

        for (const [field, column] of Object.entries(columns)) {
            const value = data[field as keyof typeof data];

            if (value === null) {
                query.andWhere(`${column} IS NULL`);
            } else {
                query.andWhere(`${column} = :${field}`, {
                    [field]: value,
                });
            }
        }

        let existing = await query.orderBy('si.scheduleItemId', 'ASC').getOne();

        // Если слот не найден, создаём новый.
        if (!existing) {
            existing = await repository.save(repository.create(data));
        }

        // Добавляем названия, которых ещё нет у этого слота.
        await this.addNames(manager, existing.scheduleItemId, dto.names);

        return existing;
    }

    /** Добавляет названия к слоту, не создавая дубликаты. */
    private async addNames(manager: EntityManager, scheduleItemId: number, names?: string[] | null): Promise<void> {
        const cleanedNames = this.cleanNames(names);

        if (cleanedNames.length === 0) return;

        const repository = manager.getRepository(ScheduleItemName);

        const existingNames = await repository.find({
            where: { scheduleItemId },
        });

        const existingSet = new Set(existingNames.map((item) => item.name));

        const newNames = cleanedNames
            .filter((name) => !existingSet.has(name))
            .map((name) =>
                repository.create({
                    scheduleItemId,
                    name,
                }),
            );

        if (newNames.length > 0) {
            await repository.save(newNames);
        }
    }

    /** Полностью заменяет список названий слота. */
    private async replaceNames(manager: EntityManager, scheduleItemId: number, names: string[] | null): Promise<void> {
        const repository = manager.getRepository(ScheduleItemName);

        await repository.delete({ scheduleItemId });

        const cleanedNames = this.cleanNames(names);

        if (cleanedNames.length === 0) return;

        const entities = cleanedNames.map((name) =>
            repository.create({
                scheduleItemId,
                name,
            }),
        );

        await repository.save(entities);
    }

    /** Возвращает названия слота обычным массивом строк. */
    private async findNames(manager: EntityManager, scheduleItemId: number): Promise<string[]> {
        const items = await manager.getRepository(ScheduleItemName).find({
            where: { scheduleItemId },
            order: { scheduleItemNameId: 'ASC' },
        });

        return items.map((item) => item.name);
    }

    private cleanNames(names?: string[] | null): string[] {
        if (!names) return [];

        return [
            ...new Set(
                names
                    .filter((name): name is string => typeof name === 'string')
                    .map((name) => name.trim())
                    .filter((name) => name.length > 0),
            ),
        ];
    }

    /** Удаляет слоты, на которые больше не ссылается ни одна программа. */
    async removeOrphans(manager: EntityManager, scheduleItemIds: number[]): Promise<void> {
        if (scheduleItemIds.length === 0) return;

        const repository = manager.getRepository(ScheduleItem);

        const orphans = await repository
            .createQueryBuilder('si')
            .leftJoin('si.programSchedules', 'ps')
            .where('si.scheduleItemId IN (:...ids)', {
                ids: scheduleItemIds,
            })
            .andWhere('ps.scheduleItemId IS NULL')
            .getMany();

        if (orphans.length > 0) {
            await repository.remove(orphans);
        }
    }

    /** Id всех слотов, привязанных к программам мероприятия. */
    async findEventSlotIds(manager: EntityManager, eventId: number): Promise<number[]> {
        const links = await manager
            .getRepository(ProgramSchedule)
            .createQueryBuilder('ps')
            .select('ps.scheduleItemId', 'scheduleItemId')
            .innerJoin('ps.program', 'p', 'p.eventId = :eventId', {
                eventId,
            })
            .getRawMany<{ scheduleItemId: number }>();

        return [...new Set(links.map((link) => Number(link.scheduleItemId)))];
    }

    /** Все данные расписания мероприятия: программы и общее расписание. */
    async loadSchedule(eventId: number, manager: EntityManager = this.dataSource.manager) {
        const [programs, commonSchedule] = await Promise.all([this.findPrograms(manager, eventId), this.commonScheduleService.findAllByEvent(eventId, manager)]);

        return { programs, commonSchedule };
    }

    /** Ответ API: программы и общее расписание, сгруппированное по датам. */
    async buildSchedule(eventId: number, manager: EntityManager = this.dataSource.manager) {
        const { programs, commonSchedule } = await this.loadSchedule(eventId, manager);

        const commonScheduleByDate: Record<string, CommonScheduleItem[]> = {};

        for (const item of commonSchedule) {
            (commonScheduleByDate[item.itemDate ?? 'unknown'] ??= []).push(item);
        }

        return {
            programs,
            commonScheduleByDate,
        };
    }

    private async findPrograms(manager: EntityManager, eventId: number) {
        const programs = await manager.getRepository(Program).find({
            where: { eventId },
            relations: {
                programSchedules: {
                    scheduleItem: {
                        locationPlace: {
                            location: true,
                        },
                    },
                },
            },
            order: {
                programId: 'ASC',
            },
        });

        // Собираем id всех слотов.
        const scheduleItemIds = [...new Set(programs.flatMap((program) => program.programSchedules.map((link) => link.scheduleItem.scheduleItemId)))];

        // Одним запросом получаем все названия этих слотов.
        const names =
            scheduleItemIds.length > 0
                ? await manager.getRepository(ScheduleItemName).find({
                      where: {
                          scheduleItemId: In(scheduleItemIds),
                      },
                      order: {
                          scheduleItemNameId: 'ASC',
                      },
                  })
                : [];

        const namesBySlot = new Map<number, string[]>();

        for (const item of names) {
            const slotNames = namesBySlot.get(item.scheduleItemId) ?? [];
            slotNames.push(item.name);
            namesBySlot.set(item.scheduleItemId, slotNames);
        }

        return programs.map(({ programSchedules, ...program }) => ({
            ...program,
            schedule: programSchedules
                .map((link) => ({
                    ...link.scheduleItem,
                    names: namesBySlot.get(link.scheduleItem.scheduleItemId) ?? [],
                }))
                .sort(this.compareByDateTime),
        }));
    }

    private async findEvent(manager: EntityManager, eventId: number): Promise<Event> {
        const event = await manager.getRepository(Event).findOne({
            where: { eventId },
        });

        if (!event) {
            throw new NotFoundException('Мероприятие не найдено');
        }

        return event;
    }

    private async findEventSlot(manager: EntityManager, eventId: number, scheduleItemId: number): Promise<ScheduleItem> {
        const item = await manager
            .getRepository(ScheduleItem)
            .createQueryBuilder('si')
            .innerJoin('si.programSchedules', 'ps')
            .innerJoin('ps.program', 'p', 'p.eventId = :eventId', {
                eventId,
            })
            .where('si.scheduleItemId = :scheduleItemId', {
                scheduleItemId,
            })
            .getOne();

        if (!item) {
            throw new NotFoundException('Пункт расписания не найден у этого мероприятия');
        }

        return item;
    }

    private validateSlot(event: Event, slot: Pick<ScheduleItem, 'itemDate' | 'startTime' | 'endTime'>) {
        if (slot.startTime && slot.endTime && this.timeToSeconds(slot.endTime) === this.timeToSeconds(slot.startTime)) {
            throw new BadRequestException('Время окончания не может совпадать со временем начала');
        }

        if (slot.itemDate) {
            if (event.startDate && slot.itemDate < event.startDate) {
                throw new BadRequestException('Дата пункта расписания раньше даты начала мероприятия');
            }

            if (event.endDate && slot.itemDate > event.endDate) {
                throw new BadRequestException('Дата пункта расписания позже даты окончания мероприятия');
            }
        }
    }

    private compareByDateTime(
        a: {
            itemDate: string | null;
            startTime: string | null;
        },
        b: {
            itemDate: string | null;
            startTime: string | null;
        },
    ): number {
        const da = a.itemDate ?? '';
        const db = b.itemDate ?? '';

        if (da !== db) return da < db ? -1 : 1;

        const ta = a.startTime ?? '';
        const tb = b.startTime ?? '';

        if (ta === tb) return 0;

        return ta < tb ? -1 : 1;
    }

    private timeToSeconds(time: string): number {
        const [h, m, s = '0'] = time.split(':');

        return Number(h) * 3600 + Number(m) * 60 + Number(s);
    }

    private normalizeTime(time: string): string {
        return time.length === 5 ? `${time}:00` : time;
    }
}
