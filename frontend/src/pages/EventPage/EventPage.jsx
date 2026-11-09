import { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { eventsApi } from '../../shared/api/eventsApi.js';
import './EventPage.scss';

function parseDate(value) {
    if (!value) return null;
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDayLong(value) {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date) : '';
}

function formatWeekday(value) {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date) : '';
}

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
    const parts = [location.name, location.place, location.address].filter(Boolean);
    return parts.join(', ');
}

export default function EventPage() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeDate, setActiveDate] = useState('');

    useEffect(() => {
        let active = true;
        async function load() {
            setLoading(true);
            setError('');
            try {
                const data = await eventsApi.getPublishedById(id);
                if (active) setEvent(data);
            } catch (err) {
                if (active) setError(err.message || 'Не удалось загрузить мероприятие.');
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [id]);

    const dates = useMemo(() => {
        if (!event?.schedule) return [];
        const set = new Set();
        event.schedule.forEach((item) => {
            if (item.itemDate) set.add(item.itemDate);
        });
        return [...set].sort();
    }, [event]);

    const selectedDate = dates.includes(activeDate) ? activeDate : dates[0] || '';
    if (selectedDate !== activeDate) setActiveDate(selectedDate);

    const visibleSchedule = (event?.schedule || []).filter((item) => item.itemDate === selectedDate);

    if (loading) {
        return (
            <main className="public-event">
                <div className="public-event__state">
                    <span className="public-event__spinner" />
                    Загружаем мероприятие...
                </div>
            </main>
        );
    }

    if (error || !event) {
        return (
            <main className="public-event">
                <div className="public-event__state">
                    <Sparkles size={28} />
                    <h1>Мероприятие не найдено</h1>
                    <p>{error || 'Возможно, оно еще не опубликовано.'}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="public-event">
            <header className="public-event__hero">
                <h1>{event.title || 'Без названия'}</h1>
                {event.description && <p>{event.description}</p>}
            </header>

            {dates.length > 0 && (
                <section className="public-event__section">
                    {dates.length > 1 && (
                        <div className="public-event__days-tabs">
                            {dates.map((date) => (
                                <button
                                    key={date}
                                    type="button"
                                    className={`public-event__day-tab ${selectedDate === date ? 'public-event__day-tab--active' : ''}`}
                                    onClick={() => setActiveDate(date)}
                                >
                                    <span className="public-event__day-tab-info">
                                        <span className="public-event__day-tab-date">{formatDayLong(date)}</span>
                                        <span className="public-event__day-tab-weekday">{formatWeekday(date)}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="public-event__day-content">
                        {visibleSchedule.length > 0 ? (
                            <div className="public-event__schedule-list">
                                {visibleSchedule.map((slot) => (
                                    <article className="public-event__schedule-item" key={slot.scheduleItemId}>
                                        {/* Шапка слота: время и название пункта */}
                                        <header className="public-event__slot-header">
                                            <div className="public-event__schedule-time">
                                                <Clock size={16} />
                                                {formatTimeRange(slot.startTime, slot.endTime)}
                                            </div>
                                            {slot.name && <h3 className="public-event__slot-name">{slot.name}</h3>}
                                        </header>

                                        {/* Сетка карточек программ */}
                                        {slot.programs?.length > 0 && (
                                            <div className="public-event__programs-grid">
                                                {slot.programs.map((program) => (
                                                    <div key={program.programId} className="public-event__program-card">
                                                        <h4>{program.name}</h4>
                                                        {program.description && <p>{program.description}</p>}
                                                        {program.locationPlace?.location && (
                                                            <div className="public-event__location">
                                                                <MapPin size={14} />
                                                                {getLocationLabel(program.locationPlace.location)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="public-event__empty">
                                <h2>На этот день пока ничего нет</h2>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {dates.length === 0 && (
                <section className="public-event__empty">
                    <h2>Программа ещё формируется</h2>
                </section>
            )}
        </main>
    );
}
