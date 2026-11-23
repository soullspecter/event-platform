import { buildProgramsPayload } from './Programs.payload';
import { buildCommonSchedulePayload } from './CommonSchedule.payload';
import { buildQuestionnairesPayload } from './Questionnaires.payload';
import { toTrimmedOrNull } from '../eventForm.utils';

export function buildEventPayload({ event, programs, commonSchedule }) {
    return {
        title: toTrimmedOrNull(event.title),
        description: toTrimmedOrNull(event.description),
        startDate: event.startDate || null,
        endDate: event.endDate || null,
        programs: buildProgramsPayload(programs),
        commonSchedule: buildCommonSchedulePayload(commonSchedule),
        questionnaires: buildQuestionnairesPayload(event.questionnaires || []),
    };
}
