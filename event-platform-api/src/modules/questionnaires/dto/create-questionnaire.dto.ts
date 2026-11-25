import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class CreateOptionDto {
    @IsString()
    @MinLength(1)
    @MaxLength(500)
    text: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

class CreateQuestionDto {
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    text: string;

    @IsIn(['text', 'single_choice', 'multiple_choice'])
    type: 'text' | 'single_choice' | 'multiple_choice';

    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOptionDto)
    options?: CreateOptionDto[];
}

export class CreateQuestionnaireDto {
    @IsInt()
    @Min(1)
    eventId: number;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsDateString()
    availableFrom?: string | null;

    @IsOptional()
    @IsDateString()
    availableUntil?: string | null;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}
