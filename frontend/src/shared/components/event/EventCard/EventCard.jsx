import { ArrowUpRight, CalendarDays, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';

import './EventCard.scss';

function parseDate(value) {
    if (!value) return null;

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) return null;

    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatEventDate(value) {
    const date = parseDate(value);

    if (!date) return 'Дата уточняется';

    return new Intl.DateTimeFormat('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export default function EventCard({ event, index = 0 }) {
    return (
        <article className={`event-card event-card--tone-${index % 3}`}>
            <div className="event-card__accent" aria-hidden="true">
                <span className="event-card__accent-orb" />
            </div>

            <div className="event-card__body">
                <div className="event-card__date">
                    <CalendarDays size={16} strokeWidth={1.8} />
                    <span>{formatEventDate(event.startDate)}</span>
                </div>

                <h3 className="event-card__title">{event.title}</h3>

                <p className="event-card__description">{event.description || 'Описание пока не добавлено.'}</p>

                <div className="event-card__bottom">
                    <Link className="event-card__more" to={`/events/${event.eventId}`}>
                        Узнать о событии
                        <ArrowUpRight size={17} />
                    </Link>

                    <Link className="event-card__edit" to={`/events/${event.eventId}/edit`} title="Изменить событие" aria-label={`Изменить событие ${event.title}`}>
                        <Pencil size={16} />
                        Изменить
                    </Link>
                </div>
            </div>
        </article>
    );
}
