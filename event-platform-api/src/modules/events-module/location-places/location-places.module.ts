import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationPlace } from './entity/location-place.entity';
import { LocationPlacesController } from './location-places.controller';
import { LocationPlacesService } from './location-places.service';

@Module({
    imports: [TypeOrmModule.forFeature([LocationPlace])],
    controllers: [LocationPlacesController],
    providers: [LocationPlacesService],
})
export class LocationPlacesModule {}
