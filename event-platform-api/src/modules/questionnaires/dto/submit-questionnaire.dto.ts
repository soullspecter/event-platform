import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class SubmitAnswerDto {
    @IsInt()
    @Min(1)
    questionId: number;

    @IsOptional()
    @IsString()
    textValue?: string;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    optionIds?: number[];
}

export class SubmitQuestionnaireDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SubmitAnswerDto)
    answers: SubmitAnswerDto[];
}
