import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { CertificateTemplate } from './entities/certificate-template.entity';
import { CertificateTemplateField } from './entities/certificate-template-field.entity';
import { SaveCertificateTemplateDto } from './dto/save-event-certificates.dto';

@Injectable()
export class CertificatesService {
    async replaceForEvent(manager: EntityManager, eventId: number, items: SaveCertificateTemplateDto[]) {
        const templateRepo = manager.getRepository(CertificateTemplate);
        const fieldRepo = manager.getRepository(CertificateTemplateField);

        const existing = await templateRepo.find({
            where: { eventId },
            relations: { fields: true },
        });
        const existingIds = new Set(existing.map((item) => item.templateId));
        const incomingIds = new Set(items.filter((item) => item.templateId).map((item) => item.templateId));

        const removedIds = [...existingIds].filter((id) => !incomingIds.has(id));
        if (removedIds.length) {
            await templateRepo.delete({ eventId, templateId: In(removedIds) });
        }

        for (const item of items) {
            let template: CertificateTemplate;

            if (item.templateId) {
                const found = existing.find((row) => row.templateId === item.templateId);
                if (!found) {
                    throw new BadRequestException(`Шаблон сертификата ${item.templateId} не принадлежит этому мероприятию`);
                }
                template = found;
            } else {
                template = templateRepo.create({ eventId });
            }

            template.eventId = eventId;
            template.name = item.name.trim();
            template.kind = item.kind || 'participant';
            template.pdfFilePath = item.pdfFilePath;
            template.pageWidth = String(item.pageWidth);
            template.pageHeight = String(item.pageHeight);
            template.previewPath = item.previewPath ?? null;
            template.issuanceStartsAt = item.issuanceStartsAt ? new Date(item.issuanceStartsAt) : null;

            const savedTemplate = await templateRepo.save(template);

            // Для текущего этапа у одного шаблона одна размеченная область ФИО.
            // Таблица поддерживает несколько полей, поэтому сохраняем весь массив.
            await fieldRepo.delete({ templateId: savedTemplate.templateId });

            if (item.fields?.length) {
                const fields = item.fields.map((field) => fieldRepo.create({
                    templateId: savedTemplate.templateId,
                    x: String(field.x),
                    y: String(field.y),
                    unit: field.unit || 'percent',
                    textTemplate: field.textTemplate || '{last_name} {first_name} {middle_name}',
                    fontName: field.fontName || 'Arial',
                    fontSize: String(field.fontSize ?? 24),
                    fontStyle: field.fontStyle || 'normal',
                    fontColor: field.fontColor || '#000000',
                    maxWidth: field.maxWidth == null ? null : String(field.maxWidth),
                    fieldHeight: field.fieldHeight == null ? null : String(field.fieldHeight),
                    lineWrap: field.lineWrap ?? false,
                    lineHeight: String(field.lineHeight ?? 1.2),
                    textAlign: field.textAlign || 'center',
                    fontFilePath: field.fontFilePath || null,
                }));
                await fieldRepo.save(fields);
            }
        }
    }

    async findForEvent(manager: EntityManager, eventId: number) {
        return manager.getRepository(CertificateTemplate).find({
            where: { eventId },
            relations: { fields: true },
            order: { templateId: 'ASC' },
        });
    }
}
