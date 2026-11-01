import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Event } from '../../../models/events/event.entity';
import { Venue } from '../../../models/venues/venue.entity';
import { VenueLocation } from '../../../models/venues/venue-location.entity';
import { Location } from '../../../models/locations/location.entity';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
    imports: [TypeOrmModule.forFeature([Event, Venue, Location, VenueLocation])],
    controllers: [VenuesController],
    providers: [VenuesService, RolesGuard],
    exports: [VenuesService],
})
export class VenuesModule {}
