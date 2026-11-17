import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveLocationDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string | null;

    @IsOptional()
    @IsString()
    address?: string | null;
}
