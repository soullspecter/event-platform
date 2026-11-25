import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

import { Registration } from '../../registrations/entities/registration.entity';
import { ScheduleItem } from '../../events-module/schedule/entity/schedule-item.entity';

@Entity('program_selections')
export class ProgramSelection {
    @PrimaryColumn({ name: 'registration_id', type: 'integer' })
    registrationId: number;

    @PrimaryColumn({ name: 'schedule_item_id', type: 'integer' })
    scheduleItemId: number;

    @ManyToOne(() => Registration, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'registration_id',
        referencedColumnName: 'registrationId',
    })
    registration: Registration;

    @ManyToOne(() => ScheduleItem, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'schedule_item_id',
        referencedColumnName: 'scheduleItemId',
    })
    scheduleItem: ScheduleItem;
}
