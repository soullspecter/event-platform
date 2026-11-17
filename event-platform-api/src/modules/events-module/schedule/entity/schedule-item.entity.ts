import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { LocationPlace } from '../../location-places/entity/location-place.entity';
import { ProgramSchedule } from '../../program-schedule/entity/program-schedule.entity';

@Entity({ name: 'schedule_items' })
export class ScheduleItem {
    @PrimaryGeneratedColumn({ name: 'schedule_item_id', type: 'integer' })
    scheduleItemId: number;

    @Column({ name: 'location_place_id', type: 'integer', nullable: true })
    locationPlaceId: number | null;

    @ManyToOne(() => LocationPlace, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'location_place_id', referencedColumnName: 'locationPlaceId' })
    locationPlace: LocationPlace | null;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
    name: string | null;

    @Column({ name: 'item_date', type: 'date', nullable: true })
    itemDate: string | null;

    @Column({ name: 'start_time', type: 'time', nullable: true })
    startTime: string | null;

    @Column({ name: 'end_time', type: 'time', nullable: true })
    endTime: string | null;

    @OneToMany(() => ProgramSchedule, (ps) => ps.scheduleItem)
    programSchedules: ProgramSchedule[];
}
