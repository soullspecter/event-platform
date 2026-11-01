import { ArrowUpRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'

import './EventCard.scss'

function parseDate(value) {
	if (!value) return null

	const [year, month, day] = value.split('-').map(Number)

	if (!year || !month || !day) return null

	const date = new Date(year, month - 1, day)

	return Number.isNaN(date.getTime()) ? null : date
}

function formatEventDate(value) {
	const date = parseDate(value)

	if (!date) return 'Дата уточняется'

	return new Intl.DateTimeFormat('ru-RU', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(date)
}

export default function EventCard({ event, index = 0 }) {
	return (
		<Link
			className={`event-card event-card--tone-${index % 3}`}
			to={`/events/${event.eventId}`}
		>
			<div className='event-card__accent' aria-hidden='true'>
				<span className='event-card__accent-orb' />
			</div>

			<div className='event-card__body'>
				<div className='event-card__date'>
					<CalendarDays size={16} strokeWidth={1.8} />
					<span>{formatEventDate(event.startDate)}</span>
				</div>

				<h3 className='event-card__title'>{event.title}</h3>

				<p className='event-card__description'>
					{event.description || 'Описание пока не добавлено.'}
				</p>

				<div className='event-card__bottom'>
					<span className='event-card__more'>Узнать о событии</span>

					<span className='event-card__arrow' aria-hidden='true'>
						<ArrowUpRight size={19} />
					</span>
				</div>
			</div>
		</Link>
	)
}
