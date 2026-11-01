import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../users/user.entity';

export type EventStatus = 'draft' | 'published';

@Entity({ name: 'events' })
export class Event {
    @PrimaryGeneratedColumn({
        name: 'event_id',
        type: 'integer',
    })
    eventId: number;

    @Column({
        name: 'title',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    title: string | null;

    @Column({
        name: 'description',
        type: 'text',
        nullable: true,
    })
    description: string | null;

    @Column({
        name: 'start_date',
        type: 'date',
        nullable: true,
    })
    startDate: string | null;

    @Column({
        name: 'end_date',
        type: 'date',
        nullable: true,
    })
    endDate: string | null;

    @Column({
        name: 'user_id',
        type: 'integer',
    })
    userId: number;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({
        name: 'user_id',
        referencedColumnName: 'userId',
    })
    organizer: User;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
        default: 'draft',
    })
    status: EventStatus;
}
