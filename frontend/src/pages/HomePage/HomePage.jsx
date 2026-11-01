import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'

import EventCard from '../../shared/components/event/EventCard/EventCard.jsx'
import { eventsApi } from '../../shared/api/eventsApi.js'
import './HomePage.scss'

function toLocalDateKey(date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')

	return `${year}-${month}-${day}`
}

function getCalendarDays(startDate, count = 31) {
	return Array.from({ length: count }, (_, index) => {
		const date = new Date(startDate)
		date.setDate(date.getDate() + index)

		return {
			key: toLocalDateKey(date),
			date,
			weekday: new Intl.DateTimeFormat('ru-RU', {
				weekday: 'short',
			})
				.format(date)
				.replace('.', ''),
			day: date.getDate(),
			isToday: index === 0,
		}
	})
}

function getEventDateRange(event) {
	const startDate = event.startDate
		? String(event.startDate).slice(0, 10)
		: null

	const endDate = event.endDate ? String(event.endDate).slice(0, 10) : startDate

	if (!startDate) return null

	return {
		startDate,
		endDate: endDate || startDate,
	}
}

function isEventRelevantFromToday(event, todayKey) {
	const range = getEventDateRange(event)

	if (!range) return false

	return range.endDate >= todayKey
}

function isEventOnDate(event, dateKey) {
	const range = getEventDateRange(event)

	if (!range) return false

	return range.startDate <= dateKey && range.endDate >= dateKey
}

function getUpcomingEvents(events, today) {
	const todayKey = toLocalDateKey(today)

	return events
		.filter(event => isEventRelevantFromToday(event, todayKey))
		.sort((a, b) => {
			const dateA = String(a.startDate || '')
			const dateB = String(b.startDate || '')

			if (dateA !== dateB) {
				return dateA.localeCompare(dateB)
			}

			return Number(b.eventId) - Number(a.eventId)
		})
}

function formatSelectedDate(date) {
	return new Intl.DateTimeFormat('ru-RU', {
		day: 'numeric',
		month: 'long',
	}).format(date)
}

function formatMonth(date) {
	return new Intl.DateTimeFormat('ru-RU', {
		month: 'long',
	}).format(date)
}

function formatShortMonth(date) {
	return new Intl.DateTimeFormat('ru-RU', {
		month: 'short',
	})
		.format(date)
		.replace('.', '')
}

