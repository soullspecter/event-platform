import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';

import { Questionnaire } from './entities/questionnaire.entity';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuestionnaireSubmission } from './entities/questionnaire-submission.entity';
import { Answer } from './entities/answer.entity';
import { AnswerOption } from './entities/answer-option.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Questionnaire, Question, QuestionOption, QuestionnaireSubmission, Answer, AnswerOption])],
    controllers: [QuestionnairesController],
    providers: [QuestionnairesService],
    exports: [QuestionnairesService],
})
export class QuestionnairesModule {}
