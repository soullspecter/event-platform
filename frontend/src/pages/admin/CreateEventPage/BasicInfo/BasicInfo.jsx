import './BasicInfo.scss'

export default function BasicInfo({ event, onChange }) {
	function update(field, value) {
		onChange(previous => ({
			...previous,
			[field]: value,
		}))
	}

	return (
		<div className='basic-info'>
			<div className='basic-info__field'>
				<label htmlFor='event-title'>
					Название мероприятия <span>*</span>
				</label>

				<input
					id='event-title'
					type='text'
					maxLength={255}
					value={event.title ?? ''}
					onChange={e => update('title', e.target.value)}
					placeholder='Например, Digital Future 2026'
				/>
			</div>

			<div className='basic-info__field'>
				<label htmlFor='event-description'>Описание</label>

				<textarea
					id='event-description'
					rows={6}
					value={event.description ?? ''}
					onChange={e => update('description', e.target.value)}
					placeholder='Расскажите, чему посвящено мероприятие, для кого оно и что ждёт участников…'
				/>
			</div>

			<div className='basic-info__dates-heading'>
				<h3>Даты проведения</h3>
			</div>

			<div className='basic-info__dates'>
				<div className='basic-info__field'>
					<label htmlFor='event-start-date'>
						Дата начала <span>*</span>
					</label>

					<input
						id='event-start-date'
						type='date'
						value={event.startDate ?? ''}
						max={event.endDate || undefined}
						onChange={e => update('startDate', e.target.value)}
					/>
				</div>

				<div className='basic-info__field'>
					<label htmlFor='event-end-date'>
						Дата окончания <span>*</span>
					</label>

					<input
						id='event-end-date'
						type='date'
						value={event.endDate ?? ''}
						min={event.startDate || undefined}
						onChange={e => update('endDate', e.target.value)}
					/>
				</div>
			</div>
		</div>
	)
}
