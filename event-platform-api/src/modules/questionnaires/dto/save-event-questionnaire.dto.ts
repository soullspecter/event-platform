import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested, IsBoolean } from 'class-validator';

export class SaveEventQuestionOptionDto {
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

export class SaveEventQuestionDto {
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
    @Type(() => SaveEventQuestionOptionDto)
    options?: SaveEventQuestionOptionDto[];
}

export class SaveEventQuestionnaireDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    questionnaireId?: number;

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
    @Type(() => SaveEventQuestionDto)
    questions: SaveEventQuestionDto[];
}
