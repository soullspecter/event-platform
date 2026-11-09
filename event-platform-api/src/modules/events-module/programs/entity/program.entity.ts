import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ScheduleItem } from '../../schedule/entity/schedule-item.entity';
import { LocationPlace } from '../../location-places/entity/location-place.entity';

@Entity({ name: 'programs' })
export class Program {
    @PrimaryGeneratedColumn({ name: 'program_id', type: 'integer' })
    programId: number;

    @Column({ name: 'schedule_item_id', type: 'integer', nullable: true })
    scheduleItemId: number | null;

    @ManyToOne(() => ScheduleItem, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'schedule_item_id', referencedColumnName: 'scheduleItemId' })
    scheduleItem: ScheduleItem | null;

    @Column({ name: 'location_place_id', type: 'integer', nullable: true })
    locationPlaceId: number | null;

    @ManyToOne(() => LocationPlace, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'location_place_id', referencedColumnName: 'locationPlaceId' })
    locationPlace: LocationPlace | null;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    description: string | null;
}
