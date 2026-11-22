import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';

import { Questionnaire } from './questionnaire.entity';
import { Answer } from './answer.entity';

@Entity('questionnaire_submissions')
@Unique(['questionnaireId', 'userId'])
export class QuestionnaireSubmission {
  @PrimaryGeneratedColumn({ name: 'submission_id' })
  submissionId: number;

  @Column({ name: 'questionnaire_id' })
  questionnaireId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(
    () => Questionnaire,
    (questionnaire) => questionnaire.submissions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire: Questionnaire;

  @OneToMany(
    () => Answer,
    (answer) => answer.submission,
    { cascade: true },
  )
  answers: Answer[];
}