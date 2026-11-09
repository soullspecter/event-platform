import { IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';

export class SaveLocationPlaceDto {
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsInt()
    locationPlaceId?: number | null;

    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsInt()
    locationId?: number | null;

    @IsOptional()
    @IsString()
    name?: string | null;

    @IsOptional()
    @IsString()
    place?: string | null;

    @IsOptional()
    @IsString()
    address?: string | null;
}
