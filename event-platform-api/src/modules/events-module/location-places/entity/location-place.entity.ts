import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Location } from '../../locations/entity/location.entity';

@Entity({ name: 'location_places' })
export class LocationPlace {
    @PrimaryGeneratedColumn({ name: 'location_place_id', type: 'integer' })
    locationPlaceId: number;

    @Column({ name: 'location_id', type: 'integer' })
    locationId: number;

    @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'location_id', referencedColumnName: 'locationId' })
    location: Location;

    @Column({ name: 'place', type: 'text', nullable: true })
    place: string | null;
}
