import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Program } from '../../programs/entity/program.entity';
import { Event } from '../../events/entity/event.entity';

@Entity({ name: 'schedule_items' })
export class ScheduleItem {
    @PrimaryGeneratedColumn({ name: 'schedule_item_id', type: 'integer' })
    scheduleItemId: number;

    @Column({ name: 'event_id', type: 'integer' })
    eventId: number;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id', referencedColumnName: 'eventId' })
    event: Event;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
    name: string | null;

    @Column({ name: 'item_date', type: 'date', nullable: true })
    itemDate: string | null;

    @Column({ name: 'start_time', type: 'time', nullable: true })
    startTime: string | null;

    @Column({ name: 'end_time', type: 'time', nullable: true })
    endTime: string | null;

    @OneToMany(() => Program, (program) => program.scheduleItem)
    programs: Program[];
}
