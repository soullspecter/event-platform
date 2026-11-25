import { IsBase64, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class UploadCertificateFileDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    fileName: string;

    @IsIn(['template', 'font'])
    category: 'template' | 'font';

    @IsIn([
        'application/pdf',
        'image/jpeg',
        'image/png',
        'font/ttf',
        'font/otf',
        'application/x-font-ttf',
        'application/x-font-opentype',
        'application/octet-stream',
    ])
    contentType: string;

    @IsBase64()
    base64: string;
}
