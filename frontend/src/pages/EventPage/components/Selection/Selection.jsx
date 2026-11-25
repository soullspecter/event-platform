import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, MapPin } from 'lucide-react';
import { eventsApi } from '../../../../shared/api/eventsApi.js';
import './Selection.scss';

function formatTime(value) {
    return value ? String(value).slice(0, 5) : '';
}

function formatTimeRange(start, end) {
    const from = formatTime(start);
    const to = formatTime(end);

    if (from && to) return `${from} — ${to}`;

    return from || to;
}

function getLocationLabel(location) {
    if (!location) return '';

    return [location.name, location.place, location.address].filter(Boolean).join(', ');
}

export default function Selection({ eventId, slots = [], selectedItems = [], onClose, onSaved }) {
    const [draftItems, setDraftItems] = useState(() => selectedItems.map(Number));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Блокируем прокрутку страницы, пока открыта модалка.
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    // Закрытие по Escape.
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === 'Escape' && !saving) {
                onClose();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [saving, onClose]);

    function handleClose() {
        if (!saving) {
            onClose();
        }
    }

    function toggleItem(scheduleItemId) {
        setDraftItems((prev) => (prev.includes(scheduleItemId) ? prev.filter((id) => id !== scheduleItemId) : [...prev, scheduleItemId]));
    }

    async function handleSave() {
        if (saving) return;

        setSaving(true);
        setError('');

        const currentItems = selectedItems.map(Number);

        const added = draftItems.filter((id) => !currentItems.includes(id));

        const removed = currentItems.filter((id) => !draftItems.includes(id));

        try {
            await Promise.all([...added.map((id) => eventsApi.selectScheduleItem(eventId, id)), ...removed.map((id) => eventsApi.unselectScheduleItem(eventId, id))]);

            onSaved(draftItems);
            onClose();
        } catch (err) {
            // Часть запросов могла выполниться успешно.
            // Поэтому синхронизируем состояние с сервером.
            try {
                const data = await eventsApi.getMySelections(eventId);

                const actualItems = Array.isArray(data) ? data.map((item) => Number(item.scheduleItemId)) : [];

                setDraftItems(actualItems);
                onSaved(actualItems);
            } catch (refreshError) {
                console.error('Не удалось обновить выбор с сервера:', refreshError);
            }

            setError(err.message || 'Не удалось сохранить выбранные пункты');
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div
            className="selection-modal"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="selection-modal__content" role="dialog" aria-modal="true" aria-labelledby="selection-modal-title">
                <header className="selection-modal__header">
                    <div>
                        <h2 id="selection-modal-title">Выбор пунктов программы</h2>
                        <p>Отметьте мероприятия, которые хотите посетить</p>
                    </div>

                    <button type="button" className="selection-modal__close" onClick={handleClose} disabled={saving} aria-label="Закрыть">
                        <X size={22} />
                    </button>
                </header>

                <div className="selection-modal__body">
                    {slots.length > 0 ? (
                        <div className="public-event__schedule-list">
                            {slots.map((slot) => {
                                const itemId = Number(slot.scheduleItemId);
                                const isSelected = draftItems.includes(itemId);

                                return (
                                    <article className="public-event__schedule-item" key={slot.key}>
                                        <header className="public-event__slot-header">
                                            <div className="public-event__schedule-time">
                                                <Clock size={16} />
                                                {formatTimeRange(slot.startTime, slot.endTime)}
                                            </div>

                                            {slot.name && <h3 className="public-event__slot-name">{slot.name}</h3>}
                                        </header>

                                        {slot.locationPlace?.location && (
                                            <div className="public-event__location">
                                                <MapPin size={14} />
                                                {getLocationLabel(slot.locationPlace.location)}
                                            </div>
                                        )}

                                        {slot.programs?.length > 0 && (
                                            <div className="public-event__programs-grid">
                                                {slot.programs.map((program) => (
                                                    <div key={`${slot.key}:${program.programId}`} className="public-event__program-card">
                                                        <h4>{program.name}</h4>

                                                        {program.description && <p>{program.description}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className={`selection-modal__item-button ${isSelected ? 'selection-modal__item-button--selected' : ''}`}
                                            onClick={() => toggleItem(itemId)}
                                            disabled={saving}
                                        >
                                            {isSelected ? 'Отменить выбор' : 'Выбрать'}
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="selection-modal__empty">Пока нет пунктов программы для выбора.</p>
                    )}
                </div>

                {error && (
                    <p className="selection-modal__error" role="alert">
                        {error}
                    </p>
                )}

                <footer className="selection-modal__footer">
                    <span>Выбрано пунктов: {draftItems.length}</span>

                    <div>
                        <button type="button" className="selection-modal__cancel" onClick={handleClose} disabled={saving}>
                            Отмена
                        </button>

                        <button type="button" className="selection-modal__save" onClick={handleSave} disabled={saving}>
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>,
        document.body,
    );
}
