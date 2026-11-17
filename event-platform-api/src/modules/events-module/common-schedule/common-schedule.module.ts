import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesGuard } from '../../../common/guards/roles.guard';
import { Event } from '../events/entity/event.entity';
import { LocationPlacesModule } from '../location-places/location-places.module';
import { CommonScheduleController } from './common-schedule.controller';
import { CommonScheduleService } from './common-schedule.service';
import { CommonScheduleItem } from './entity/common-schedule-item.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CommonScheduleItem, Event]), LocationPlacesModule],
    controllers: [CommonScheduleController],
    providers: [CommonScheduleService, RolesGuard],
    exports: [CommonScheduleService],
})
export class CommonScheduleModule {}
