import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, IsNull } from 'typeorm';

import { LocationsService } from '../locations/locations.service';
import { LocationPlace } from './entity/location-place.entity';
import { SaveLocationPlaceDto } from './dto/save-location-place.dto';

export interface LocationSource {
    location?: SaveLocationPlaceDto | null;
}

@Injectable()
export class LocationPlacesService {
    constructor(private readonly locationsService: LocationsService) {}

    /**
     * Возвращает id площадки: либо проверяет переданный locationPlaceId,
     * либо находит/создаёт локацию и площадку по данным, введённым вручную.
     * Если место не указано, возвращает null.
     */
    async resolveId(manager: EntityManager, source: LocationSource): Promise<number | null> {
        const place = source.location;
        if (!place) return null;

        const places = manager.getRepository(LocationPlace);

        if (place.locationPlaceId != null) {
            const exists = await places.exists({ where: { locationPlaceId: place.locationPlaceId } });
            if (!exists) throw new NotFoundException('Площадка не найдена');
            return place.locationPlaceId;
        }

        const name = this.cleanText(place.name);
        const address = this.cleanText(place.address);
        const placeName = this.cleanText(place.place);

        if (!name && !address && !placeName) return null;
        if (!name && !address) throw new BadRequestException('Укажите название или адрес места');

        const location = await this.locationsService.findOrCreate(manager, { name, address });

        const existing = await places.findOne({
            where: { locationId: location.locationId, place: placeName ?? IsNull() },
        });
        if (existing) return existing.locationPlaceId;

        const created = await places.save(places.create({ locationId: location.locationId, place: placeName }));
        return created.locationPlaceId;
    }

    private cleanText(value: string | null | undefined): string | null {
        if (value == null) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
}
