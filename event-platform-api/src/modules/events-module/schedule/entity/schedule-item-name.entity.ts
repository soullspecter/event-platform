import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ScheduleItem } from './schedule-item.entity';

@Entity({ name: 'schedule_item_names' })
export class ScheduleItemName {
    @PrimaryGeneratedColumn({ name: 'schedule_item_name_id', type: 'integer' })
    scheduleItemNameId: number;

    @Column({ name: 'schedule_item_id', type: 'integer' })
    scheduleItemId: number;

    @ManyToOne(() => ScheduleItem, (item) => item.itemNames, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'schedule_item_id',
        referencedColumnName: 'scheduleItemId',
    })
    scheduleItem: ScheduleItem;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;
}
