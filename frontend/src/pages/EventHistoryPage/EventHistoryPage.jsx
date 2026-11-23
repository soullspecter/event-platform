import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';

import EventCard from '../../shared/components/event/EventCard/EventCard.jsx';
import { eventsApi } from '../../shared/api/eventsApi.js';
import './EventHistoryPage.scss';

function toLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * История = мероприятия, которые уже закончились (endDate < сегодня).
 * Если endDate нет — используем startDate.
 */
function getEventEndKey(event) {
    const end = event?.endDate ?? event?.startDate;
    if (!end) return null;
    return String(end).slice(0, 10);
}

function getEventStartKey(event) {
    if (!event?.startDate) return null;
    return String(event.startDate).slice(0, 10);
}

export default function EventHistoryPage() {
    const [today] = useState(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    });

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedYear, setSelectedYear] = useState(null);

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError('');
            try {
                const data = await eventsApi.getPublished();
                if (active) setEvents(Array.isArray(data) ? data : []);
            } catch (err) {
                if (active) setError(err.message || 'Не удалось загрузить мероприятия.');
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
        return () => {
            active = false;
        };
    }, []);

    const todayKey = toLocalDateKey(today);

    // Прошедшие мероприятия, сгруппированные по году окончания.
    // Никаких мутаций: sort() вызывается на копиях, вложенные массивы не трогаем.
    const eventsByYear = useMemo(() => {
        const map = new Map();

        for (const event of events) {
            const endKey = getEventEndKey(event);
            if (!endKey) continue;
            if (endKey >= todayKey) continue; // ещё не закончилось

            const year = Number(endKey.slice(0, 4));
            if (!Number.isFinite(year)) continue;

            if (!map.has(year)) map.set(year, []);
            map.get(year).push(event);
        }

        return [...map.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([year, list]) => [
                year,
                [...list].sort((a, b) => {
                    const da = getEventStartKey(a) ?? '';
                    const db = getEventStartKey(b) ?? '';
                    if (da !== db) return db.localeCompare(da);
                    return Number(b.eventId) - Number(a.eventId);
                }),
            ]);
    }, [events, todayKey]);

    const years = useMemo(() => eventsByYear.map(([year]) => year), [eventsByYear]);

    // Если год не выбран — берём самый свежий с историей
    const effectiveYear = years.includes(selectedYear) ? selectedYear : (years[0] ?? null);

    const visibleEvents = useMemo(() => {
        if (effectiveYear == null) return [];
        const found = eventsByYear.find(([year]) => year === effectiveYear);
        return found ? found[1] : [];
    }, [eventsByYear, effectiveYear]);

    return (
        <div className="event-history">
            <header className="event-history__hero">
                <h1 className="event-history__title">История мероприятий</h1>
                <p className="event-history__subtitle">Вспомни, что уже было — по годам и датам.</p>
            </header>

            {loading ? (
                <div className="event-history__state">
                    <p>Загружаем мероприятия...</p>
                </div>
            ) : error ? (
                <div className="event-history__state">
                    <h4>Не удалось загрузить мероприятия</h4>
                    <p>{error}</p>
                </div>
            ) : years.length === 0 ? (
                <div className="event-history__state">
                    <CalendarDays size={28} />
                    <h4>Пока нет прошедших мероприятий</h4>
                    <p>Как только что-то завершится, оно появится здесь.</p>
                </div>
            ) : (
                <>
                    <div className="event-history__years" role="group" aria-label="Выбор года">
                        {years.map((year) => {
                            const isActive = year === effectiveYear;
                            return (
                                <button
                                    key={year}
                                    type="button"
                                    className={`event-history__year${isActive ? ' event-history__year--active' : ''}`}
                                    onClick={() => setSelectedYear(year)}
                                    aria-pressed={isActive}
                                >
                                    {year}
                                </button>
                            );
                        })}
                    </div>

                    {visibleEvents.length > 0 ? (
                        <div className="event-history__grid">
                            {visibleEvents.map((event, index) => (
                                <EventCard key={event.eventId} event={event} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="event-history__state">
                            <p>В {effectiveYear} году мероприятий не было.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
