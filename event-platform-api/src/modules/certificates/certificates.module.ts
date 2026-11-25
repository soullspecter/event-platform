import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CertificateTemplate } from './entities/certificate-template.entity';
import { CertificateTemplateField } from './entities/certificate-template-field.entity';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { CertificatesStorageService } from './certificates-storage.service';

@Module({
    imports: [TypeOrmModule.forFeature([CertificateTemplate, CertificateTemplateField])],
    controllers: [CertificatesController],
    providers: [CertificatesService, CertificatesStorageService, RolesGuard],
    exports: [CertificatesService],
})
export class CertificatesModule {}