export default function HomePage() {
	const [today] = useState(() => {
		const date = new Date()
		date.setHours(0, 0, 0, 0)

		return date
	})

	const [selectedDate, setSelectedDate] = useState(null)
	const [events, setEvents] = useState([])
	const [loadingEvents, setLoadingEvents] = useState(true)
	const [eventsError, setEventsError] = useState('')

	useEffect(() => {
		const controller = new AbortController()
		let active = true

		async function loadEvents() {
			setLoadingEvents(true)
			setEventsError('')

			try {
				const data = await eventsApi.getPublished({
					signal: controller.signal,
				})

				if (!active) return

				setEvents(Array.isArray(data) ? data : [])
			} catch (error) {
				if (!active || error.name === 'AbortError') return

				setEventsError(error.message || 'Не удалось загрузить мероприятия.')
			} finally {
				if (active) setLoadingEvents(false)
			}
		}

		loadEvents()

		return () => {
			active = false
			controller.abort()
		}
	}, [])

	const calendarDays = useMemo(() => getCalendarDays(today), [today])

	const upcomingEvents = useMemo(
		() => getUpcomingEvents(events, today),
		[events, today],
	)

	const eventDates = useMemo(() => {
		const dates = new Set()

		for (const day of calendarDays) {
			if (upcomingEvents.some(event => isEventOnDate(event, day.key))) {
				dates.add(day.key)
			}
		}

		return dates
	}, [calendarDays, upcomingEvents])

	const selectedDay = calendarDays.find(day => day.key === selectedDate) ?? null

	const visibleEvents = useMemo(() => {
		if (!selectedDate) return upcomingEvents

		return upcomingEvents.filter(event => isEventOnDate(event, selectedDate))
	}, [selectedDate, upcomingEvents])

	const headingDate = selectedDay ? formatSelectedDate(selectedDay.date) : null

	function handleDateSelect(date) {
		setSelectedDate(current => (current === date ? null : date))
	}

	function handleResetDate() {
		setSelectedDate(null)
	}

	return (
		<div className='home-page'>
			<section className='home-hero'>
				<div className='home-hero__glow home-hero__glow--violet' />
				<div className='home-hero__glow home-hero__glow--pink' />

				<div className='home-hero__topline'>
					<div className='home-hero__brand-note'>
						ТВОЁ ПРОСТРАНСТВО ВПЕЧАТЛЕНИЙ
					</div>
				</div>

				<div className='home-hero__main'>
					<div className='home-hero__copy'>
						<h1 className='home-hero__title'>
							Твой следующий
							<br />
							<span>этап в жизни</span>
							<br />
							уже где-то рядом.
						</h1>

						<p className='home-hero__description'>
							Находи людей по интересам, открывай новые идеи и наполняй
							календарь встречами, которые запомнятся.
						</p>
					</div>

					<div className='home-hero__art' aria-hidden='true'>
						<div className='home-hero__art-ring home-hero__art-ring--outer' />
						<div className='home-hero__art-ring home-hero__art-ring--inner' />

						<div className='home-hero__art-orb'>
							<div className='home-hero__art-orb-shine' />
							<Sparkles size={58} strokeWidth={1.25} />
						</div>

						<span className='home-hero__art-star home-hero__art-star--one'>
							✳
						</span>
						<span className='home-hero__art-star home-hero__art-star--two'>
							✦
						</span>
						<span className='home-hero__art-star home-hero__art-star--three'>
							✧
						</span>

						<div className='home-hero__art-note'>
							<span className='home-hero__art-note-dot' />
							Новые впечатления начинаются здесь
						</div>
					</div>
				</div>

				<div className='home-hero__bottomline'>
					<span>ЛЮДИ</span>
					<span className='home-hero__bottomline-dot' />
					<span>ИДЕИ</span>
					<span className='home-hero__bottomline-dot' />
					<span>ЭВЕНТЫ</span>
					<span className='home-hero__bottomline-spacer' />
					<span className='home-hero__bottomline-caption'>
						Участвуй. Выбирай. Встречайся.
					</span>
				</div>
			</section>

			<section
				className='event-calendar'
				id='event-calendar'
				aria-labelledby='event-calendar-title'
			>
				<div className='event-calendar__heading'>
					<div>
						<h2 className='event-calendar__title' id='event-calendar-title'>
							Когда увидимся?
						</h2>
					</div>
				</div>

				<div className='date-picker'>
					<div className='date-picker__top'>
						{selectedDate && (
							<button
								className='date-picker__reset'
								type='button'
								onClick={handleResetDate}
							>
								Все даты
							</button>
						)}
					</div>

					<div
						className='date-picker__list'
						role='group'
						aria-label='Выбор даты мероприятия'
					>
						{calendarDays.map(day => {
							const hasEvents = eventDates.has(day.key)
							const isSelected = selectedDate === day.key

							return (
								<button
									key={day.key}
									className={[
										'date-chip',
										hasEvents && 'date-chip--has-events',
										isSelected && 'date-chip--selected',
										day.isToday && 'date-chip--today',
									]
										.filter(Boolean)
										.join(' ')}
									type='button'
									onClick={() => handleDateSelect(day.key)}
									aria-pressed={isSelected}
									aria-label={`${day.day} ${formatMonth(day.date)}${
										hasEvents ? ', есть мероприятия' : ', мероприятий пока нет'
									}`}
								>
									<span className='date-chip__weekday'>
										{day.isToday ? 'сегодня' : day.weekday}
									</span>

									<span className='date-chip__circle'>
										<span className='date-chip__number'>{day.day}</span>
										{hasEvents && <span className='date-chip__event-dot' />}
									</span>

									<span className='date-chip__month'>
										{formatShortMonth(day.date)}
									</span>
								</button>
							)
						})}
					</div>

					<div className='date-picker__legend'>
						<span className='date-picker__legend-item'>
							<span className='date-picker__legend-dot date-picker__legend-dot--active' />
							Есть мероприятия
						</span>
						<span className='date-picker__legend-item'>
							<span className='date-picker__legend-dot' />
							Свободный день
						</span>
					</div>
				</div>

				<div className='event-results'>
					<div className='event-results__heading'>
						<div>
							<h3 className='event-results__title'>
								{selectedDay ? headingDate : 'Есть ради чего выйти'}
							</h3>
						</div>
					</div>

					{loadingEvents ? (
						<div className='event-empty'>
							<p>Загружаем мероприятия...</p>
						</div>
					) : eventsError ? (
						<div className='event-empty'>
							<h4>Не удалось загрузить мероприятия</h4>
							<p>{eventsError}</p>
						</div>
					) : visibleEvents.length > 0 ? (
						<div className='home-page__events'>
							{visibleEvents.map((event, index) => (
								<EventCard key={event.eventId} event={event} index={index} />
							))}
						</div>
					) : (
						<div className='event-empty'>
							<div className='event-empty__icon'>
								<Sparkles size={28} />
							</div>

							<h4>
								{selectedDate
									? 'Этот день пока свободен'
									: 'Пока нет запланированных событий'}
							</h4>

							<p>
								{selectedDate
									? 'В этот день мероприятий пока нет. Выбери другую дату и найди что-нибудь по душе.'
									: 'Загляни чуть позже — здесь появятся новые поводы встретиться.'}
							</p>

							{selectedDate && (
								<button
									className='event-empty__button'
									type='button'
									onClick={handleResetDate}
								>
									Показать все мероприятия
									<ArrowUpRight size={17} />
								</button>
							)}
						</div>
					)}
				</div>
			</section>
		</div>
	)
}
