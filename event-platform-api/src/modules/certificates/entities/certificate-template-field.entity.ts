import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CertificateTemplate } from './certificate-template.entity';

@Entity({ name: 'certificate_template_fields' })
export class CertificateTemplateField {
    @PrimaryGeneratedColumn({ name: 'field_id', type: 'integer' })
    fieldId: number;

    @Column({ name: 'template_id', type: 'integer' })
    templateId: number;

    @ManyToOne(() => CertificateTemplate, (template) => template.fields, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'template_id' })
    template: CertificateTemplate;

    @Column({ type: 'numeric', precision: 10, scale: 2 })
    x: string;

    @Column({ type: 'numeric', precision: 10, scale: 2 })
    y: string;

    @Column({ type: 'varchar', length: 10, default: 'percent' })
    unit: 'mm' | 'pt' | 'percent';

    @Column({ name: 'text_template', type: 'text', default: '{last_name} {first_name} {middle_name}' })
    textTemplate: string;

    @Column({ name: 'font_name', type: 'varchar', length: 100, default: 'Arial' })
    fontName: string;

    @Column({ name: 'font_size', type: 'numeric', precision: 5, scale: 2, default: 14 })
    fontSize: string;

    @Column({ name: 'font_style', type: 'varchar', length: 30, default: 'normal' })
    fontStyle: 'normal' | 'bold' | 'italic' | 'bold_italic';

    @Column({ name: 'font_color', type: 'varchar', length: 7, default: '#000000' })
    fontColor: string;

    @Column({ name: 'max_width', type: 'numeric', precision: 10, scale: 2, nullable: true })
    maxWidth: string | null;

    @Column({ name: 'field_height', type: 'numeric', precision: 10, scale: 2, nullable: true })
    fieldHeight: string | null;

    @Column({ name: 'line_wrap', type: 'boolean', default: false })
    lineWrap: boolean;

    @Column({ name: 'line_height', type: 'numeric', precision: 5, scale: 2, default: 1.2 })
    lineHeight: string;

    @Column({ name: 'text_align', type: 'varchar', length: 10, default: 'center' })
    textAlign: 'left' | 'center' | 'right';

    // Путь к пользовательскому TTF/OTF в Supabase Storage.
    @Column({ name: 'font_file_path', type: 'text', nullable: true })
    fontFilePath: string | null;
}
