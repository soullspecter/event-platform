import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramSchedule } from './entity/program-schedule.entity';
import { ProgramScheduleService } from './program-schedule.service';

@Module({
    imports: [TypeOrmModule.forFeature([ProgramSchedule])],
    providers: [ProgramScheduleService],
    exports: [ProgramScheduleService],
})
export class ProgramScheduleModule {}
