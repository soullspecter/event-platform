import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Event } from '../../events/entity/event.entity';
import { LocationPlace } from '../../location-places/entity/location-place.entity';

@Entity({ name: 'common_schedule_items' })
export class CommonScheduleItem {
    @PrimaryGeneratedColumn({ name: 'common_item_id', type: 'integer' })
    commonItemId: number;

    @Column({ name: 'event_id', type: 'integer' })
    eventId: number;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id', referencedColumnName: 'eventId' })
    event: Event;

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
}
