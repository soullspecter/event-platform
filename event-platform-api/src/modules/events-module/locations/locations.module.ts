import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Location } from './entity/location.entity';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
    imports: [TypeOrmModule.forFeature([Location])],
    controllers: [LocationsController],
    providers: [LocationsService, RolesGuard],
    exports: [LocationsService],
})
export class LocationsModule {}
