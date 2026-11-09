import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ScheduleItem } from '../schedule/entity/schedule-item.entity';
import { Program } from './entity/program.entity';
import { LocationPlace } from '../location-places/entity/location-place.entity';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';

@Module({
    imports: [TypeOrmModule.forFeature([ScheduleItem, Program, LocationPlace])],
    controllers: [ProgramsController],
    providers: [ProgramsService, RolesGuard],
    exports: [ProgramsService],
})
export class ProgramsModule {}
