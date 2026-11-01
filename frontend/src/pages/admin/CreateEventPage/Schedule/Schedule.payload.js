import { toTrimmedOrNull } from '../Utils/eventForm.utils'

export function buildSchedulePayload(items) {
	return items
		.filter(
			item =>
				item.description?.trim() ||
				item.startTime ||
				item.endTime ||
				item.itemDate,
		)
		.map(item => ({
			scheduleItemId: item.scheduleItemId ?? undefined,
			description: toTrimmedOrNull(item.description),
			itemDate: item.itemDate || null,
			startTime: item.startTime || null,
			endTime: item.endTime || null,
		}))
}
