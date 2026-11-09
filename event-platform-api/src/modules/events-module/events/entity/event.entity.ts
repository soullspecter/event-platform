import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../../users/entity/user.entity';
import { ScheduleItem } from '../../schedule/entity/schedule-item.entity';

export type EventStatus = 'draft' | 'published';

@Entity({ name: 'events' })
export class Event {
    @PrimaryGeneratedColumn({ name: 'event_id', type: 'integer' })
    eventId: number;

    @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
    title: string | null;

    @Column({ name: 'description', type: 'text', nullable: true })
    description: string | null;

    @Column({ name: 'start_date', type: 'date', nullable: true })
    startDate: string | null;

    @Column({ name: 'end_date', type: 'date', nullable: true })
    endDate: string | null;

    @Column({ name: 'user_id', type: 'integer', nullable: true })
    userId: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
    organizer: User | null;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'draft' })
    status: EventStatus;

    @OneToMany(() => ScheduleItem, (item) => item.event)
    scheduleItems: ScheduleItem[];
}
