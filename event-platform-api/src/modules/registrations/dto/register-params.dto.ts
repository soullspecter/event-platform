// registrations/dto/register-params.dto.ts
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class RegisterParamsDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    eventId: number;
}
