import { useEffect, useMemo, useState } from 'react'
import { Clock, MapPin, Sparkles } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { eventsApi } from '../../shared/api/eventsApi.js'
import './EventPage.scss'

function parseDate(value) {
	if (!value) return null

	const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)

	if (!year || !month || !day) return null

	const date = new Date(year, month - 1, day)

	return Number.isNaN(date.getTime()) ? null : date
}

function formatDayLong(value) {
	const date = parseDate(value)
	if (!date) return ''

	return new Intl.DateTimeFormat('ru-RU', {
		day: 'numeric',
		month: 'long',
	}).format(date)
}

function formatWeekday(value) {
	const date = parseDate(value)
	if (!date) return ''

	return new Intl.DateTimeFormat('ru-RU', {
		weekday: 'long',
	}).format(date)
}

function formatTime(value) {
	return value ? String(value).slice(0, 5) : ''
}

function formatTimeRange(start, end) {
	const from = formatTime(start)
	const to = formatTime(end)

	if (from && to) return `${from} — ${to}`
	return from || to
}

function getLocationLabel(location) {
	return [location.name, location.place, location.address]
		.filter(value => value && String(value).trim())
		.join(', ')
}

function sortByStartTime(items) {
	return [...items].sort((a, b) => {
		const timeA = String(a.startTime || '')
		const timeB = String(b.startTime || '')

		if (timeA !== timeB) return timeA.localeCompare(timeB)

		return 0
	})
}

function groupByDay(venues, schedule) {
	const days = new Map()

	function ensureDay(date) {
		if (!days.has(date)) {
			days.set(date, { date, venues: [], schedule: [] })
		}

		return days.get(date)
	}

	venues.forEach(venue => {
		ensureDay(venue.venueDate || 'unknown').venues.push(venue)
	})

	schedule.forEach(item => {
		ensureDay(item.itemDate || 'unknown').schedule.push(item)
	})

	return [...days.values()]
		.map(day => ({
			...day,
			venues: sortByStartTime(day.venues),
			schedule: sortByStartTime(day.schedule),
		}))
		.sort((a, b) => {
			if (a.date === 'unknown') return 1
			if (b.date === 'unknown') return -1
			return a.date.localeCompare(b.date)
		})
}

