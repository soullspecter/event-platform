import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { VenuesService } from './venues.service';
import { SaveVenueDto } from './dto/save-venue.dto';

@Controller('events/:eventId/venues')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class VenuesController {
    constructor(private readonly venuesService: VenuesService) {}

    @Post()
    create(@Param('eventId', ParseIntPipe) eventId: number, @Body() dto: SaveVenueDto) {
        return this.venuesService.create(eventId, dto);
    }

    @Get()
    findAll(@Param('eventId', ParseIntPipe) eventId: number) {
        return this.venuesService.findAll(eventId);
    }

    @Get(':venueId')
    findOne(@Param('eventId', ParseIntPipe) eventId: number, @Param('venueId', ParseIntPipe) venueId: number) {
        return this.venuesService.findOne(eventId, venueId);
    }

    @Patch(':venueId')
    update(@Param('eventId', ParseIntPipe) eventId: number, @Param('venueId', ParseIntPipe) venueId: number, @Body() dto: SaveVenueDto) {
        return this.venuesService.update(eventId, venueId, dto);
    }

    @Delete(':venueId')
    remove(@Param('eventId', ParseIntPipe) eventId: number, @Param('venueId', ParseIntPipe) venueId: number) {
        return this.venuesService.remove(eventId, venueId);
    }

    @Post(':venueId/locations/:locationId')
    attachLocation(@Param('eventId', ParseIntPipe) eventId: number, @Param('venueId', ParseIntPipe) venueId: number, @Param('locationId', ParseIntPipe) locationId: number) {
        return this.venuesService.attachLocation(eventId, venueId, locationId);
    }

    @Delete(':venueId/locations/:locationId')
    detachLocation(@Param('eventId', ParseIntPipe) eventId: number, @Param('venueId', ParseIntPipe) venueId: number, @Param('locationId', ParseIntPipe) locationId: number) {
        return this.venuesService.detachLocation(eventId, venueId, locationId);
    }
}
