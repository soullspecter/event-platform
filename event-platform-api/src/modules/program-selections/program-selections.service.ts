import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProgramSelection } from './entities/program-selection.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { ProgramSchedule } from '../events-module/program-schedule/entity/program-schedule.entity';

@Injectable()
export class ProgramSelectionsService {
    constructor(
        @InjectRepository(ProgramSelection)
        private readonly selectionRepo: Repository<ProgramSelection>,

        @InjectRepository(Registration)
        private readonly registrationRepo: Repository<Registration>,

        @InjectRepository(ProgramSchedule)
        private readonly programScheduleRepo: Repository<ProgramSchedule>,
    ) {}

    async findMine(userId: number, eventId: number) {
        const registration = await this.getRegistration(userId, eventId);

        const selections = await this.selectionRepo.find({
            where: {
                registrationId: registration.registrationId,
            },
            relations: {
                scheduleItem: {
                    locationPlace: {
                        location: true,
                    },
                },
            },
        });

        return selections.map((selection) => ({
            ...selection.scheduleItem,
            selected: true,
        }));
    }

    async select(userId: number, eventId: number, scheduleItemId: number) {
        const registration = await this.getRegistration(userId, eventId);

        await this.checkScheduleItem(eventId, scheduleItemId);

        const selection = this.selectionRepo.create({
            registrationId: registration.registrationId,
            scheduleItemId,
        });

        try {
            await this.selectionRepo.insert(selection);
        } catch (error) {
            const pgError = error as {
                driverError?: { code?: string };
            };

            if (pgError.driverError?.code === '23505') {
                throw new ConflictException('Пункт расписания уже выбран');
            }

            throw error;
        }

        return {
            message: 'Пункт расписания выбран',
            scheduleItemId,
        };
    }

    // Отменить выбор пункта
    async unselect(userId: number, eventId: number, scheduleItemId: number) {
        const registration = await this.getRegistration(userId, eventId);

        const result = await this.selectionRepo.delete({
            registrationId: registration.registrationId,
            scheduleItemId,
        });

        if (!result.affected) {
            throw new NotFoundException('Выбор пункта расписания не найден');
        }

        return {
            message: 'Выбор отменён',
            scheduleItemId,
        };
    }

    // Проверить регистрацию участника
    private async getRegistration(userId: number, eventId: number) {
        const registration = await this.registrationRepo.findOne({
            where: {
                userId,
                eventId,
            },
        });

        if (!registration) {
            throw new ConflictException('Для выбора пунктов необходимо зарегистрироваться на мероприятие');
        }

        return registration;
    }

    // Проверить принадлежность пункта расписания мероприятию
    private async checkScheduleItem(eventId: number, scheduleItemId: number) {
        const item = await this.programScheduleRepo
            .createQueryBuilder('ps')
            .innerJoin('ps.program', 'p')
            .where('ps.scheduleItemId = :scheduleItemId', {
                scheduleItemId,
            })
            .andWhere('p.eventId = :eventId', {
                eventId,
            })
            .getOne();

        if (!item) {
            throw new NotFoundException('Пункт расписания не найден у этого мероприятия');
        }
    }
}
