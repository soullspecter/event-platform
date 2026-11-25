import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SelectionParamsDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    eventId: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    scheduleItemId: number;
}
