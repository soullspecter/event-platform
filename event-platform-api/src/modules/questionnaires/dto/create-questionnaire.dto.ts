import { IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class CreateOptionDto {
    @IsString()
    @MinLength(1)
    @MaxLength(500)
    text: string;

    @IsOptional()
    @IsInt()
    sortOrder?: number;
}

class CreateQuestionDto {
    @IsString()
    @MinLength(1)
    text: string;

    @IsIn(['text', 'single_choice', 'multiple_choice'])
    type: 'text' | 'single_choice' | 'multiple_choice';

    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;

    @IsOptional()
    @IsInt()
    sortOrder?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOptionDto)
    options?: CreateOptionDto[];
}

export class CreateQuestionnaireDto {
    @IsInt()
    eventId: number;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsDateString()
    availableFrom?: string;

    @IsOptional()
    @IsDateString()
    availableUntil?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}
