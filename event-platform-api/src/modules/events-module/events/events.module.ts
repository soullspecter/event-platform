import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Event } from '../../../models/events/event.entity';
import { ScheduleItem } from '../../../models/schedule/schedule-item.entity';
import { Venue } from '../../../models/venues/venue.entity';
import { VenueLocation } from '../../../models/venues/venue-location.entity';
import { Location } from '../../../models/locations/location.entity';
import { User } from '../../../models/users/user.entity';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { EventsService } from './events.service';
import { EventsController } from './events.controller';

import { LocationsModule } from '../locations/locations.module';
import { VenuesModule } from '../venues/venues.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
    imports: [TypeOrmModule.forFeature([Event, User, Venue, VenueLocation, Location, ScheduleItem]), LocationsModule, VenuesModule, ScheduleModule],
    controllers: [EventsController],
    providers: [EventsService, RolesGuard],
})
export class EventsModule {}
