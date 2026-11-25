import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class CertificatesStorageService {
    constructor(private readonly config: ConfigService) {}

    async upload(fileName: string, category: 'template' | 'font', contentType: string, base64: string) {
        const buffer = Buffer.from(base64, 'base64');

        if (!buffer.length) {
            throw new BadRequestException('Файл пустой или повреждён');
        }
        if (buffer.length > 20 * 1024 * 1024) {
            throw new BadRequestException('Максимальный размер файла — 20 МБ');
        }

        const ext = (fileName.split('.').pop() || '').toLowerCase();
        const allowed = category === 'template' ? ['pdf'] : ['ttf', 'otf'];
        if (!allowed.includes(ext)) {
            throw new BadRequestException(category === 'template'
                ? 'В хранилище шаблонов принимается только PDF. JPG/PNG сначала преобразуются в PDF в редакторе.'
                : 'Поддерживаются только TTF и OTF');
        }

        const supabaseUrl = this.config.get<string>('SUPABASE_URL');
        const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        const bucket = this.config.get<string>('SUPABASE_CERTIFICATES_BUCKET', 'certificates');

        if (!supabaseUrl || !serviceKey) {
            throw new InternalServerErrorException('Не настроены SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
        }

        const safeName = `${randomUUID()}.${ext}`;
        const objectPath = `${category}/${safeName}`;
        const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${serviceKey}`,
                apikey: serviceKey,
                'Content-Type': contentType,
                'x-upsert': 'false',
            },
            body: buffer as unknown as BodyInit,
        });

        if (!response.ok) {
            const detail = await response.text();
            throw new InternalServerErrorException(`Не удалось загрузить файл в Supabase Storage: ${detail}`);
        }

        const publicUrl = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;

        return { path: objectPath, publicUrl, fileName: safeName };
    }
}
