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

export function buildProgramsPayload(programs = []) {
    return programs.map((program) => ({
        ...(program.programId ? { programId: Number(program.programId) } : {}),
        name: toTrimmedOrNull(program.name),
        description: toTrimmedOrNull(program.description),

        schedule: (program.schedule ?? []).map((slot) => ({
            names: (Array.isArray(slot.names) ? slot.names : slot.name ? [slot.name] : []).map(toTrimmedOrNull).filter(Boolean),

            itemDate: slot.itemDate || null,
            startTime: slot.startTime || null,
            endTime: slot.endTime || null,
            location: buildLocationPayload(slot),
        })),
    }));
}
