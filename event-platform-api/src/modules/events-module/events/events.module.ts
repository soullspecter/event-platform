import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Event } from './entity/event.entity';
import { ScheduleItem } from '../schedule/entity/schedule-item.entity';
import { Program } from '../programs/entity/program.entity';
import { Location } from '../locations/entity/location.entity';
import { LocationPlace } from '../location-places/entity/location-place.entity';
import { User } from '../../users/entity/user.entity';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { EventsService } from './events.service';
import { EventsController } from './events.controller';

import { LocationsModule } from '../locations/locations.module';
import { ProgramsModule } from '../programs/programs.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
    imports: [TypeOrmModule.forFeature([Event, User, Program, Location, LocationPlace, ScheduleItem]), LocationsModule, ProgramsModule, ScheduleModule],
    controllers: [EventsController],
    providers: [EventsService, RolesGuard],
})
export class EventsModule {}
