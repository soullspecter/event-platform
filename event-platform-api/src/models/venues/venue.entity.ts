import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'venues' })
export class Venue {
    @PrimaryGeneratedColumn({
        name: 'venue_id',
        type: 'integer',
    })
    venueId: number;

    @Column({
        name: 'event_id',
        type: 'integer',
    })
    eventId: number;

    @Column({
        name: 'name',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    name: string | null;

    @Column({
        name: 'description',
        type: 'text',
        nullable: true,
    })
    description: string | null;

    @Column({
        name: 'venue_date',
        type: 'date',
        nullable: true,
    })
    venueDate: string | null;

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
