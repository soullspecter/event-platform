import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { SaveEventQuestionnaireDto } from '../../../questionnaires/dto/save-event-questionnaire.dto';
import { SaveCertificateTemplateDto } from '../../../certificates/dto/save-event-certificates.dto';
import { SaveCommonScheduleItemDto } from '../../common-schedule/dto/save-common-schedule-item.dto';
import { SaveProgramDto } from '../../programs/dto/save-program.dto';

export class SaveEventDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string | null;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsDateString()
    startDate?: string | null;

    @IsOptional()
    @IsDateString()
    endDate?: string | null;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveProgramDto)
    programs?: SaveProgramDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveCommonScheduleItemDto)
    commonSchedule?: SaveCommonScheduleItemDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveEventQuestionnaireDto)
    questionnaires?: SaveEventQuestionnaireDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveCertificateTemplateDto)
    certificates?: SaveCertificateTemplateDto[];
}
