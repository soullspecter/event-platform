export function buildSchedulePayload(items) {
    return (items ?? []).map((item) => ({
        scheduleItemId: item.scheduleItemId ?? undefined,
        name: item.name?.trim() || undefined,
        itemDate: item.itemDate || undefined,
        startTime: item.startTime || undefined,
        endTime: item.endTime || undefined,
    }));
}
