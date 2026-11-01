import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveLocationDto {
    @IsOptional()
    @IsInt()
    locationId?: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string | null;

    @IsOptional()
    @IsString()
    place?: string | null;

    @IsOptional()
    @IsString()
    address?: string | null;
}
