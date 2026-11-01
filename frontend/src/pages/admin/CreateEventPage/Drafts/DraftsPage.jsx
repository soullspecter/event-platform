import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';

import { eventsApi } from '../../../../shared/api/eventsApi';
import './DraftsPage.scss';

function formatDate(value) {
    if (!value) return '';
    const raw = String(value).slice(0, 10);
    const date = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatDateRange(startDate, endDate) {
    if (!startDate && !endDate) return 'Даты не указаны';
    if (startDate && endDate) {
        return `${formatDate(startDate)} — ${formatDate(endDate)}`;
    }
    if (startDate) return `с ${formatDate(startDate)}`;
    return `до ${formatDate(endDate)}`;
}

export default function DraftsPage() {
    const navigate = useNavigate();

    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError('');

            try {
                const data = await eventsApi.getDrafts();
                if (!active) return;

                const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.events) ? data.events : Array.isArray(data?.data) ? data.data : [];

                setDrafts(list);
            } catch (err) {
                if (active) {
                    setError(err.message || 'Не удалось загрузить черновики');
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, []);

    function openDraft(draft) {
        const id = draft.eventId ?? draft.event_id ?? draft.id;
        if (!id) return;
        navigate(`/events/${id}/edit`);
    }

    if (loading) {
        return (
            <div className="drafts-page__loading">
                <span className="drafts-page__spinner" />
                Загружаем черновики…
            </div>
        );
    }

    return (
        <main className="drafts-page">
            <header className="drafts-page__header">
                <h1>Черновики</h1>
                <p>Выберите черновик, чтобы продолжить редактирование.</p>
            </header>

            {error && <div className="drafts-page__alert drafts-page__alert--error">{error}</div>}

            {drafts.length === 0 ? (
                <div className="drafts-page__empty">
                    <FileText size={32} />
                    <h3>Черновиков пока нет</h3>
                    <p>Создайте мероприятие и сохраните его как черновик.</p>
                </div>
            ) : (
                <ul className="drafts-page__list">
                    {drafts.map((draft) => {
                        const id = draft.eventId ?? draft.event_id ?? draft.id;

                        return (
                            <li key={id}>
                                <button type="button" className="drafts-page__item" onClick={() => openDraft(draft)}>
                                    <div className="drafts-page__item-icon">
                                        <FileText size={20} />
                                    </div>

                                    <div className="drafts-page__item-body">
                                        <strong>{draft.title || 'Без названия'}</strong>

                                        {draft.description && <p>{draft.description}</p>}

                                        <small>{formatDateRange(draft.startDate ?? draft.start_date, draft.endDate ?? draft.end_date)}</small>
                                    </div>

                                    <ChevronRight size={18} className="drafts-page__item-chevron" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
    );
}
