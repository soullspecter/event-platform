import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Event } from '../../events/entity/event.entity';
import { ProgramSchedule } from '../../program-schedule/entity/program-schedule.entity';

@Entity({ name: 'programs' })
export class Program {
    @PrimaryGeneratedColumn({ name: 'program_id', type: 'integer' })
    programId: number;

    @Column({ name: 'event_id', type: 'integer' })
    eventId: number;

    @ManyToOne(() => Event, (event) => event.programs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id', referencedColumnName: 'eventId' })
    event: Event;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
    name: string | null;

    @Column({ name: 'description', type: 'text', nullable: true })
    description: string | null;

    @OneToMany(() => ProgramSchedule, (ps) => ps.program)
    programSchedules: ProgramSchedule[];
}
