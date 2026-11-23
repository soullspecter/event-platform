import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Registration } from './entities/registration.entity';
import { Event } from '../events-module/events/entity/event.entity';

type PgError = Error & { code?: string };

@Injectable()
export class RegistrationsService {
    constructor(
        @InjectRepository(Registration)
        private readonly regRepo: Repository<Registration>,
        @InjectRepository(Event)
        private readonly eventRepo: Repository<Event>,
    ) {}

    async register(userId: number, eventId: number): Promise<Registration> {
        const event = await this.eventRepo.findOne({
            where: { eventId },
            select: { eventId: true, status: true },
        });
        if (!event) throw new NotFoundException('Event not found');
        if (event.status !== 'published') {
            throw new ConflictException('Registration is closed');
        }

        try {
            const reg = this.regRepo.create({ userId, eventId, qrCodeId: null });
            return await this.regRepo.save(reg);
        } catch (err) {
            if (err instanceof QueryFailedError) {
                const code = (err as QueryFailedError<PgError>).driverError?.code;
                if (code === '23505') throw new ConflictException('Already registered');
                if (code === '23503') throw new ConflictException('Invalid user or event');
            }
            throw err;
        }
    }

    async unregister(userId: number, eventId: number): Promise<void> {
        const res = await this.regRepo.delete({ userId, eventId });
        if (!res.affected) throw new NotFoundException('Not registered');
    }

    async isRegistered(userId: number, eventId: number): Promise<boolean> {
        return (await this.regRepo.count({ where: { userId, eventId } })) > 0;
    }
}
