import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Answer } from './answer.entity';
import { QuestionOption } from './question-option.entity';

@Entity('answer_options')
export class AnswerOption {
  @PrimaryColumn({ name: 'answer_id', type: 'integer' })
  answerId: number;

  @PrimaryColumn({ name: 'option_id', type: 'integer' })
  optionId: number;

  @ManyToOne(
    () => Answer,
    (answer) => answer.selectedOptions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @ManyToOne(
    () => QuestionOption,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'option_id' })
  option: QuestionOption;
}