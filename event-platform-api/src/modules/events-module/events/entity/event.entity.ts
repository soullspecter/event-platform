import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';

import { User } from '../../../users/entity/user.entity';
import { Program } from '../../programs/entity/program.entity';
import { CommonScheduleItem } from '../../common-schedule/entity/common-schedule-item.entity';

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

    @Column({ name: 'created_by', type: 'integer' })
    createdBy: number;

    @ManyToOne(() => User, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'created_by', referencedColumnName: 'userId' })
    creator: Relation<User>;

    @Column({ name: 'status', type: 'varchar', length: 20, nullable: false, default: 'draft' })
    status: EventStatus;

    @OneToMany(() => Program, (program) => program.event)
    programs: Program[];

    @OneToMany(() => CommonScheduleItem, (item) => item.event)
    commonScheduleItems: CommonScheduleItem[];
}
