import { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, CalendarDays } from 'lucide-react';
import { useParams } from 'react-router-dom';
import RegisterButton from './feature/RegisterButton.jsx';
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

/**
 * Бэкенд отдаёт:
 *   programs: [{ programId, name, description, schedule: [{ scheduleItemId, itemDate, startTime, endTime, name, locationPlace }] }]
 *   commonScheduleByDate: { "YYYY-MM-DD": [{ commonItemId, itemDate, startTime, endTime, name, locationPlace }] }
 *
 * Собираем плоский список слотов: один scheduleItemId → один слот со списком программ.
 */
function buildSlots(event) {
    if (!event) return [];

    const byKey = new Map();

    (event.programs || []).forEach((program) => {
        (program.schedule || []).forEach((slot) => {
            const key = slot.scheduleItemId != null ? `s:${slot.scheduleItemId}` : `k:${slot.itemDate}|${slot.startTime}|${slot.endTime}|${slot.name}`;

            let entry = byKey.get(key);
            if (!entry) {
                entry = {
                    key,
                    itemDate: slot.itemDate,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    name: slot.name,
                    locationPlace: slot.locationPlace,
                    programs: [],
                };
                byKey.set(key, entry);
            }

            entry.programs.push({
                programId: program.programId,
                name: program.name,
                description: program.description,
            });
        });
    });

    Object.values(event.commonScheduleByDate || {}).forEach((items) => {
        (items || []).forEach((item) => {
            const key = `c:${item.commonItemId}`;
            if (!byKey.has(key)) {
                byKey.set(key, {
                    key,
                    itemDate: item.itemDate,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    name: item.name,
                    locationPlace: item.locationPlace,
                    programs: [],
                });
            }
        });
    });

    return [...byKey.values()].sort((a, b) => {
        const da = a.itemDate ?? '';
        const db = b.itemDate ?? '';
        if (da !== db) return da < db ? -1 : 1;
        const ta = a.startTime ?? '';
        const tb = b.startTime ?? '';
        if (ta === tb) return 0;
        return ta < tb ? -1 : 1;
    });
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

    const slots = useMemo(() => buildSlots(event), [event]);

    const dates = useMemo(() => {
        const set = new Set();
        slots.forEach((slot) => {
            if (slot.itemDate) set.add(slot.itemDate);
        });
        return [...set].sort();
    }, [slots]);

    // Без setState в рендере: activeDate — состояние, selectedDate — вычисление.
    const selectedDate = dates.includes(activeDate) ? activeDate : dates[0] || '';

    const visibleSchedule = slots.filter((slot) => slot.itemDate === selectedDate);

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
                    <CalendarDays size={28} />
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
                <RegisterButton key={event.eventId} eventId={event.eventId} />
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

                                        {slot.programs.length > 0 && (
                                            <div className="public-event__programs-grid">
                                                {slot.programs.map((program) => (
                                                    <div key={`${slot.key}:${program.programId}`} className="public-event__program-card">
                                                        <h4>{program.name}</h4>
                                                        {program.description && <p>{program.description}</p>}
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
