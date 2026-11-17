import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesGuard } from '../../../common/guards/roles.guard';
import { CommonScheduleModule } from '../common-schedule/common-schedule.module';
import { Event } from '../events/entity/event.entity';
import { LocationPlacesModule } from '../location-places/location-places.module';
import { ScheduleItem } from './entity/schedule-item.entity';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
    imports: [TypeOrmModule.forFeature([Event, ScheduleItem]), CommonScheduleModule, LocationPlacesModule],
    controllers: [ScheduleController],
    providers: [ScheduleService, RolesGuard],
    exports: [ScheduleService],
})
export class ScheduleModule {}
