import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, ChevronRight, Save, Send } from 'lucide-react'

import { eventsApi } from '../../../../shared/api/eventsApi'

import BasicInfo from '../BasicInfo/BasicInfo'
import { buildBasicInfoPayload } from '../BasicInfo/BasicInfo.payload'

import Venues from '../Vanues/Venues'
import { buildVenuesPayload } from '../Vanues/Venues.payload'

import Schedule from '../Schedule/Schedule'
import { buildSchedulePayload } from '../Schedule/Schedule.payload'

import {
	getArray,
	getEventId,
	normalizeEvent,
	normalizeVenue,
	normalizeScheduleItem,
} from '../Utils/eventForm.utils'

import './Layout.scss'

function buildPayload(event, venues, schedule) {
	return {
		...buildBasicInfoPayload(event),
		venues: buildVenuesPayload(venues),
		schedule: buildSchedulePayload(schedule),
	}
}

const EMPTY_EVENT = {
	title: '',
	description: '',
	startDate: '',
	endDate: '',
	status: 'draft',
}

const TABS = [
	{ id: 'info', label: 'Общая информация', number: '01' },
	{ id: 'venues', label: 'Площадки', number: '02' },
	{ id: 'schedule', label: 'Расписание', number: '03' },
]

export default function Layout({ eventId: propEventId }) {
	const params = useParams()
	const routeEventId = propEventId ?? params.eventId ?? params.id ?? null

	const [currentEventId, setCurrentEventId] = useState(routeEventId)
	const [activeTab, setActiveTab] = useState('info')

	const [event, setEvent] = useState(EMPTY_EVENT)
	const [venues, setVenues] = useState([])
	const [schedule, setSchedule] = useState([])
	const [locations, setLocations] = useState([])

	const [loading, setLoading] = useState(Boolean(routeEventId))
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')

	useEffect(() => {
		let active = true

		async function load() {
			setError('')
			setNotice('')
			setCurrentEventId(routeEventId)
			setEvent(EMPTY_EVENT)
			setVenues([])
			setSchedule([])
			setLoading(true)

			try {
				const locationData = await eventsApi.getLocations()

				if (!active) return

				const loadedLocations =
					getArray(locationData, 'items').length > 0
						? getArray(locationData, 'items')
						: getArray(locationData, 'locations').length > 0
							? getArray(locationData, 'locations')
							: Array.isArray(locationData)
								? locationData
								: []

				setLocations(loadedLocations)

				if (!routeEventId) return

				const response = await eventsApi.getForManagement(routeEventId)

				if (!active) return

				const data =
					response?.event ?? response?.data?.event ?? response?.data ?? response

				setEvent(normalizeEvent(data))
				setVenues(getArray(data, 'venues').map(normalizeVenue))
				setSchedule(getArray(data, 'schedule').map(normalizeScheduleItem))
			} catch (err) {
				if (active) {
					setError(err.message || 'Не удалось загрузить мероприятие')
				}
			} finally {
				if (active) setLoading(false)
			}
		}

		load()

		return () => {
			active = false
		}
	}, [routeEventId])

	async function handleSave(publish = false) {
		if (saving) return

		setError('')
		setNotice('')
		setSaving(true)

		try {
			const payload = buildPayload(event, venues, schedule)

			const response = currentEventId
				? await eventsApi.updateDraft(currentEventId, payload)
				: await eventsApi.createDraft(payload)

			const savedId = getEventId(response) ?? currentEventId

			if (!savedId) {
				throw new Error('Сервер не вернул идентификатор мероприятия.')
			}

			setCurrentEventId(savedId)

			if (publish) {
				await eventsApi.publishEvent(savedId)

				setEvent(previous => ({
					...previous,
					status: 'published',
				}))

				setNotice('Мероприятие успешно опубликовано.')
			} else {
				setNotice('Мероприятие успешно сохранено.')
			}
		} catch (err) {
			setError(err.message || 'Не удалось сохранить мероприятие.')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className='event-editor__loading'>
				<span className='event-editor__spinner' />
				Загружаем мероприятие…
			</div>
		)
	}

	return (
		<main className='event-editor'>
			<div className='event-editor__top'>
				<div className='event-editor__heading'>
					<h1>
						{currentEventId
							? 'Редактирование мероприятия'
							: 'Создание мероприятия'}
					</h1>
				</div>
			</div>

			{error && (
				<div className='event-editor__alert event-editor__alert--error'>
					{error}
				</div>
			)}

			{notice && (
				<div className='event-editor__alert event-editor__alert--success'>
					<Check size={18} />
					{notice}
				</div>
			)}

			<div className='event-editor__workspace'>
				<nav className='event-editor__tabs' aria-label='Разделы мероприятия'>
					{TABS.map(tab => {
						const isActive = activeTab === tab.id

						const isComplete =
							(tab.id === 'info' &&
								event.title.trim() &&
								event.startDate &&
								event.endDate) ||
							(tab.id === 'venues' && venues.length > 0) ||
							(tab.id === 'schedule' && schedule.length > 0)

						return (
							<button
								type='button'
								key={tab.id}
								className={[
									'event-editor__tab',
									isActive && 'is-active',
									isComplete && 'is-complete',
								]
									.filter(Boolean)
									.join(' ')}
								onClick={() => setActiveTab(tab.id)}
							>
								<span className='event-editor__tab-number'>
									{isComplete && !isActive ? <Check size={15} /> : tab.number}
								</span>

								<span className='event-editor__tab-label'>{tab.label}</span>

								<ChevronRight className='event-editor__tab-chevron' size={18} />
							</button>
						)
					})}
				</nav>

				<section className='event-editor__panel'>
					{activeTab === 'info' && (
						<div className='event-editor__tab-content'>
							<div className='event-editor__section-heading'>
								<div className='event-editor__section-icon'>
									<span>✦</span>
								</div>
								<div>
									<h2>Общая информация</h2>
									<p>Основные сведения о вашем мероприятии.</p>
								</div>
							</div>

							<BasicInfo event={event} onChange={setEvent} />
						</div>
					)}

					{activeTab === 'venues' && (
						<div className='event-editor__tab-content'>
							<div className='event-editor__section-heading'>
								<div className='event-editor__section-icon event-editor__section-icon--pink'>
									<span>⌖</span>
								</div>
								<div>
									<h2>Площадки</h2>
								</div>
							</div>

							<Venues
								venues={venues}
								onChange={setVenues}
								locations={locations}
								event={event}
							/>
						</div>
					)}

					{activeTab === 'schedule' && (
						<div className='event-editor__tab-content'>
							<div className='event-editor__section-heading'>
								<div className='event-editor__section-icon event-editor__section-icon--blue'>
									<span>◷</span>
								</div>
								<div>
									<h2>Расписание</h2>
								</div>
							</div>

							<Schedule event={event} items={schedule} onChange={setSchedule} />
						</div>
					)}
				</section>
			</div>

			<footer className='event-editor__bottom-bar'>
				<div className='event-editor__bottom-actions'>
					<button
						type='button'
						className='event-editor__save'
						disabled={saving}
						onClick={() => handleSave(false)}
					>
						<Save size={17} />
						{saving ? 'Сохранение…' : 'Сохранить черновик'}
					</button>

					<button
						type='button'
						className='event-editor__publish'
						disabled={saving || event.status === 'published'}
						onClick={() => handleSave(true)}
					>
						<Send size={17} />
						{saving
							? 'Обработка…'
							: event.status === 'published'
								? 'Уже опубликовано'
								: 'Опубликовать'}
					</button>
				</div>
			</footer>
		</main>
	)
}
