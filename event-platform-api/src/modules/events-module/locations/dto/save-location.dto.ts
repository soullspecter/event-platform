import { IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class SaveLocationDto {
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsInt()
    locationId?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string | null;

    @IsOptional()
    @IsString()
    address?: string | null;
}
