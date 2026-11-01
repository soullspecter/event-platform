import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { SaveVenueDto } from '../../venues/dto/save-venue.dto';
import { SaveScheduleItemDto } from '../../schedule/dto/save-schedule-item.dto';

export class SaveEventDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string | null;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsDateString()
    startDate?: string | null;

    @IsOptional()
    @IsDateString()
    endDate?: string | null;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveVenueDto)
    venues?: SaveVenueDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveScheduleItemDto)
    schedule?: SaveScheduleItemDto[];

    @IsOptional()
    @IsBoolean()
    publish?: boolean;
}