export default function EventPage() {
	const { id } = useParams()

	const [event, setEvent] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [activeDay, setActiveDay] = useState(0)

	// Сброс активного дня при смене мероприятия — без setState в эффекте
	const [prevId, setPrevId] = useState(id)
	if (id !== prevId) {
		setPrevId(id)
		setActiveDay(0)
	}

	useEffect(() => {
		let active = true

		async function loadEvent() {
			setLoading(true)
			setError('')
			setEvent(null)

			try {
				const data = await eventsApi.getPublishedById(id)

				if (!active) return

				setEvent(data)
			} catch (err) {
				if (!active) return

				setError(err.message || 'Не удалось загрузить мероприятие.')
			} finally {
				if (active) setLoading(false)
			}
		}

		loadEvent()

		return () => {
			active = false
		}
	}, [id])

	useEffect(() => {
		if (!event?.title) {
			document.title = 'Мероприятие'
			return
		}

		document.title = `${event.title} — Место`

		return () => {
			document.title = 'Место'
		}
	}, [event])

	const days = useMemo(() => {
		if (!event) return []

		return groupByDay(
			Array.isArray(event.venues) ? event.venues : [],
			Array.isArray(event.schedule) ? event.schedule : [],
		)
	}, [event])

	const safeActiveDay =
		days.length > 0 ? Math.min(activeDay, days.length - 1) : 0
	const currentDay = days[safeActiveDay] || null

	if (loading) {
		return (
			<main className='public-event'>
				<div className='public-event__state' role='status' aria-live='polite'>
					<span className='public-event__spinner' />
					Загружаем мероприятие...
				</div>
			</main>
		)
	}

	if (error || !event) {
		return (
			<main className='public-event'>
				<div className='public-event__state'>
					<div className='public-event__state-icon'>
						<Sparkles size={28} />
					</div>
					<h1>Мероприятие не найдено</h1>
					<p>
						{error ||
							'Возможно, мероприятие ещё не опубликовано или было удалено.'}
					</p>
				</div>
			</main>
		)
	}

	return (
		<main className='public-event'>
			<header className='public-event__hero'>
				<h1>{event.title || 'Без названия'}</h1>

				{event.description && <p>{event.description}</p>}
			</header>

			{days.length > 0 && (
				<section className='public-event__section'>
					{days.length > 1 && (
						<div className='public-event__days-tabs' role='tablist'>
							{days.map((day, index) => (
								<button
									key={day.date}
									type='button'
									role='tab'
									aria-selected={safeActiveDay === index}
									className={`public-event__day-tab${
										safeActiveDay === index
											? ' public-event__day-tab--active'
											: ''
									}`}
									onClick={() => setActiveDay(index)}
								>
									<span className='public-event__day-tab-info'>
										<span className='public-event__day-tab-date'>
											{formatDayLong(day.date)}
										</span>
										<span className='public-event__day-tab-weekday'>
											{formatWeekday(day.date)}
										</span>
									</span>
								</button>
							))}
						</div>
					)}

					{currentDay && (
						<div className='public-event__day-content'>
							{days.length === 1 && (
								<div className='public-event__day-heading'>
									<div className='public-event__day-chip'>
										<span className='public-event__day-chip-day'>
											{formatDayLong(currentDay.date)}
										</span>
										<span className='public-event__day-chip-weekday'>
											{formatWeekday(currentDay.date)}
										</span>
									</div>
								</div>
							)}

							{currentDay.schedule.length > 0 && (
								<div className='public-event__group'>
									<span className='public-event__group-label'>Расписание</span>

									<div className='public-event__schedule-list'>
										{currentDay.schedule.map(item => {
											const timeStr = formatTimeRange(
												item.startTime,
												item.endTime,
											)

											return (
												<article
													className='public-event__schedule-item'
													key={`schedule-${item.scheduleItemId}`}
												>
													{timeStr && (
														<div className='public-event__schedule-time'>
															<Clock size={15} />
															{timeStr}
														</div>
													)}
													<div className='public-event__schedule-text'>
														{item.description || 'Пункт программы'}
													</div>
												</article>
											)
										})}
									</div>
								</div>
							)}

							{currentDay.venues.length > 0 && (
								<div className='public-event__group'>
									<span className='public-event__group-label'>Площадки</span>

									<div className='public-event__cards public-event__cards--venues'>
										{currentDay.venues.map(venue => {
											const locations = Array.isArray(venue.locations)
												? venue.locations
												: []
											const timeStr = formatTimeRange(
												venue.startTime,
												venue.endTime,
											)

											return (
												<article
													className='public-event__card public-event__card--venue'
													key={`venue-${venue.venueId}`}
												>
													<div className='public-event__card-header'>
														<div className='public-event__card-icon'>
															<MapPin size={16} />
														</div>
														{timeStr && (
															<div className='public-event__card-time'>
																<Clock size={14} />
																{timeStr}
															</div>
														)}
													</div>

													<h3>{venue.name || 'Площадка'}</h3>

													{venue.description && <p>{venue.description}</p>}

													{locations.length > 0 && (
														<div className='public-event__locations'>
															{locations.map(location => {
																const label = getLocationLabel(location)
																if (!label) return null

																return (
																	<div key={location.locationId}>
																		<MapPin size={14} />
																		<span>{label}</span>
																	</div>
																)
															})}
														</div>
													)}
												</article>
											)
										})}
									</div>
								</div>
							)}
						</div>
					)}
				</section>
			)}

			{days.length === 0 && (
				<section className='public-event__empty'>
					<div className='public-event__state-icon'>
						<Sparkles size={28} />
					</div>
					<h2>Программа ещё формируется</h2>
					<p>Загляни чуть позже — площадки и расписание скоро появятся.</p>
				</section>
			)}
		</main>
	)
}
