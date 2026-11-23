import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesGuard } from '../../../common/guards/roles.guard';
import { CommonScheduleModule } from '../common-schedule/common-schedule.module';
import { ProgramsModule } from '../programs/programs.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { QuestionnairesModule } from '../../questionnaires/questionnaires.module';

import { Event } from './entity/event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
    imports: [TypeOrmModule.forFeature([Event]), ProgramsModule, ScheduleModule, CommonScheduleModule, QuestionnairesModule],
    controllers: [EventsController],
    providers: [EventsService, RolesGuard],
})
export class EventsModule {}
