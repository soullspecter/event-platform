import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';

import { SaveLocationPlaceDto } from '../../location-places/dto/save-location-place.dto';

export class SaveScheduleItemDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string | null;

    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsDateString()
    itemDate?: string | null;

    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    startTime?: string | null;

    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    endTime?: string | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => SaveLocationPlaceDto)
    location?: SaveLocationPlaceDto | null;
}
