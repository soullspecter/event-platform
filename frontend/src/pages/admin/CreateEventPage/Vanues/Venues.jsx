import { useMemo, useState } from 'react'
import { MapPin, Plus, Trash2, ChevronDown, X } from 'lucide-react'
import {
	createClientId,
	getEventDates,
	formatTabDate,
} from '../Utils/eventForm.utils'
import './Venues.scss'

function createVenue(date) {
	return {
		clientId: createClientId('venue'),
		venueId: null,
		name: '',
		description: '',
		venueDate: date,
		startTime: '',
		endTime: '',
		location: null,
	}
}

function createManualLocation() {
	return {
		clientId: createClientId('manual-location'),
		name: '',
		place: '',
		address: '',
	}
}

export default function Venues({
	venues = [],
	onChange,
	locations = [],
	errors = [],
	event,
}) {
	const [activeDate, setActiveDate] = useState(event?.startDate || '')
	const [locationPicker, setLocationPicker] = useState(null)
	const [manualFor, setManualFor] = useState(null)
	const [search, setSearch] = useState('')
	const [manualForm, setManualForm] = useState(createManualLocation)

	const dates = useMemo(
		() =>
			getEventDates(
				event?.startDate,
				event?.endDate,
				venues.map(v => v.venueDate).filter(Boolean),
			),
		[event?.startDate, event?.endDate, venues],
	)

	const selectedDate = dates.includes(activeDate) ? activeDate : dates[0] || ''

	const visibleVenues = venues
		.map((venue, index) => ({ venue, index }))
		.filter(({ venue }) => venue.venueDate === selectedDate)

	const filteredLocations = useMemo(() => {
		const query = search.trim().toLowerCase()

		if (!query) return locations

		return locations.filter(location =>
			[location.name, location.place, location.address]
				.filter(Boolean)
				.some(value => String(value).toLowerCase().includes(query)),
		)
	}, [locations, search])

	function updateVenue(clientId, changes) {
		onChange(previous =>
			previous.map(venue => {
				if (venue.clientId !== clientId) return venue

				const nextChanges =
					typeof changes === 'function' ? changes(venue) : changes

				return {
					...venue,
					...nextChanges,
				}
			}),
		)
	}

	function addVenue() {
		if (!selectedDate) {
			window.alert('Сначала укажите дату мероприятия.')
			return
		}

		onChange(previous => [...previous, createVenue(selectedDate)])
	}

	function removeVenue(clientId) {
		onChange(previous => previous.filter(venue => venue.clientId !== clientId))

		if (locationPicker === clientId) {
			setLocationPicker(null)
			setSearch('')
		}

		if (manualFor === clientId) {
			setManualFor(null)
			setManualForm(createManualLocation())
		}
	}

	function getLocationId(location) {
		return location.locationId ?? location.location_id
	}

	function getLocation(locationId) {
		return locations.find(
			location => String(getLocationId(location)) === String(locationId),
		)
	}

	function getLocationLabel(location) {
		return [location?.place, location?.address].filter(Boolean).join(' · ')
	}

	function selectSavedLocation(clientId, locationId) {
		const id = Number(locationId)

		updateVenue(clientId, venue => ({
			location:
				venue.location?.type === 'saved' && venue.location.id === id
					? null
					: { type: 'saved', id },
		}))
	}

	function clearLocation(clientId) {
		updateVenue(clientId, { location: null })
	}

	function toggleLocationPicker(clientId) {
		setManualFor(null)
		setManualForm(createManualLocation())
		setSearch('')

		setLocationPicker(current => (current === clientId ? null : clientId))
	}

	function openManualForm(clientId) {
		setLocationPicker(null)
		setSearch('')
		setManualFor(clientId)
		setManualForm(createManualLocation())
	}

	function updateManualForm(field, value) {
		setManualForm(previous => ({
			...previous,
			[field]: value,
		}))
	}

	function addManualLocation() {
		if (!manualFor || !manualForm.name.trim()) return

		const location = {
			type: 'manual',
			clientId: createClientId('manual-location'),
			name: manualForm.name.trim(),
			place: manualForm.place.trim(),
			address: manualForm.address.trim(),
		}

		updateVenue(manualFor, { location })

		setManualFor(null)
		setManualForm(createManualLocation())
	}

	function changeDate(clientId, date) {
		updateVenue(clientId, { venueDate: date })

		if (date) {
			setActiveDate(date)
		}
	}

	return (
		<section className='venues'>
			{errors.length > 0 && (
				<div className='venues__errors'>
					{errors.map((message, index) => (
						<p key={`${index}-${message}`}>{message}</p>
					))}
				</div>
			)}

			{dates.length === 0 ? (
				<div className='venues__empty'>
					<h3>Сначала укажите даты мероприятия</h3>
				</div>
			) : (
				<>
					<div className='schedule__date-tabs'>
						{dates.map((date, index) => {
							const count = venues.filter(
								venue => venue.venueDate === date,
							).length

							return (
								<button
									type='button'
									key={date}
									className={`schedule__date-tab ${
										selectedDate === date ? 'is-active' : ''
									}`}
									onClick={() => {
										setActiveDate(date)
										setLocationPicker(null)
										setManualFor(null)
										setSearch('')
									}}
								>
									<span className='schedule__date-tab-number'>
										{String(index + 1).padStart(2, '0')}
									</span>

									<span className='schedule__date-tab-content'>
										<strong>{formatTabDate(date)}</strong>
										<small>{count}</small>
									</span>
								</button>
							)
						})}
					</div>

					{venues.length === 0 && (
						<div className='venues__empty'>
							<h3>Пока нет площадок</h3>

							<button
								type='button'
								className='venues__primary-button'
								onClick={addVenue}
							>
								<Plus size={17} />
								Добавить площадку
							</button>
						</div>
					)}

					<div className='venues__list'>
						{visibleVenues.map(({ venue, index }) => {
							const clientId = venue.clientId

							const savedLocation =
								venue.location?.type === 'saved'
									? getLocation(venue.location.id)
									: null

							const manualLocation =
								venue.location?.type === 'manual' ? venue.location : null

							const hasLocation = Boolean(savedLocation || manualLocation)

							const isPickerOpen = locationPicker === clientId
							const isManualOpen = manualFor === clientId

							return (
								<article className='venues__card' key={clientId}>
									<header className='venues__card-header'>
										<div className='venues__card-title'>
											<span className='venues__index'>
												{String(index + 1).padStart(2, '0')}
											</span>
										</div>

										<button
											type='button'
											className='venues__icon-button venues__icon-button--danger'
											aria-label='Удалить площадку'
											title='Удалить площадку'
											onClick={() => removeVenue(clientId)}
										>
											<Trash2 size={17} />
										</button>
									</header>

									<div className='venues__fields'>
										<div className='venues__field'>
											<label>Название площадки</label>
											<input
												type='text'
												maxLength={255}
												value={venue.name}
												onChange={e =>
													updateVenue(clientId, {
														name: e.target.value,
													})
												}
												placeholder='Например, Главная сцена'
											/>
										</div>

										<div className='venues__field'>
											<label>Описание</label>
											<textarea
												rows={3}
												value={venue.description}
												onChange={e =>
													updateVenue(clientId, {
														description: e.target.value,
													})
												}
												placeholder='Что будет проходить на площадке'
											/>
										</div>
									</div>

									<div className='venues__locations-section'>
										<div className='venues__subheading'>
											<div>
												<h4>Локация</h4>
											</div>
										</div>

										{hasLocation && (
											<div className='venues__selected'>
												{savedLocation && (
													<div className='venues__selected-location'>
														<MapPin size={16} />

														<span>
															<strong>
																{savedLocation.name || 'Без названия'}
															</strong>

															{getLocationLabel(savedLocation) && (
																<small>{getLocationLabel(savedLocation)}</small>
															)}
														</span>

														<button
															type='button'
															aria-label='Убрать локацию'
															onClick={() => clearLocation(clientId)}
														>
															<X size={15} />
														</button>
													</div>
												)}

												{manualLocation && (
													<div className='venues__selected-location venues__selected-location--manual'>
														<MapPin size={16} />

														<span>
															<strong>{manualLocation.name}</strong>
															<small>
																{[manualLocation.place, manualLocation.address]
																	.filter(Boolean)
																	.join(' · ') || 'Новая локация'}
															</small>
														</span>

														<button
															type='button'
															aria-label='Убрать локацию'
															onClick={() => clearLocation(clientId)}
														>
															<X size={15} />
														</button>
													</div>
												)}
											</div>
										)}

										{!hasLocation && (
											<div className='venues__location-actions'>
												<button
													type='button'
													className='venues__secondary-button'
													onClick={() => toggleLocationPicker(clientId)}
												>
													<MapPin size={16} />
													Выбрать из базы
													<ChevronDown
														size={15}
														className={isPickerOpen ? 'is-rotated' : ''}
													/>
												</button>

												<button
													type='button'
													className='venues__secondary-button'
													onClick={() => openManualForm(clientId)}
												>
													<Plus size={16} />
													Ввести вручную
												</button>
											</div>
										)}

										{isPickerOpen && (
											<div className='venues__location-picker'>
												<input
													type='search'
													value={search}
													onChange={e => setSearch(e.target.value)}
													placeholder='Поиск по названию, месту или адресу…'
												/>

												<div className='venues__location-options'>
													{filteredLocations.length === 0 ? (
														<p className='venues__no-results'>
															Локации не найдены.
														</p>
													) : (
														filteredLocations.map(location => {
															const id = getLocationId(location)

															const checked =
																venue.location?.type === 'saved' &&
																venue.location.id === Number(id)

															return (
																<label
																	className='venues__location-option'
																	key={id}
																>
																	<input
																		type='radio'
																		name={`location-${clientId}`}
																		checked={checked}
																		onChange={() =>
																			selectSavedLocation(clientId, id)
																		}
																	/>

																	<span>
																		<strong>
																			{location.name || 'Без названия'}
																		</strong>

																		<small>
																			{getLocationLabel(location) ||
																				'Адрес не указан'}
																		</small>
																	</span>
																</label>
															)
														})
													)}
												</div>
											</div>
										)}

										{isManualOpen && (
											<div className='venues__manual-form'>
												<div className='venues__manual-heading'>
													<div>
														<h5>Новая физическая локация</h5>
														<p>
															Она будет добавлена в базу при сохранении
															мероприятия.
														</p>
													</div>

													<button
														type='button'
														aria-label='Закрыть форму'
														onClick={() => setManualFor(null)}
													>
														<X size={17} />
													</button>
												</div>

												<div className='venues__field'>
													<label>Название</label>
													<input
														value={manualForm.name}
														maxLength={255}
														onChange={e =>
															updateManualForm('name', e.target.value)
														}
														placeholder='Например, Конференц-зал А'
													/>
												</div>

												<div className='venues__field'>
													<label>Место</label>
													<input
														value={manualForm.place}
														onChange={e =>
															updateManualForm('place', e.target.value)
														}
														placeholder='Например, Москва'
													/>
												</div>

												<div className='venues__field'>
													<label>Адрес</label>
													<textarea
														rows={2}
														value={manualForm.address}
														onChange={e =>
															updateManualForm('address', e.target.value)
														}
														placeholder='Улица, дом, корпус'
													/>
												</div>

												<button
													type='button'
													className='venues__primary-button'
													disabled={!manualForm.name.trim()}
													onClick={addManualLocation}
												>
													<Plus size={16} />
													Добавить локацию
												</button>
											</div>
										)}
									</div>

									<div className='venues__subheading'>
										<h4>Дата и время</h4>
									</div>

									<div className='venues__time-grid'>
										<div className='venues__field'>
											<label>Дата площадки</label>
											<input
												type='date'
												value={venue.venueDate || ''}
												onChange={e => changeDate(clientId, e.target.value)}
											/>
										</div>

										<div className='venues__field'>
											<label>Начало</label>
											<input
												type='time'
												value={venue.startTime || ''}
												onChange={e =>
													updateVenue(clientId, {
														startTime: e.target.value,
													})
												}
											/>
										</div>

										<div className='venues__field'>
											<label>Окончание</label>
											<input
												type='time'
												min={venue.startTime || undefined}
												value={venue.endTime || ''}
												onChange={e =>
													updateVenue(clientId, {
														endTime: e.target.value,
													})
												}
											/>
										</div>
									</div>
								</article>
							)
						})}
					</div>

					{venues.length > 0 && (
						<button
							type='button'
							className='venues__add-another'
							onClick={addVenue}
						>
							<Plus size={18} />
							Добавить ещё одну площадку
						</button>
					)}
				</>
			)}
		</section>
	)
}
