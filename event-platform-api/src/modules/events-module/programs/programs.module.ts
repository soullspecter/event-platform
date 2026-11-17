import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesGuard } from '../../../common/guards/roles.guard';
import { Event } from '../events/entity/event.entity';
import { ProgramSchedule } from '../program-schedule/entity/program-schedule.entity';
import { ScheduleModule } from '../schedule/schedule.module';
import { Program } from './entity/program.entity';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';

@Module({
    imports: [TypeOrmModule.forFeature([Program, ProgramSchedule, Event]), ScheduleModule],
    controllers: [ProgramsController],
    providers: [ProgramsService, RolesGuard],
    exports: [ProgramsService],
})
export class ProgramsModule {}
