import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';

@Entity('question_options')
export class QuestionOption {
    @PrimaryGeneratedColumn({ name: 'option_id' })
    optionId: number;

    @Column({ name: 'question_id' })
    questionId: number;

    @ManyToOne(() => Question, (question) => question.options, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'question_id' })
    question: Question;

    @Column({ name: 'option_text', length: 500 })
    optionText: string;

    @Column({ name: 'sort_order', default: 0 })
    sortOrder: number;
}
