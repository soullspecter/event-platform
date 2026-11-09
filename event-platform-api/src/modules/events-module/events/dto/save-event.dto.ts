import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { SaveProgramDto } from '../../programs/dto/save-program.dto';
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
    @Type(() => SaveScheduleItemDto)
    schedule?: SaveScheduleItemDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveProgramDto)
    programs?: SaveProgramDto[];

    @IsOptional()
    @IsBoolean()
    publish?: boolean;
}
