import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
	createClientId,
	getEventDates,
	isEndTimeAfterStart,
	formatDate,
	formatTabDate,
	pluralizeItems,
} from '../Utils/eventForm.utils'
import './Schedule.scss'

function createItem(date) {
	return {
		clientId: createClientId('schedule'),
		scheduleItemId: null,
		description: '',
		itemDate: date,
		startTime: '',
		endTime: '',
	}
}

// Payload, который формирует только Schedule

export default function Schedule({ event, items = [], onChange }) {
	const dates = useMemo(
		() =>
			getEventDates(
				event.startDate,
				event.endDate,
				items.map(item => item.itemDate).filter(Boolean),
			),
		[event.startDate, event.endDate, items],
	)

	const [activeDate, setActiveDate] = useState('')

	// derived: если выбранная дата больше не существует — берём первую доступную.
	const selectedDate = dates.includes(activeDate) ? activeDate : dates[0] || ''

	// «Adjusting state when props change»: правим состояние прямо в рендере,
	// без useEffect. React сам перезапустит рендер до коммита — без каскада.
	if (selectedDate !== activeDate) {
		setActiveDate(selectedDate)
	}

	const visibleItems = useMemo(
		() => items.filter(item => item.itemDate === selectedDate),
		[items, selectedDate],
	)

	function updateItem(clientId, changes) {
		onChange(previous =>
			previous.map(item =>
				item.clientId === clientId ? { ...item, ...changes } : item,
			),
		)

		if (changes.itemDate && changes.itemDate !== selectedDate) {
			setActiveDate(changes.itemDate)
		}
	}

	function addItem() {
		if (!selectedDate) return

		onChange(previous => [...previous, createItem(selectedDate)])
	}

	function removeItem(clientId) {
		onChange(previous => previous.filter(item => item.clientId !== clientId))
	}

	return (
		<section className='schedule'>
			{dates.length === 0 ? (
				<div className='schedule__empty'>
					<h3>Сначала укажите даты мероприятия</h3>
				</div>
			) : (
				<>
					<div className='schedule__date-tabs'>
						{dates.map((date, index) => {
							const count = items.filter(item => item.itemDate === date).length

							return (
								<button
									type='button'
									key={date}
									className={`schedule__date-tab ${
										selectedDate === date ? 'is-active' : ''
									}`}
									onClick={() => setActiveDate(date)}
								>
									<span className='schedule__date-tab-number'>
										{String(index + 1).padStart(2, '0')}
									</span>

									<span className='schedule__date-tab-content'>
										<strong>{formatTabDate(date)}</strong>
										<small>
											{count} {pluralizeItems(count)}
										</small>
									</span>
								</button>
							)
						})}
					</div>

					<section className='schedule__day'>
						<header className='schedule__day-header'>
							<div className='schedule__day-title'>
								<h4>{formatDate(selectedDate)}</h4>
							</div>
						</header>

						{visibleItems.length === 0 ? (
							<div className='schedule__day-empty'>
								На эту дату пока ничего не запланировано.
							</div>
						) : (
							<div className='schedule__items'>
								{visibleItems.map(item => {
									const timeError = !isEndTimeAfterStart(
										item.startTime,
										item.endTime,
									)

									return (
										<article className='schedule__item' key={item.clientId}>
											<div className='schedule__item-content'>
												<div className='schedule__item-top'>
													<button
														type='button'
														className='schedule__remove'
														aria-label='Удалить пункт'
														onClick={() => removeItem(item.clientId)}
													>
														<Trash2 size={15} />
													</button>
												</div>

												<div className='schedule__field'>
													<label>Описание пункта</label>
													<textarea
														rows={3}
														value={item.description ?? ''}
														onChange={e =>
															updateItem(item.clientId, {
																description: e.target.value,
															})
														}
														placeholder='Введите пункт расписания'
													/>
												</div>

												<div className='schedule__item-fields'>
													<div className='schedule__field'>
														<label>Дата</label>
														<input
															type='date'
															min={event.startDate || undefined}
															max={event.endDate || undefined}
															value={item.itemDate || ''}
															onChange={e =>
																updateItem(item.clientId, {
																	itemDate: e.target.value,
																})
															}
														/>
													</div>

													<div className='schedule__field'>
														<label>Начало</label>
														<input
															type='time'
															value={item.startTime || ''}
															onChange={e =>
																updateItem(item.clientId, {
																	startTime: e.target.value,
																})
															}
														/>
													</div>

													<div className='schedule__field'>
														<label>Окончание</label>
														<input
															type='time'
															min={item.startTime || undefined}
															value={item.endTime || ''}
															onChange={e =>
																updateItem(item.clientId, {
																	endTime: e.target.value,
																})
															}
														/>
													</div>
												</div>

												{timeError && (
													<p className='schedule__field-error'>
														Время окончания должно быть позже времени начала.
													</p>
												)}
											</div>
										</article>
									)
								})}
							</div>
						)}
					</section>

					<button
						type='button'
						className='schedule__add-another'
						onClick={addItem}
					>
						<Plus size={18} />
						Добавить пункт программы
					</button>
				</>
			)}
		</section>
	)
}
