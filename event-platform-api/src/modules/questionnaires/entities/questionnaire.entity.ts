import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';

import { Question } from './question.entity';
import { QuestionnaireSubmission } from './questionnaire-submission.entity';

@Entity('questionnaires')
export class Questionnaire {
  @PrimaryGeneratedColumn({ name: 'questionnaire_id' })
  questionnaireId: number;

  @Column({ name: 'event_id' })
  eventId: number;

  @Column({
    type: 'varchar',
    length: 255,
    default: 'Новая анкета',
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    name: 'available_from',
    type: 'timestamptz',
    nullable: true,
  })
  availableFrom: Date | null;

  @Column({
    name: 'available_until',
    type: 'timestamptz',
    nullable: true,
  })
  availableUntil: Date | null;

  @Column({
    name: 'is_published',
    type: 'boolean',
    default: false,
  })
  isPublished: boolean;

  @OneToMany(
    () => Question,
    (question) => question.questionnaire,
    { cascade: true },
  )
  questions: Question[];

  @OneToMany(
    () => QuestionnaireSubmission,
    (submission) => submission.questionnaire,
  )
  submissions: QuestionnaireSubmission[];
}