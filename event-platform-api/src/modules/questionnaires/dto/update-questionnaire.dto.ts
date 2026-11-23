import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

class UpdateOptionDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    optionId?: number;

    @IsString()
    @MinLength(1)
    @MaxLength(500)
    text: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

class UpdateQuestionDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    questionId?: number;

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
    @Type(() => UpdateOptionDto)
    options?: UpdateOptionDto[];
}

export class UpdateQuestionnaireDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsDateString()
    availableFrom?: string | null;

    @IsOptional()
    @IsDateString()
    availableUntil?: string | null;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateQuestionDto)
    questions?: UpdateQuestionDto[];
}
