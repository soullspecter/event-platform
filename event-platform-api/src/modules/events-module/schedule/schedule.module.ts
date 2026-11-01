import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Event } from '../../../models/events/event.entity';
import { ScheduleItem } from '../../../models/schedule/schedule-item.entity';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
    imports: [TypeOrmModule.forFeature([Event, ScheduleItem])],
    controllers: [ScheduleController],
    providers: [ScheduleService, RolesGuard],
    exports: [ScheduleService],
})
export class ScheduleModule {}
