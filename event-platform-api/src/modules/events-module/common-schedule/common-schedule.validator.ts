import { BadRequestException, Injectable } from '@nestjs/common';

import { Event } from '../events/entity/event.entity';
import { CommonScheduleItem } from './entity/common-schedule-item.entity';
import { timeToSeconds } from './utils/time.util';

type SlotFields = Pick<CommonScheduleItem, 'itemDate' | 'startTime' | 'endTime'>;

@Injectable()
export class CommonScheduleValidator {
    validateSlot(event: Event, slot: SlotFields): void {
        if (slot.startTime && slot.endTime && timeToSeconds(slot.endTime) <= timeToSeconds(slot.startTime)) {
            throw new BadRequestException('Время окончания должно быть позже времени начала');
        }
        if (slot.itemDate) {
            if (event.startDate && slot.itemDate < event.startDate) {
                throw new BadRequestException('Дата пункта расписания раньше даты начала мероприятия');
            }
            if (event.endDate && slot.itemDate > event.endDate) {
                throw new BadRequestException('Дата пункта расписания позже даты окончания мероприятия');
            }
        }
    }
}
