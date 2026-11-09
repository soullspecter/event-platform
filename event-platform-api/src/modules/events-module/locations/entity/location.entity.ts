import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LocationPlace } from '../../location-places/entity/location-place.entity';

@Entity({ name: 'locations' })
export class Location {
    @PrimaryGeneratedColumn({ name: 'location_id', type: 'integer' })
    locationId: number;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
    name: string | null;

    @Column({ name: 'address', type: 'text', nullable: true })
    address: string | null;

    @OneToMany(() => LocationPlace, (place) => place.location)
    places: LocationPlace[];
}
