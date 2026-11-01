import { IsDateString, IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class SaveScheduleItemDto {
    @IsOptional()
    @IsInt()
    scheduleItemId?: number;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsDateString()
    itemDate?: string | null;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    startTime?: string | null;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    endTime?: string | null;
}
