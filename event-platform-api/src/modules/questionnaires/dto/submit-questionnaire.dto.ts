import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SubmitAnswerDto {
    @IsInt()
    questionId: number;

    @IsOptional()
    @IsString()
    textValue?: string;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    optionIds?: number[];
}

export class SubmitQuestionnaireDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SubmitAnswerDto)
    answers: SubmitAnswerDto[];
}
