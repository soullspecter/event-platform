import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';

import { QuestionnaireSubmission } from './questionnaire-submission.entity';
import { Question } from './question.entity';
import { AnswerOption } from './answer-option.entity';

@Entity('answers')
@Unique(['submissionId', 'questionId'])
export class Answer {
  @PrimaryGeneratedColumn({ name: 'answer_id' })
  answerId: number;

  @Column({ name: 'submission_id' })
  submissionId: number;

  @Column({ name: 'question_id' })
  questionId: number;

  @Column({
    name: 'text_value',
    type: 'text',
    nullable: true,
  })
  textValue: string | null;

  @ManyToOne(
    () => QuestionnaireSubmission,
    (submission) => submission.answers,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'submission_id' })
  submission: QuestionnaireSubmission;

  @ManyToOne(
    () => Question,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @OneToMany(
    () => AnswerOption,
    (answerOption) => answerOption.answer,
    { cascade: true },
  )
  selectedOptions: AnswerOption[];
}