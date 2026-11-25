import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CertificateTemplateField } from './certificate-template-field.entity';

@Entity({ name: 'certificate_templates' })
export class CertificateTemplate {
    @PrimaryGeneratedColumn({ name: 'template_id', type: 'integer' })
    templateId: number;

    @Column({ name: 'event_id', type: 'integer' })
    eventId: number;

    @Column({ name: 'kind', type: 'varchar', length: 30, default: 'participant' })
    kind: string;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'pdf_file_path', type: 'text' })
    pdfFilePath: string;

    @Column({ name: 'page_width', type: 'numeric', precision: 10, scale: 2, default: 210 })
    pageWidth: string;

    @Column({ name: 'page_height', type: 'numeric', precision: 10, scale: 2, default: 297 })
    pageHeight: string;

    @Column({ name: 'preview_path', type: 'text', nullable: true })
    previewPath: string | null;

    @Column({ name: 'issuance_starts_at', type: 'timestamptz', nullable: true })
    issuanceStartsAt: Date | null;

    @OneToMany(() => CertificateTemplateField, (field) => field.template, { cascade: true })
    fields: CertificateTemplateField[];
}
