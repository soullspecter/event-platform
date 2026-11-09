import { toTrimmedOrNull } from '../eventForm.utils';

function resolveScheduleLink(program, schedule) {
    const idx = program.scheduleItemClientId ? schedule.findIndex((item) => item.clientId === program.scheduleItemClientId) : -1;
    const linked = idx >= 0 ? schedule[idx] : null;

    const rawId = linked?.scheduleItemId;
    const id = rawId !== null && rawId !== undefined ? Number(rawId) : null;

    return {
        scheduleItemId: id && id > 0 ? id : undefined,
        scheduleItemIndex: idx >= 0 && (!id || id <= 0) ? idx : undefined,
    };
}

export function buildProgramsPayload(programs, schedule = []) {
    return programs.map((program) => {
        const { scheduleItemId, scheduleItemIndex } = resolveScheduleLink(program, schedule);

        const savedLocationPlaceId = program.locationId != null ? Number(program.locationId) : null;

        const manual = program.manualLocation
            ? {
                  locationId: program.manualLocation.locationId || undefined,
                  name: toTrimmedOrNull(program.manualLocation.name) ?? undefined,
                  place: toTrimmedOrNull(program.manualLocation.place) ?? undefined,
                  address: toTrimmedOrNull(program.manualLocation.address) ?? undefined,
              }
            : undefined;

        return {
            programId: program.programId || undefined,
            scheduleItemId,
            scheduleItemIndex,
            name: toTrimmedOrNull(program.name) ?? undefined,
            description: toTrimmedOrNull(program.description) ?? undefined,
            locationPlaceId: savedLocationPlaceId || undefined,
            manualLocation: manual,
        };
    });
}
