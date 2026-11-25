import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramSelection } from './entities/program-selection.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { ProgramSchedule } from '../events-module/program-schedule/entity/program-schedule.entity';

import { ProgramSelectionsController } from './program-selections.controller';
import { ProgramSelectionsService } from './program-selections.service';

@Module({
    imports: [TypeOrmModule.forFeature([ProgramSelection, Registration, ProgramSchedule])],
    controllers: [ProgramSelectionsController],
    providers: [ProgramSelectionsService],
    exports: [ProgramSelectionsService],
})
export class ProgramSelectionsModule {}
