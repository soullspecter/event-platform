import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Program } from '../../programs/entity/program.entity';
import { ScheduleItem } from '../../schedule/entity/schedule-item.entity';

@Entity({ name: 'program_schedule' })
export class ProgramSchedule {
    @PrimaryColumn({ name: 'program_id', type: 'integer' })
    programId: number;

    @PrimaryColumn({ name: 'schedule_item_id', type: 'integer' })
    scheduleItemId: number;

    @ManyToOne(() => Program, (program) => program.programSchedules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'program_id', referencedColumnName: 'programId' })
    program: Program;

    @ManyToOne(() => ScheduleItem, (item) => item.programSchedules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'schedule_item_id', referencedColumnName: 'scheduleItemId' })
    scheduleItem: ScheduleItem;
}
