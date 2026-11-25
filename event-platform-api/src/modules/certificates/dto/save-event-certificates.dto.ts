import { Type } from 'class-transformer';
import {
    IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional,
    IsString, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';

export class SaveCertificateFieldDto {
    @IsOptional() @IsInt() @Min(1)
    fieldId?: number;

    @IsNumber() @Min(0) @Max(100)
    x: number;

    @IsNumber() @Min(0) @Max(100)
    y: number;

    @IsOptional() @IsIn(['mm', 'pt', 'percent'])
    unit?: 'mm' | 'pt' | 'percent';

    @IsOptional() @IsString() @MaxLength(1000)
    textTemplate?: string;

    @IsOptional() @IsString() @MaxLength(100)
    fontName?: string;

    @IsOptional() @IsNumber() @Min(1) @Max(300)
    fontSize?: number;

    @IsOptional() @IsIn(['normal', 'bold', 'italic', 'bold_italic'])
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bold_italic';

    @IsOptional() @IsString() @MaxLength(7)
    fontColor?: string;

    @IsOptional() @IsNumber() @Min(1) @Max(100)
    maxWidth?: number | null;

    @IsOptional() @IsNumber() @Min(1) @Max(100)
    fieldHeight?: number | null;

    @IsOptional() @IsBoolean()
    lineWrap?: boolean;

    @IsOptional() @IsNumber() @Min(1) @Max(5)
    lineHeight?: number;

    @IsOptional() @IsIn(['left', 'center', 'right'])
    textAlign?: 'left' | 'center' | 'right';

    @IsOptional() @IsString() @MaxLength(2048)
    fontFilePath?: string | null;
}

export class SaveCertificateTemplateDto {
    @IsOptional() @IsInt() @Min(1)
    templateId?: number;

    @IsString() @MinLength(1) @MaxLength(255)
    name: string;

    @IsOptional()
    @IsIn(['participant', 'speaker', 'volunteer', 'mentor', 'winner', 'other'])
    kind?: string;

    @IsString() @MinLength(1) @MaxLength(2048)
    pdfFilePath: string;

    @IsNumber() @Min(1) @Max(2000)
    pageWidth: number;

    @IsNumber() @Min(1) @Max(2000)
    pageHeight: number;

    @IsOptional() @IsString() @MaxLength(2048)
    previewPath?: string | null;

    @IsOptional()
    @IsDateString()
    issuanceStartsAt?: string | null;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaveCertificateFieldDto)
    fields: SaveCertificateFieldDto[];
}
