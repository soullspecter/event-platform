import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { SaveCommonScheduleItemDto } from '../../common-schedule/dto/save-common-schedule-item.dto';
import { SaveProgramDto } from '../../programs/dto/save-program.dto';

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

    /** undefined — не трогаем; [] — очищаем; массив — заменяем. */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveProgramDto)
    programs?: SaveProgramDto[];

    /** undefined — не трогаем; [] — очищаем; массив — заменяем. */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveCommonScheduleItemDto)
    commonSchedule?: SaveCommonScheduleItemDto[];
}
