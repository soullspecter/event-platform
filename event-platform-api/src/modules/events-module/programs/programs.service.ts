import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ScheduleItem } from '../schedule/entity/schedule-item.entity';
import { Program } from './entity/program.entity';
import { SaveProgramDto } from './dto/save-program.dto';
import { LocationPlace } from '../location-places/entity/location-place.entity';

@Injectable()
export class ProgramsService {
    constructor(
        @InjectRepository(Program)
        private readonly programsRepository: Repository<Program>,

        @InjectRepository(ScheduleItem)
        private readonly scheduleRepository: Repository<ScheduleItem>,

        @InjectRepository(LocationPlace)
        private readonly locationPlacesRepository: Repository<LocationPlace>,
    ) {}

    async create(dto: SaveProgramDto) {
        if (dto.scheduleItemId != null) {
            const scheduleItem = await this.scheduleRepository.findOne({
                where: { scheduleItemId: dto.scheduleItemId },
            });
            // Если слот передан, но его нет — бросаем ошибку.
            // Переменную не сохраняем, нам важен сам факт проверки.
            if (!scheduleItem) throw new NotFoundException('Пункт расписания не найден');
        }

        const program = this.programsRepository.create({
            scheduleItemId: dto.scheduleItemId ?? null,
            name: dto.name?.trim() || 'Без названия',
            description: dto.description?.trim() || null,
            locationPlaceId: dto.locationPlaceId ?? null,
        });

        return this.programsRepository.save(program);
    }

    async findAllByEvent(eventId: number) {
        return this.programsRepository
            .createQueryBuilder('program')
            .innerJoin('program.scheduleItem', 'scheduleItem')
            .where('scheduleItem.eventId = :eventId', { eventId })
            .leftJoinAndSelect('program.locationPlace', 'locationPlace')
            .leftJoinAndSelect('locationPlace.location', 'location')
            .orderBy('scheduleItem.itemDate', 'ASC')
            .addOrderBy('scheduleItem.startTime', 'ASC')
            .addOrderBy('program.programId', 'ASC')
            .getMany();
    }

    async findOne(programId: number) {
        const program = await this.programsRepository.findOne({
            where: { programId },
            relations: { scheduleItem: true, locationPlace: { location: true } },
        });
        if (!program) throw new NotFoundException('Программа не найдена');
        return program;
    }

    async update(programId: number, dto: SaveProgramDto) {
        const program = await this.findOne(programId);

        if (dto.name !== undefined) program.name = dto.name?.trim() || 'Без названия';
        if (dto.description !== undefined) program.description = dto.description?.trim() || null;
        if (dto.locationPlaceId !== undefined) program.locationPlaceId = dto.locationPlaceId;

        if (dto.scheduleItemId !== undefined) {
            if (dto.scheduleItemId === null) {
                program.scheduleItemId = null;
            } else {
                const scheduleItem = await this.scheduleRepository.findOne({
                    where: { scheduleItemId: dto.scheduleItemId },
                });
                if (!scheduleItem) throw new NotFoundException('Новый пункт расписания не найден');
                program.scheduleItemId = dto.scheduleItemId;
            }
        }

        return this.programsRepository.save(program);
    }

    async remove(programId: number) {
        const program = await this.findOne(programId);
        await this.programsRepository.remove(program);
        return { message: 'Программа удалена' };
    }
}
