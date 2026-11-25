import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UploadCertificateFileDto } from './dto/upload-certificate-file.dto';
import { CertificatesStorageService } from './certificates-storage.service';

@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CertificatesController {
    constructor(private readonly storage: CertificatesStorageService) {}

    @Post('upload')
    upload(@Body() dto: UploadCertificateFileDto) {
        return this.storage.upload(dto.fileName, dto.category, dto.contentType, dto.base64);
    }
}
