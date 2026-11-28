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

export function getEventId(data) {
    return data?.eventId ?? data?.event_id ?? data?.event?.eventId ?? data?.data?.eventId ?? data?.id ?? null;
}

export function normalizeEvent(data) {
    const source = data?.event ?? data?.data?.event ?? data?.data ?? data ?? {};
    return {
        title: source.title ?? '',
        description: source.description ?? '',
        startDate: dateOnly(source.startDate ?? source.start_date),
        endDate: dateOnly(source.endDate ?? source.end_date),
        status: source.status ?? 'draft',
    };
}

function normalizeLocation(item) {
    const locationPlaceId = item?.locationPlaceId ?? item?.locationPlace?.locationPlaceId ?? item?.location?.locationPlaceId ?? null;

    return {
        locationPlaceId,
        manualLocation: null,
    };
}

export function normalizeProgramSlot(slot) {
    const source = slot?.scheduleItem ?? slot ?? {};

    const rawNames = source.names ?? source.scheduleItemNames ?? source.schedule_item_names ?? (source.name ? [source.name] : []);

    const names = Array.isArray(rawNames)
        ? rawNames
              .map((item) => {
                  if (typeof item === 'string') return item;
                  return item?.name ?? item?.activityName ?? '';
              })
              .filter(Boolean)
        : [];

    return {
        clientId: createClientId('slot'),
        scheduleItemId: source.scheduleItemId ?? source.schedule_item_id ?? null,
        names: names.length ? names : [''],
        itemDate: dateOnly(source.itemDate ?? source.item_date),
        startTime: timeOnly(source.startTime ?? source.start_time),
        endTime: timeOnly(source.endTime ?? source.end_time),
        ...normalizeLocation(source),
    };
}

export function normalizePrograms(rawPrograms) {
    if (!Array.isArray(rawPrograms)) return [];

    return rawPrograms.map((program) => {
        const rawSchedule = program?.schedule ?? program?.programSchedules ?? program?.program_schedule ?? [];

        return {
            clientId: createClientId('program'),
            programId: program?.programId ?? program?.program_id ?? null,
            name: program?.name ?? '',
            description: program?.description ?? '',
            schedule: rawSchedule.map(normalizeProgramSlot),
        };
    });
}

export function normalizeCommonSchedule(rawCommon) {
    if (!rawCommon) return [];

    let items = [];
    if (Array.isArray(rawCommon)) {
        items = rawCommon;
    } else if (typeof rawCommon === 'object') {
        Object.values(rawCommon).forEach((group) => {
            if (Array.isArray(group)) items.push(...group);
        });
    }

    return items.map((item) => ({
        clientId: createClientId('common'),
        commonItemId: item.commonItemId ?? null,
        name: item.name ?? '',
        itemDate: dateOnly(item.itemDate),
        startTime: timeOnly(item.startTime),
        endTime: timeOnly(item.endTime),
        ...normalizeLocation(item),
    }));
}
