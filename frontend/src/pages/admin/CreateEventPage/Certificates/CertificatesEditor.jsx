import { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Award, Upload, Trash2, FileText, Type, Move, CalendarClock } from 'lucide-react';

import { certificatesApi } from '../../../../shared/api/certificates.api';
import './CertificatesEditor.scss';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const DEFAULT_FIELD = {
    x: 20,
    y: 42,
    unit: 'percent',
    textTemplate: '{last_name} {first_name} {middle_name}',
    fontName: 'Arial',
    fontSize: 24,
    fontStyle: 'normal',
    fontColor: '#000000',
    maxWidth: 60,
    fieldHeight: 14,
    lineWrap: false,
    lineHeight: 1.2,
    textAlign: 'center',
    fontFilePath: null,
};

const DEFAULT_CERTIFICATE = {
    name: 'Новый сертификат',
    kind: 'participant',
    pdfFilePath: '',
    pageWidth: 210,
    pageHeight: 297,
    previewPath: null,
    issuanceStartsAt: '',
    fields: [{ ...DEFAULT_FIELD }],
};

function makeId() {
    return `certificate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => {
            reject(new Error('Не удалось прочитать файл'));
        };

        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.slice(result.indexOf(',') + 1));
        };

        reader.readAsDataURL(file);
    });
}

function toYekaterinburgInput(value) {
    if (!value) return '';

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Yekaterinburg',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}T${values.minute ? values.minute : '00'}`;
}

function normalizeCertificate(item) {
    return {
        ...DEFAULT_CERTIFICATE,
        ...item,
        clientId: item.clientId || makeId(),

        pageWidth: Number(item.pageWidth || 210),
        pageHeight: Number(item.pageHeight || 297),

        issuanceStartsAt: toYekaterinburgInput(item.issuanceStartsAt),

        fields: (item.fields?.length ? item.fields : [{ ...DEFAULT_FIELD }]).map((field) => ({
            ...DEFAULT_FIELD,
            ...field,

            x: Number(field.x ?? DEFAULT_FIELD.x),
            y: Number(field.y ?? DEFAULT_FIELD.y),

            maxWidth: Number(field.maxWidth ?? DEFAULT_FIELD.maxWidth),

            fieldHeight: Number(field.fieldHeight ?? DEFAULT_FIELD.fieldHeight),

            fontSize: Number(field.fontSize ?? DEFAULT_FIELD.fontSize),
        })),
    };
}

