import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { SaveScheduleItemDto } from '../../schedule/dto/save-schedule-item.dto';

export class SaveProgramDto {
    @IsOptional()
    @IsInt()
    programId?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string | null;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveScheduleItemDto)
    schedule?: SaveScheduleItemDto[];
}
