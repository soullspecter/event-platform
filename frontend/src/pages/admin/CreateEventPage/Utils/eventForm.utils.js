let itemCounter = 0

export function createClientId(prefix = 'item') {
	return `${prefix}-${Date.now()}-${++itemCounter}`
}

export function dateOnly(value) {
	return value ? String(value).slice(0, 10) : ''
}

export function timeOnly(value) {
	return value ? String(value).slice(0, 5) : ''
}

export function toTrimmedOrNull(value) {
	if (value === undefined || value === null) return null
	const trimmed = String(value).trim()
	return trimmed || null
}

export function timeToSeconds(time) {
	if (!time) return 0
	const [h, m, s = '0'] = String(time).split(':')
	return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

export function isEndTimeAfterStart(start, end) {
	if (!start || !end) return true
	return timeToSeconds(end) > timeToSeconds(start)
}

export function isDateWithinRange(date, start, end) {
	if (!date) return true
	if (start && date < start) return false
	if (end && date > end) return false
	return true
}

export function getEventDates(startDate, endDate, extraDates = []) {
	const dates = new Set()

	if (startDate && endDate) {
		const [sy, sm, sd] = startDate.split('-').map(Number)
		const [ey, em, ed] = endDate.split('-').map(Number)
		const start = Date.UTC(sy, sm - 1, sd)
		const end = Date.UTC(ey, em - 1, ed)

		if (start <= end) {
			for (let cur = start; cur <= end; cur += 86400000) {
				dates.add(new Date(cur).toISOString().slice(0, 10))
			}
		}
	} else {
		if (startDate) dates.add(startDate)
		if (endDate) dates.add(endDate)
	}

	extraDates.forEach(d => d && dates.add(d))

	return [...dates].sort()
}

export function formatDate(value) {
	if (!value) return ''
	return new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	})
}

export function formatTabDate(value) {
	if (!value) return ''
	return new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'short',
	})
}

export function pluralizeItems(count) {
	const mod10 = count % 10
	const mod100 = count % 100
	if (mod10 === 1 && mod100 !== 11) return 'пункт'
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пункта'
	return 'пунктов'
}

// Нормализация данных с сервера — общая для всех форм
export function getArray(data, key) {
	if (Array.isArray(data)) return data
	if (Array.isArray(data?.[key])) return data[key]
	if (Array.isArray(data?.data?.[key])) return data.data[key]
	if (Array.isArray(data?.event?.[key])) return data.event[key]
	return []
}

export function getEventId(data) {
	return (
		data?.eventId ??
		data?.event_id ??
		data?.event?.eventId ??
		data?.event?.event_id ??
		data?.data?.eventId ??
		data?.data?.event_id ??
		data?.data?.event?.eventId ??
		data?.data?.event?.event_id ??
		data?.id ??
		null
	)
}

export function normalizeEvent(data) {
	const source = data?.event ?? data?.data?.event ?? data?.data ?? data

	return {
		title: source?.title ?? '',
		description: source?.description ?? '',
		startDate: dateOnly(source?.startDate ?? source?.start_date),
		endDate: dateOnly(source?.endDate ?? source?.end_date),
		status: source?.status ?? 'draft',
	}
}

export function normalizeVenue(item) {
	const linkedLocations = item?.locations ?? []
	const venueId = item?.venueId ?? item?.venue_id ?? null

	return {
		clientId: venueId ? `saved-venue-${venueId}` : createClientId('venue'),
		venueId,
		name: item?.name ?? '',
		description: item?.description ?? '',
		venueDate: dateOnly(item?.venueDate ?? item?.venue_date),
		startTime: timeOnly(item?.startTime ?? item?.start_time),
		endTime: timeOnly(item?.endTime ?? item?.end_time),
		locationIds: linkedLocations
			.map(
				location =>
					location?.locationId ??
					location?.location_id ??
					location?.location?.locationId ??
					location?.location?.location_id,
			)
			.filter(id => id != null)
			.map(Number),
		manualLocations: [],
	}
}

export function normalizeScheduleItem(item) {
	const scheduleItemId = item?.scheduleItemId ?? item?.schedule_item_id ?? null

	return {
		clientId: scheduleItemId
			? `saved-schedule-${scheduleItemId}`
			: createClientId('schedule'),
		scheduleItemId,
		description: item?.description ?? '',
		itemDate: dateOnly(item?.itemDate ?? item?.item_date),
		startTime: timeOnly(item?.startTime ?? item?.start_time),
		endTime: timeOnly(item?.endTime ?? item?.end_time),
	}
}
