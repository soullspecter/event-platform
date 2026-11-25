BEGIN;

-- Размеры области ФИО.
ALTER TABLE certificate_template_fields
    ADD COLUMN IF NOT EXISTS field_height NUMERIC(10,2);

-- Выравнивание текста.
ALTER TABLE certificate_template_fields
    ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) NOT NULL DEFAULT 'center';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_certificate_text_align'
          AND conrelid = 'certificate_template_fields'::regclass
    ) THEN
        ALTER TABLE certificate_template_fields
            ADD CONSTRAINT chk_certificate_text_align
            CHECK (text_align IN ('left', 'center', 'right'));
    END IF;
END $$;

-- Время начала выдачи сертификата.
ALTER TABLE certificate_templates
    ADD COLUMN IF NOT EXISTS issuance_starts_at TIMESTAMPTZ;

-- Ссылка на пользовательский шрифт в Supabase Storage.
-- Сам файл в PostgreSQL не сохраняется.
ALTER TABLE certificate_template_fields
    ADD COLUMN IF NOT EXISTS font_file_path TEXT;

-- Одному мероприятию можно назначить несколько сертификатов одного типа.
ALTER TABLE certificate_templates
    DROP CONSTRAINT IF EXISTS uq_certificate_templates_event_kind;

-- Bucket для PDF-шаблонов и пользовательских TTF/OTF.
-- Файлы хранятся в Supabase Storage, а не в таблицах PostgreSQL.
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'certificates',
    'certificates',
    TRUE,
    20971520,
    ARRAY[
        'application/pdf',
        'font/ttf',
        'font/otf',
        'application/x-font-ttf',
        'application/x-font-opentype',
        'application/octet-stream'
    ]
)
ON CONFLICT (id) DO UPDATE
SET
    public = TRUE,
    file_size_limit = 20971520,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;
