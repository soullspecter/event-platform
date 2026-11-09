import { IsDateString, IsInt, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class SaveScheduleItemDto {
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsInt()
    scheduleItemId?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string | null;

    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @IsDateString()
    itemDate?: string | null;

    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    startTime?: string | null;

    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    endTime?: string | null;
}
