import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LocationsModule } from '../locations/locations.module';
import { LocationPlace } from './entity/location-place.entity';
import { LocationPlacesService } from './location-places.service';

@Module({
    imports: [TypeOrmModule.forFeature([LocationPlace]), LocationsModule],
    providers: [LocationPlacesService],
    exports: [LocationPlacesService],
})
export class LocationPlacesModule {}
