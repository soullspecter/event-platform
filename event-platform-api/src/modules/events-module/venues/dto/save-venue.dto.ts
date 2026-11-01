import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

import { SaveLocationDto } from '../../locations/dto/save-location.dto';

export class SaveVenueDto {
    @IsOptional()
    @IsInt()
    venueId?: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string | null;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsDateString()
    venueDate?: string | null;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    startTime?: string | null;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    endTime?: string | null;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    locationIds?: number[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveLocationDto)
    manualLocations?: SaveLocationDto[];
}
