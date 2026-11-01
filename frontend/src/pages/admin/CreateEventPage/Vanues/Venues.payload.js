import { toTrimmedOrNull } from '../Utils/eventForm.utils'

export function buildVenuesPayload(venues) {
	return venues.map(venue => {
		const savedId =
			venue.location?.type === 'saved' ? Number(venue.location.id) : null

		const manual = venue.location?.type === 'manual' ? venue.location : null

		return {
			venueId: venue.venueId ?? undefined,
			name: toTrimmedOrNull(venue.name),
			description: toTrimmedOrNull(venue.description),
			venueDate: venue.venueDate || null,
			startTime: venue.startTime || null,
			endTime: venue.endTime || null,
			locationIds: savedId != null ? [savedId] : [],
			manualLocations: manual
				? [
						{
							name: toTrimmedOrNull(manual.name),
							place: toTrimmedOrNull(manual.place),
							address: toTrimmedOrNull(manual.address),
						},
					]
				: [],
		}
	})
}
