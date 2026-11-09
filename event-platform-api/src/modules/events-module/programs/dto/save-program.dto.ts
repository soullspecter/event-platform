import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { SaveLocationPlaceDto } from '../../location-places/dto/save-location-place.dto';

export class SaveProgramDto {
    @IsOptional()
    @IsInt()
    programId?: number | null;

    @IsOptional()
    @IsInt()
    scheduleItemId?: number | null;

    @IsOptional()
    @IsInt()
    scheduleItemIndex?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string | null;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsInt()
    locationPlaceId?: number | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => SaveLocationPlaceDto)
    manualLocation?: SaveLocationPlaceDto | null;
}
