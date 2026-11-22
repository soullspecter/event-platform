import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';

import { Event } from '../events/entity/event.entity';
import { ProgramSchedule } from '../program-schedule/entity/program-schedule.entity';
import { ScheduleService } from '../schedule/schedule.service';

import { SaveProgramDto } from './dto/save-program.dto';
import { Program } from './entity/program.entity';

@Injectable()
export class ProgramsService {
    constructor(
        private readonly scheduleService: ScheduleService,
        @InjectRepository(Program) private readonly programsRepository: Repository<Program>,
        @InjectRepository(Event) private readonly eventsRepository: Repository<Event>,
        @InjectRepository(ProgramSchedule) private readonly psRepository: Repository<ProgramSchedule>,
    ) {}

    async create(eventId: number, dto: SaveProgramDto) {
        const event = await this.eventsRepository.findOne({ where: { eventId } });
        if (!event) throw new NotFoundException('Мероприятие не найдено');

        return this.programsRepository.manager.transaction(async (manager) => {
            const program = await manager.getRepository(Program).save(
                manager.getRepository(Program).create({
                    eventId: event.eventId,
                    name: this.cleanText(dto.name),
                    description: this.cleanText(dto.description),
                }),
            );

            if (dto.schedule !== undefined) {
                await this.replaceSchedule(manager, event, program, dto.schedule);
            }
            return this.findOneInManager(manager, program.programId);
        });
    }

    async findAllByEvent(eventId: number) {
        return this.programsRepository.find({
            where: { eventId },
            relations: { programSchedules: { scheduleItem: { locationPlace: { location: true } } } },
        });
    }

    async findOne(programId: number) {
        const program = await this.programsRepository.findOne({
            where: { programId },
            relations: { programSchedules: { scheduleItem: { locationPlace: { location: true } } } },
        });
        if (!program) throw new NotFoundException('Программа не найдена');
        return program;
    }

    async update(programId: number, dto: SaveProgramDto) {
        return this.programsRepository.manager.transaction(async (manager) => {
            const repo = manager.getRepository(Program);
            const program = await repo.findOne({ where: { programId }, relations: { event: true } });
            if (!program) throw new NotFoundException('Программа не найдена');

            if (dto.name !== undefined) program.name = this.cleanText(dto.name);
            if (dto.description !== undefined) program.description = this.cleanText(dto.description);
            await repo.save(program);

            if (dto.schedule !== undefined) {
                await this.replaceSchedule(manager, program.event, program, dto.schedule);
            }

            return this.findOneInManager(manager, programId);
        });
    }

    async remove(programId: number) {
        return this.programsRepository.manager.transaction(async (manager) => {
            const program = await manager.getRepository(Program).findOne({ where: { programId } });
            if (!program) throw new NotFoundException('Программа не найдена');

            const links = await manager.getRepository(ProgramSchedule).find({ where: { programId } });
            const slotIds = links.map((l) => l.scheduleItemId);

            await manager.getRepository(Program).remove(program);
            await this.scheduleService.removeOrphans(manager, slotIds);

            return { message: 'Программа удалена' };
        });
    }

    async replaceForEvent(manager: EntityManager, event: Event, dtos: SaveProgramDto[]): Promise<void> {
        const repo = manager.getRepository(Program);
        const existing = await repo.find({ where: { eventId: event.eventId } });
        const existingById = new Map(existing.map((p) => [p.programId, p]));
        const keptIds = new Set<number>();

        for (const dto of dtos) {
            let program: Program;

            if (dto.programId != null) {
                const found = existingById.get(dto.programId);
                if (!found) throw new BadRequestException(`Программа ${dto.programId} не найдена у мероприятия`);
                if (keptIds.has(dto.programId)) throw new BadRequestException(`Программа ${dto.programId} передана дважды`);
                program = found;
                if (dto.name !== undefined) program.name = this.cleanText(dto.name);
                if (dto.description !== undefined) program.description = this.cleanText(dto.description);
            } else {
                program = repo.create({
                    eventId: event.eventId,
                    name: this.cleanText(dto.name),
                    description: this.cleanText(dto.description),
                });
            }

            program = await repo.save(program);
            keptIds.add(program.programId);

            if (dto.schedule !== undefined) {
                await this.replaceSchedule(manager, event, program, dto.schedule);
            }
        }

        const removedIds = existing.filter((p) => !keptIds.has(p.programId)).map((p) => p.programId);
        if (removedIds.length > 0) {
            const oldLinks = await manager.getRepository(ProgramSchedule).find({
                where: { programId: In(removedIds) },
            });
            const oldSlotIds = oldLinks.map((l) => l.scheduleItemId);

            await repo.delete({ programId: In(removedIds) });
            await this.scheduleService.removeOrphans(manager, oldSlotIds);
        }
    }

    private async replaceSchedule(manager: EntityManager, event: Event, program: Program, dtos: SaveProgramDto['schedule']): Promise<void> {
        if (!dtos) return;

        const psRepo = manager.getRepository(ProgramSchedule);
        const oldLinks = await psRepo.find({ where: { programId: program.programId } });
        const oldSlotIds = oldLinks.map((l) => l.scheduleItemId);

        await psRepo.delete({ programId: program.programId });

        for (const slotDto of dtos) {
            const slot = await this.scheduleService.getOrCreateSlot(manager, event, slotDto);
            await psRepo.save(psRepo.create({ programId: program.programId, scheduleItemId: slot.scheduleItemId }));
        }

        await this.scheduleService.removeOrphans(manager, oldSlotIds);
    }

    private async findOneInManager(manager: EntityManager, programId: number) {
        const program = await manager.getRepository(Program).findOne({
            where: { programId },
            relations: { programSchedules: { scheduleItem: { locationPlace: { location: true } } } },
        });
        if (!program) throw new NotFoundException('Программа не найдена');
        return program;
    }

    private cleanText(value: string | null | undefined): string | null {
        if (value == null) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
}
