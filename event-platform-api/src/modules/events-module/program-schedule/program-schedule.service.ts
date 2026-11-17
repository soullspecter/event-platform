import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramSchedule } from './entity/program-schedule.entity';

@Injectable()
export class ProgramScheduleService {
    constructor(
        @InjectRepository(ProgramSchedule)
        private readonly repo: Repository<ProgramSchedule>,
    ) {}

    // Здесь можно добавить методы, если понадобятся
}
