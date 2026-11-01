import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'schedule_items' })
export class ScheduleItem {
    @PrimaryGeneratedColumn({
        name: 'schedule_item_id',
        type: 'integer',
    })
    scheduleItemId: number;

    @Column({
        name: 'event_id',
        type: 'integer',
    })
    eventId: number;

    @Column({
        name: 'description',
        type: 'text',
        nullable: true,
    })
    description: string | null;

    @Column({
        name: 'item_date',
        type: 'date',
        nullable: true,
    })
    itemDate: string | null;

    @Column({
        name: 'start_time',
        type: 'time',
        nullable: true,
    })
    startTime: string | null;

    @Column({
        name: 'end_time',
        type: 'time',
        nullable: true,
    })
    endTime: string | null;
}
