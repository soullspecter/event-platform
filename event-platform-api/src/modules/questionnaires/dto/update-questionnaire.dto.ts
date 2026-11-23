import { IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength, ValidateNested, Min } from 'class-validator';

import { Type } from 'class-transformer';

class UpdateQuestionDto {
    @IsOptional()
    @IsInt()
    questionId?: number;

    @IsString()
    @MaxLength(1000)
    text: string;

    @IsString()
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
    @IsString({ each: true })
    options?: string[];
}

export class UpdateQuestionnaireDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsDateString()
    availableFrom?: string;

    @IsOptional()
    @IsDateString()
    availableUntil?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateQuestionDto)
    questions?: UpdateQuestionDto[];
}
