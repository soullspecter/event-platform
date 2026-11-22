// registrations/entities/registration.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entity/user.entity';
import { Event } from '../../events-module/events/entity/event.entity';

@Entity('registrations')
@Unique('uq_registrations_user_event', ['userId', 'eventId'])
export class Registration {
    @PrimaryGeneratedColumn({ name: 'registration_id' })
    registrationId: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'event_id' })
    eventId: number;

    @Column({ name: 'qr_code_id', type: 'int', nullable: true })
    qrCodeId: number | null;

    @ManyToOne(() => User, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Event, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'event_id' })
    event: Event;
}
