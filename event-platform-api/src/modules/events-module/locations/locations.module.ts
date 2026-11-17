import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesGuard } from '../../../common/guards/roles.guard';
import { LocationPlace } from '../location-places/entity/location-place.entity';
import { Location } from './entity/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
    imports: [TypeOrmModule.forFeature([Location, LocationPlace])],
    controllers: [LocationsController],
    providers: [LocationsService, RolesGuard],
    exports: [LocationsService],
})
export class LocationsModule {}
