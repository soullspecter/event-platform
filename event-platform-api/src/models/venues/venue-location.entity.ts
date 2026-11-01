import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'venue_locations' })
export class VenueLocation {
    @PrimaryColumn({
        name: 'venue_id',
        type: 'integer',
    })
    venueId: number;

    @PrimaryColumn({
        name: 'location_id',
        type: 'integer',
    })
    locationId: number;
}