export default function CertificatesEditor({ certificates = [], onChange }) {
    const normalized = useMemo(() => certificates.map(normalizeCertificate), [certificates]);

    const [selectedId, setSelectedId] = useState(normalized[0]?.clientId || null);

    const [localPreview, setLocalPreview] = useState(null);
    const [previewError, setPreviewError] = useState('');

    const [testName, setTestName] = useState('Иванов Иван Иванович');

    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [pageWidthPx, setPageWidthPx] = useState(0);

    const canvasRef = useRef(null);
    const pageRef = useRef(null);
    const dragRef = useRef(null);

    const items = normalized;

    // Определяем актуальный выбранный сертификат
    // непосредственно во время рендера.
    const activeSelectedId = items.some((item) => item.clientId === selectedId) ? selectedId : items[0]?.clientId || null;

    const selected = items.find((item) => item.clientId === activeSelectedId) || null;

    const field = selected?.fields?.[0] || null;

    // Локальный предпросмотр используется сразу после загрузки.
    // Для остальных случаев используется ссылка из БД.
    const previewUrl = localPreview?.clientId === activeSelectedId && localPreview?.filePath === selected?.pdfFilePath ? localPreview.url : selected?.pdfFilePath || '';

    // Освобождаем временные URL при замене предпросмотра
    // или размонтировании компонента.
    useEffect(() => {
        return () => {
            if (localPreview?.url) {
                URL.revokeObjectURL(localPreview.url);
            }
        };
    }, [localPreview]);

    // Следим за реальной шириной области предпросмотра.
    useEffect(() => {
        const element = pageRef.current;

        if (!element) {
            setPageWidthPx(0);
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width;

            if (width) {
                setPageWidthPx(width);
            }
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [selected?.clientId]);

    // Отображение PDF.
    useEffect(() => {
        let cancelled = false;
        let loadingTask = null;

        async function renderPdf() {
            if (!previewUrl || !canvasRef.current) return;

            try {
                loadingTask = pdfjsLib.getDocument(previewUrl);

                const pdf = await loadingTask.promise;

                if (cancelled) return;

                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.5 });

                const canvas = canvasRef.current;

                if (!canvas || cancelled) return;

                const context = canvas.getContext('2d');

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport,
                }).promise;

                if (!cancelled) {
                    setPreviewError('');
                }
            } catch (error) {
                if (!cancelled) {
                    setPreviewError(error.message || 'Не удалось отобразить PDF');
                }
            }
        }

        renderPdf();

        return () => {
            cancelled = true;

            if (loadingTask) {
                loadingTask.destroy();
            }
        };
    }, [previewUrl]);

    // Загрузка пользовательского шрифта.
    useEffect(() => {
        if (!field?.fontFilePath || !field.fontName) {
            return undefined;
        }

        let active = true;

        const font = new FontFace(field.fontName, `url("${field.fontFilePath}")`);

        font.load()
            .then((loaded) => {
                if (active) {
                    document.fonts.add(loaded);
                }
            })
            .catch(() => {
                if (active) {
                    setMessage('Не удалось загрузить пользовательский шрифт для предпросмотра.');
                }
            });

        return () => {
            active = false;
        };
    }, [field?.fontFilePath, field?.fontName]);

    function emit(next) {
        onChange?.(next);
    }

    function updateCertificate(patch) {
        emit(items.map((item) => (item.clientId === activeSelectedId ? { ...item, ...patch } : item)));
    }

    function updateField(patch) {
        if (!selected || !field) return;

        updateCertificate({
            fields: [
                {
                    ...field,
                    ...patch,
                },
            ],
        });
    }

    function addCertificate() {
        const next = {
            ...DEFAULT_CERTIFICATE,
            clientId: makeId(),
            fields: [{ ...DEFAULT_FIELD }],
        };

        emit([...items, next]);

        setSelectedId(next.clientId);
        setLocalPreview(null);
        setMessage('');
        setPreviewError('');
    }

    function removeCertificate() {
        if (!selected) return;

        if (!window.confirm(`Удалить сертификат «${selected.name}» из мероприятия?`)) {
            return;
        }

        const next = items.filter((item) => item.clientId !== activeSelectedId);

        emit(next);

        setSelectedId(next[0]?.clientId || null);
        setMessage('');
        setPreviewError('');
    }

    async function handleTemplateUpload(file) {
        if (!file || !selected) return;

        const ext = file.name.split('.').pop()?.toLowerCase();

        if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
            setMessage('Выберите PDF, JPG или PNG.');
            return;
        }

        setBusy(true);
        setMessage('Подготавливаем шаблон…');

        try {
            const sourceBytes = new Uint8Array(await file.arrayBuffer());

            let pdfBytes;
            let pageWidthPt;
            let pageHeightPt;

            if (ext === 'pdf') {
                const pdf = await PDFDocument.load(sourceBytes);

                const page = pdf.getPages()[0];

                if (!page) {
                    throw new Error('В PDF нет страниц');
                }

                const size = page.getSize();

                pageWidthPt = size.width;
                pageHeightPt = size.height;

                pdfBytes = await pdf.save();
            } else {
                const pdf = await PDFDocument.create();

                const image = ext === 'png' ? await pdf.embedPng(sourceBytes) : await pdf.embedJpg(sourceBytes);

                // Принимаем 300 DPI для растрового оригинала.
                pageWidthPt = (image.width * 72) / 300;
                pageHeightPt = (image.height * 72) / 300;

                const page = pdf.addPage([pageWidthPt, pageHeightPt]);

                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: pageWidthPt,
                    height: pageHeightPt,
                });

                pdfBytes = await pdf.save();
            }

            const pdfBlob = new Blob([pdfBytes], {
                type: 'application/pdf',
            });

            const localUrl = URL.createObjectURL(pdfBlob);

            const pdfFile = new File([pdfBlob], `${file.name.replace(/\.[^.]+$/, '')}.pdf`, {
                type: 'application/pdf',
            });

            const base64 = await fileToBase64(pdfFile);

            const uploaded = await certificatesApi.uploadFile({
                fileName: pdfFile.name,
                category: 'template',
                contentType: 'application/pdf',
                base64,
            });

            updateCertificate({
                name: selected.name === 'Новый сертификат' ? file.name.replace(/\.[^.]+$/, '') : selected.name,

                pdfFilePath: uploaded.publicUrl,
                previewPath: null,

                pageWidth: Number(((pageWidthPt * 25.4) / 72).toFixed(2)),

                pageHeight: Number(((pageHeightPt * 25.4) / 72).toFixed(2)),
            });

            setLocalPreview({
                clientId: activeSelectedId,
                filePath: uploaded.publicUrl,
                url: localUrl,
            });

            setPreviewError('');
            setMessage('Шаблон загружен. Настройте область ФИО.');
        } catch (error) {
            setMessage(error.message || 'Не удалось загрузить шаблон');
        } finally {
            setBusy(false);
        }
    }

    async function handleFontUpload(file) {
        if (!file || !selected) return;

        const ext = file.name.split('.').pop()?.toLowerCase();

        if (!['ttf', 'otf'].includes(ext)) {
            setMessage('Поддерживаются только TTF и OTF.');
            return;
        }

        setBusy(true);

        try {
            const base64 = await fileToBase64(file);

            const uploaded = await certificatesApi.uploadFile({
                fileName: file.name,
                category: 'font',
                contentType: ext === 'ttf' ? 'font/ttf' : 'font/otf',
                base64,
            });

            updateField({
                fontName: file.name.replace(/\.[^.]+$/, ''),
                fontFilePath: uploaded.publicUrl,
            });

            setMessage('Шрифт загружен.');
        } catch (error) {
            setMessage(error.message || 'Не удалось загрузить шрифт');
        } finally {
            setBusy(false);
        }
    }

    function startDrag(event, mode) {
        if (!pageRef.current || !field) return;

        event.preventDefault();

        event.currentTarget.setPointerCapture?.(event.pointerId);

        const rect = pageRef.current.getBoundingClientRect();

        dragRef.current = {
            mode,

            startX: event.clientX,
            startY: event.clientY,

            rect,

            x: field.x,
            y: field.y,

            width: field.maxWidth,
            height: field.fieldHeight,
        };
    }

    function moveDrag(event) {
        const drag = dragRef.current;

        if (!drag) return;

        const dx = ((event.clientX - drag.startX) / drag.rect.width) * 100;

        const dy = ((event.clientY - drag.startY) / drag.rect.height) * 100;

        if (drag.mode === 'move') {
            updateField({
                x: Math.max(0, Math.min(100 - drag.width, drag.x + dx)),

                y: Math.max(0, Math.min(100 - drag.height, drag.y + dy)),
            });
        } else {
            updateField({
                maxWidth: Math.max(5, Math.min(100 - drag.x, drag.width + dx)),

                fieldHeight: Math.max(4, Math.min(100 - drag.y, drag.height + dy)),
            });
        }
    }

    function stopDrag() {
        dragRef.current = null;
    }

    const displayFontSize = pageWidthPx && selected && field ? Math.max(8, field.fontSize * (pageWidthPx / ((selected.pageWidth * 72) / 25.4))) : field?.fontSize || 24;

    return (
        <div className="cert-editor">
            <div className="cert-editor__heading">
                <div>
                    <h2>
                        <Award size={20} />
                        Сертификаты мероприятия
                    </h2>

                    <p>Загрузите шаблоны и настройте расположение ФИО. Все изменения сохраняются общей кнопкой мероприятия.</p>
                </div>

                <button type="button" className="cert-button cert-button--primary" onClick={addCertificate}>
                    <Upload size={16} />
                    Добавить сертификат
                </button>
            </div>

            <div className="cert-editor__layout">
                <aside className="cert-editor__sidebar">
                    <div className="cert-editor__list-title">
                        Шаблоны <span>{items.length}</span>
                    </div>

                    {items.length === 0 ? (
                        <div className="cert-editor__empty-list">Пока нет сертификатов. Добавьте первый шаблон.</div>
                    ) : (
                        items.map((item) => (
                            <button
                                type="button"
                                key={item.clientId}
                                className={`cert-editor__item ${item.clientId === activeSelectedId ? 'is-active' : ''}`}
                                onClick={() => setSelectedId(item.clientId)}
                            >
                                <FileText size={17} />

                                <span>
                                    <strong>{item.name || 'Без названия'}</strong>

                                    <small>{item.pdfFilePath ? 'Шаблон загружен' : 'Ожидает загрузки'}</small>
                                </span>
                            </button>
                        ))
                    )}
                </aside>

                {!selected ? (
                    <section className="cert-editor__empty-workspace">Добавьте сертификат, чтобы открыть редактор.</section>
                ) : (
                    <section className="cert-editor__workspace">
                        <div className="cert-editor__top-fields">
                            <label>
                                Название сертификата
                                <input
                                    value={selected.name || ''}
                                    onChange={(event) =>
                                        updateCertificate({
                                            name: event.target.value,
                                        })
                                    }
                                    maxLength={255}
                                />
                            </label>

                            <label>
                                Тип
                                <select
                                    value={selected.kind || 'participant'}
                                    onChange={(event) =>
                                        updateCertificate({
                                            kind: event.target.value,
                                        })
                                    }
                                >
                                    <option value="participant">Участник</option>
                                    <option value="speaker">Спикер</option>
                                    <option value="volunteer">Волонтёр</option>
                                    <option value="mentor">Наставник</option>
                                    <option value="winner">Победитель</option>
                                    <option value="other">Другое</option>
                                </select>
                            </label>

                            <label className="cert-editor__date">
                                <span>
                                    <CalendarClock size={15} />
                                    Начало выдачи (Екатеринбург)
                                </span>

                                <input
                                    type="datetime-local"
                                    value={selected.issuanceStartsAt || ''}
                                    onChange={(event) =>
                                        updateCertificate({
                                            issuanceStartsAt: event.target.value,
                                        })
                                    }
                                />
                            </label>
                        </div>

                        <div className="cert-editor__file-row">
                            <label className="cert-button cert-button--secondary">
                                <Upload size={16} />

                                {selected.pdfFilePath ? 'Заменить шаблон' : 'Загрузить PDF / JPG / PNG'}

                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                    hidden
                                    disabled={busy}
                                    onChange={(event) => handleTemplateUpload(event.target.files?.[0])}
                                />
                            </label>

                            <button type="button" className="cert-button cert-button--danger" onClick={removeCertificate}>
                                <Trash2 size={16} />
                                Удалить сертификат
                            </button>
                        </div>

                        <div className="cert-editor__editor-grid">
                            <div className="cert-editor__preview-column">
                                <div className="cert-editor__preview-title">
                                    <Move size={15} />
                                    Перетащите область ФИО на нужное место
                                </div>

                                <div
                                    className="cert-editor__paper"
                                    ref={pageRef}
                                    style={{
                                        aspectRatio: `${selected.pageWidth} / ${selected.pageHeight}`,
                                    }}
                                >
                                    {previewUrl ? (
                                        <>
                                            <canvas ref={canvasRef} className="cert-editor__pdf-canvas" />

                                            {field && (
                                                <div
                                                    className="cert-editor__fio-box"
                                                    style={{
                                                        left: `${field.x}%`,
                                                        top: `${field.y}%`,
                                                        width: `${field.maxWidth}%`,
                                                        height: `${field.fieldHeight}%`,

                                                        color: field.fontColor,

                                                        fontFamily: `"${field.fontName}", Arial, sans-serif`,

                                                        fontSize: `${displayFontSize}px`,

                                                        fontWeight: field.fontStyle.includes('bold') ? 700 : 400,

                                                        fontStyle: field.fontStyle.includes('italic') ? 'italic' : 'normal',

                                                        textAlign: field.textAlign,

                                                        whiteSpace: field.lineWrap ? 'pre-wrap' : 'nowrap',

                                                        overflowWrap: field.lineWrap ? 'anywhere' : 'normal',
                                                    }}
                                                    onPointerDown={(event) => startDrag(event, 'move')}
                                                    onPointerMove={moveDrag}
                                                    onPointerUp={stopDrag}
                                                    onPointerCancel={stopDrag}
                                                >
                                                    <span>{testName || 'Фамилия Имя Отчество'}</span>

                                                    <button
                                                        type="button"
                                                        aria-label="Изменить размер области ФИО"
                                                        className="cert-editor__resize"
                                                        onPointerDown={(event) => {
                                                            event.stopPropagation();
                                                            startDrag(event, 'resize');
                                                        }}
                                                        onPointerMove={moveDrag}
                                                        onPointerUp={stopDrag}
                                                        onPointerCancel={stopDrag}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="cert-editor__no-preview">
                                            <FileText size={32} />

                                            <span>Загрузите PDF, JPG или PNG, чтобы увидеть шаблон</span>
                                        </div>
                                    )}
                                </div>

                                {previewError && <p className="cert-editor__error">{previewError}</p>}
                            </div>

                            <div className="cert-editor__settings">
                                <h3>
                                    <Type size={17} />
                                    Настройки ФИО
                                </h3>

                                <label>
                                    Тестовое ФИО
                                    <input value={testName} onChange={(event) => setTestName(event.target.value)} />
                                </label>

                                <div className="cert-editor__two-cols">
                                    <label>
                                        Шрифт
                                        <input
                                            value={field.fontName}
                                            onChange={(event) =>
                                                updateField({
                                                    fontName: event.target.value,
                                                    fontFilePath: null,
                                                })
                                            }
                                        />
                                    </label>

                                    <label>
                                        Размер (pt)
                                        <input
                                            type="number"
                                            min="1"
                                            max="300"
                                            value={field.fontSize}
                                            onChange={(event) =>
                                                updateField({
                                                    fontSize: Number(event.target.value),
                                                })
                                            }
                                        />
                                    </label>
                                </div>

                                <label className="cert-editor__font-upload">
                                    Свой шрифт (TTF / OTF)
                                    <input type="file" accept=".ttf,.otf,font/ttf,font/otf" disabled={busy} onChange={(event) => handleFontUpload(event.target.files?.[0])} />
                                </label>

                                <div className="cert-editor__two-cols">
                                    <label>
                                        Начертание
                                        <select
                                            value={field.fontStyle}
                                            onChange={(event) =>
                                                updateField({
                                                    fontStyle: event.target.value,
                                                })
                                            }
                                        >
                                            <option value="normal">Обычный</option>
                                            <option value="bold">Жирный</option>
                                            <option value="italic">Курсив</option>
                                            <option value="bold_italic">Жирный курсив</option>
                                        </select>
                                    </label>

                                    <label>
                                        Цвет
                                        <input
                                            type="color"
                                            value={field.fontColor}
                                            onChange={(event) =>
                                                updateField({
                                                    fontColor: event.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                </div>

                                <label>
                                    Выравнивание
                                    <select
                                        value={field.textAlign}
                                        onChange={(event) =>
                                            updateField({
                                                textAlign: event.target.value,
                                            })
                                        }
                                    >
                                        <option value="left">По левому краю</option>
                                        <option value="center">По центру</option>
                                        <option value="right">По правому краю</option>
                                    </select>
                                </label>

                                <div className="cert-editor__two-cols">
                                    <label>
                                        X (%)
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={field.x}
                                            onChange={(event) =>
                                                updateField({
                                                    x: Number(event.target.value),
                                                })
                                            }
                                        />
                                    </label>

                                    <label>
                                        Y (%)
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={field.y}
                                            onChange={(event) =>
                                                updateField({
                                                    y: Number(event.target.value),
                                                })
                                            }
                                        />
                                    </label>

                                    <label>
                                        Ширина (%)
                                        <input
                                            type="number"
                                            min="5"
                                            max="100"
                                            value={field.maxWidth}
                                            onChange={(event) =>
                                                updateField({
                                                    maxWidth: Number(event.target.value),
                                                })
                                            }
                                        />
                                    </label>

                                    <label>
                                        Высота (%)
                                        <input
                                            type="number"
                                            min="4"
                                            max="100"
                                            value={field.fieldHeight}
                                            onChange={(event) =>
                                                updateField({
                                                    fieldHeight: Number(event.target.value),
                                                })
                                            }
                                        />
                                    </label>
                                </div>

                                <label className="cert-editor__checkbox">
                                    <input
                                        type="checkbox"
                                        checked={field.lineWrap}
                                        onChange={(event) =>
                                            updateField({
                                                lineWrap: event.target.checked,
                                            })
                                        }
                                    />
                                    Переносить текст по строкам
                                </label>

                                <p className="cert-editor__hint">
                                    В шаблон сохраняются только настройки и ссылки на файлы. ФИО участника будет подставляться из его профиля при будущей генерации PDF.
                                </p>
                            </div>
                        </div>

                        {message && (
                            <div className="cert-editor__message">
                                {busy ? 'Загрузка… ' : ''}
                                {message}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
