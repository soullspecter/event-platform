import { toTrimmedOrNull } from '../Utils/eventForm.utils'

// Payload, который формирует только BasicInfo
export function buildBasicInfoPayload(event) {
	return {
		title: toTrimmedOrNull(event.title),
		description: toTrimmedOrNull(event.description),
		startDate: event.startDate || null,
		endDate: event.endDate || null,
	}
}
