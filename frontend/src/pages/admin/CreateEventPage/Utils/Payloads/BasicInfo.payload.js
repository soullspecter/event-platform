import { toTrimmedOrNull } from '../eventForm.utils';

export function buildBasicInfoPayload(event) {
    return {
        title: toTrimmedOrNull(event.title) ?? undefined,
        description: toTrimmedOrNull(event.description) ?? undefined,
        startDate: event.startDate || undefined,
        endDate: event.endDate || undefined,
    };
}
