let itemCounter = 0;

export function createClientId(prefix = 'item') {
    return `${prefix}-${Date.now()}-${++itemCounter}`;
}

export function dateOnly(value) {
    return value ? String(value).slice(0, 10) : '';
}

export function timeOnly(value) {
    return value ? String(value).slice(0, 5) : '';
}

export function toTrimmedOrNull(value) {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed || null;
}

export function resolveArray(data, ...keys) {
    if (Array.isArray(data)) return data;
    const sources = [data, data?.data, data?.event];
    for (const source of sources) {
        if (!source) continue;
        for (const key of keys) {
            if (Array.isArray(source[key])) return source[key];
        }
    }
    return [];
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
    );
}

export function normalizeEvent(data) {
    const source = data?.event ?? data?.data?.event ?? data?.data ?? data;
    return {
        title: source?.title ?? '',
        description: source?.description ?? '',
        startDate: dateOnly(source?.startDate ?? source?.start_date),
        endDate: dateOnly(source?.endDate ?? source?.end_date),
        status: source?.status ?? 'draft',
    };
}

export function normalizeScheduleItem(item) {
    const scheduleItemId = item?.scheduleItemId ?? item?.schedule_item_id ?? null;
    return {
        clientId: scheduleItemId ? `saved-schedule-${scheduleItemId}` : createClientId('schedule'),
        scheduleItemId,
        name: item?.name ?? '',
        itemDate: dateOnly(item?.itemDate ?? item?.item_date),
        startTime: timeOnly(item?.startTime ?? item?.start_time),
        endTime: timeOnly(item?.endTime ?? item?.end_time),
    };
}

export function normalizePrograms(rawPrograms, schedule = []) {
    if (!Array.isArray(rawPrograms)) return [];
    if (!Array.isArray(schedule)) schedule = [];

    return rawPrograms.map((rawProgram) => {
        const rawId = rawProgram?.scheduleItemId ?? rawProgram?.schedule_item_id ?? null;
        const scheduleItemId = rawId != null && Number.isFinite(Number(rawId)) ? Number(rawId) : null;
        const linkedSchedule = scheduleItemId != null ? schedule.find((item) => Number(item.scheduleItemId) === scheduleItemId) : null;

        const locPlace = rawProgram?.locationPlace ?? null;
        const locId = locPlace ? (locPlace.locationPlaceId ?? locPlace.location_place_id ?? null) : null;

        return {
            clientId: createClientId('program'),
            programId: rawProgram?.programId ?? rawProgram?.program_id ?? null,
            name: rawProgram?.name ?? '',
            description: rawProgram?.description ?? '',
            locationId: locId,
            manualLocation: null,
            scheduleItemClientId: linkedSchedule?.clientId ?? null,
        };
    });
}
