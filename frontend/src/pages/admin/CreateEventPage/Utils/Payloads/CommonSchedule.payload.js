import { toTrimmedOrNull } from '../eventForm.utils';

function buildLocationPayload(item) {
    if (item.locationPlaceId) {
        return { locationPlaceId: Number(item.locationPlaceId) };
    }

    const manual = item.manualLocation;
    if (!manual) return null;

    return {
        name: toTrimmedOrNull(manual.name),
        address: toTrimmedOrNull(manual.address),
        place: toTrimmedOrNull(manual.place),
    };
}

export function buildCommonSchedulePayload(commonSchedule = []) {
    return commonSchedule.map((item) => ({
        ...(item.commonItemId ? { commonItemId: Number(item.commonItemId) } : {}),
        name: toTrimmedOrNull(item.name),
        itemDate: item.itemDate || null,
        startTime: item.startTime || null,
        endTime: item.endTime || null,
        location: buildLocationPayload(item),
    }));
}