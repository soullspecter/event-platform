import { buildProgramsPayload } from './Programs.payload';
import { buildCommonSchedulePayload } from './CommonSchedule.payload';
import { buildQuestionnairesPayload } from './Questionnaires.payload';
import { toTrimmedOrNull } from '../eventForm.utils';

export function buildEventPayload({ event, programs, commonSchedule }) {
    return {
        title: toTrimmedOrNull(event.title),
        description: toTrimmedOrNull(event.description),
        startDate: event.startDate || null,
        endDate: event.endDate || null,
        programs: buildProgramsPayload(programs),
        commonSchedule: buildCommonSchedulePayload(commonSchedule),
        questionnaires: buildQuestionnairesPayload(event.questionnaires || []),
        certificates: (event.certificates || []).map((certificate) => ({
            ...(certificate.templateId ? { templateId: Number(certificate.templateId) } : {}),
            name: certificate.name?.trim() || 'Сертификат',
            kind: certificate.kind || 'participant',
            pdfFilePath: certificate.pdfFilePath,
            pageWidth: Number(certificate.pageWidth),
            pageHeight: Number(certificate.pageHeight),
            previewPath: certificate.previewPath || null,
            issuanceStartsAt: certificate.issuanceStartsAt ? `${certificate.issuanceStartsAt}:00+05:00` : null,
            fields: (certificate.fields || []).map((field) => ({
                ...(field.fieldId ? { fieldId: Number(field.fieldId) } : {}),
                x: Number(field.x),
                y: Number(field.y),
                unit: 'percent',
                textTemplate: field.textTemplate || '{last_name} {first_name} {middle_name}',
                fontName: field.fontName || 'Arial',
                fontSize: Number(field.fontSize || 24),
                fontStyle: field.fontStyle || 'normal',
                fontColor: field.fontColor || '#000000',
                maxWidth: Number(field.maxWidth || 70),
                fieldHeight: Number(field.fieldHeight || 12),
                lineWrap: Boolean(field.lineWrap),
                lineHeight: Number(field.lineHeight || 1.2),
                textAlign: field.textAlign || 'center',
                fontFilePath: field.fontFilePath || null,
            })),
        })),
    };
}
