// registrations/registrations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { Registration } from './entities/registration.entity';
import { Event } from '../events-module/events/entity/event.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Registration, Event])],
    controllers: [RegistrationsController],
    providers: [RegistrationsService],
    exports: [RegistrationsService],
})
export class RegistrationsModule {}
