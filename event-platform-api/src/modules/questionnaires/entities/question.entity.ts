import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { Questionnaire } from './questionnaire.entity';
import { QuestionOption } from './question-option.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn({ name: 'question_id' })
  questionId: number;

  @Column({ name: 'questionnaire_id' })
  questionnaireId: number;

  @ManyToOne(
    () => Questionnaire,
    (questionnaire) => questionnaire.questions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire: Questionnaire;

  @Column({ type: 'text' })
  text: string;

  @Column({ default: 'text' })
  type: 'text' | 'single_choice' | 'multiple_choice';

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(
    () => QuestionOption,
    (option) => option.question,
    { cascade: true },
  )
  options: QuestionOption[];
}