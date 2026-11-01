import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'locations' })
export class Location {
    @PrimaryGeneratedColumn({
        name: 'location_id',
        type: 'integer',
    })
    locationId: number;

    @Column({
        name: 'name',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    name: string | null;

    @Column({
        name: 'place',
        type: 'text',
        nullable: true,
    })
    place: string | null;

    @Column({
        name: 'address',
        type: 'text',
        nullable: true,
    })
    address: string | null;
}
