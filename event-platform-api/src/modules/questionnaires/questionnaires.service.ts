import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Questionnaire } from './entities/questionnaire.entity';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuestionnaireSubmission } from './entities/questionnaire-submission.entity';
import { Answer } from './entities/answer.entity';
import { AnswerOption } from './entities/answer-option.entity';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectRepository(Questionnaire)
    private readonly questionnairesRepo: Repository<Questionnaire>,

    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,

    @InjectRepository(QuestionOption)
    private readonly optionsRepo: Repository<QuestionOption>,

    @InjectRepository(QuestionnaireSubmission)
    private readonly submissionsRepo: Repository<QuestionnaireSubmission>,

    @InjectRepository(Answer)
    private readonly answersRepo: Repository<Answer>,

    @InjectRepository(AnswerOption)
    private readonly answerOptionsRepo: Repository<AnswerOption>,

    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateQuestionnaireDto) {
    if (
      dto.availableFrom &&
      dto.availableUntil &&
      new Date(dto.availableFrom) >= new Date(dto.availableUntil)
    ) {
      throw new BadRequestException(
        'Дата окончания должна быть позже даты начала',
      );
    }

    const questionnaire = this.questionnairesRepo.create({
      eventId: dto.eventId,
      title: dto.title,
      description: dto.description,
      availableFrom: dto.availableFrom
        ? new Date(dto.availableFrom) : null,
      availableUntil: dto.availableUntil
        ? new Date(dto.availableUntil) : null,
      isPublished: dto.isPublished ?? false,
      questions: (dto.questions ?? []).map((q, index) => ({
        text: q.text,
        type: q.type,
        isRequired: q.isRequired ?? false,
        sortOrder: q.sortOrder ?? index,
        options: (q.options ?? []).map((option, optionIndex) => ({
          optionText: option.text,
          sortOrder: option.sortOrder ?? optionIndex,
        })),
      })),
    });

    return this.questionnairesRepo.save(questionnaire);
  }

  async findForEvent(eventId: number) {
    return this.questionnairesRepo.find({
      where: { eventId },
      relations: {
  questions: {
    options: true,
  },
},
      order: {
        questionnaireId: 'DESC',
        questions: { sortOrder: 'ASC' },
      },
    });
  }

  async findAvailableForUser(eventId: number, userId: number) {
    const registered = await this.dataSource.query(
      `SELECT 1 FROM registrations
       WHERE event_id = $1 AND user_id = $2 LIMIT 1`,
      [eventId, userId],
    );

    if (!registered.length) {
      throw new ForbiddenException(
        'Для просмотра анкеты необходимо зарегистрироваться на мероприятие',
      );
    }

    const now = new Date();

    const questionnaires = await this.questionnairesRepo.find({
      where: { eventId, isPublished: true },
      relations: {
  questions: {
    options: true,
  },
},
      order: { questionnaireId: 'DESC' },
    });

    return questionnaires.filter(q =>
      (!q.availableFrom || q.availableFrom <= now) &&
      (!q.availableUntil || q.availableUntil >= now),
    );
  }

  async submit(
    questionnaireId: number,
    userId: number,
    dto: SubmitQuestionnaireDto,
  ) {
    const questionnaire = await this.questionnairesRepo.findOne({
      where: { questionnaireId },
      relations: {
  questions: {
    options: true,
  },
},
    });

    if (!questionnaire || !questionnaire.isPublished) {
      throw new NotFoundException('Анкета не найдена или не опубликована');
    }

    const now = new Date();

    if (
      (questionnaire.availableFrom && questionnaire.availableFrom > now) ||
      (questionnaire.availableUntil && questionnaire.availableUntil < now)
    ) {
      throw new ForbiddenException('Анкета сейчас недоступна');
    }

    const registered = await this.dataSource.query(
      `SELECT 1 FROM registrations
       WHERE event_id = $1 AND user_id = $2 LIMIT 1`,
      [questionnaire.eventId, userId],
    );

    if (!registered.length) {
      throw new ForbiddenException('Вы не зарегистрированы на мероприятие');
    }

    const alreadySubmitted = await this.submissionsRepo.findOne({
      where: { questionnaireId, userId },
    });

    if (alreadySubmitted) {
      throw new ConflictException('Вы уже заполняли эту анкету');
    }

    const questions = questionnaire.questions ?? [];
    const answers = dto.answers ?? [];

    for (const question of questions) {
      const answer = answers.find(
        a => a.questionId === question.questionId,
      );

      if (!answer) {
        if (question.isRequired) {
          throw new BadRequestException(
            `Заполните обязательный вопрос: ${question.text}`,
          );
        }
        continue;
      }

      if (
        question.type === 'text' &&
        question.isRequired &&
        !answer.textValue?.trim()
      ) {
        throw new BadRequestException(
          `Заполните обязательный вопрос: ${question.text}`,
        );
      }

      if (
        question.type === 'single_choice' &&
        question.isRequired &&
        (!answer.optionIds || answer.optionIds.length !== 1)
      ) {
        throw new BadRequestException(
          `Выберите один вариант: ${question.text}`,
        );
      }

      if (
        question.type === 'multiple_choice' &&
        question.isRequired &&
        (!answer.optionIds || answer.optionIds.length === 0)
      ) {
        throw new BadRequestException(
          `Выберите хотя бы один вариант: ${question.text}`,
        );
      }

      if (question.type === 'text' && answer.optionIds?.length) {
        throw new BadRequestException('Для текстового вопроса нельзя выбирать варианты');
      }

      if (
  question.type === 'single_choice' &&
  (answer.optionIds?.length ?? 0) > 1
) {
        throw new BadRequestException('Можно выбрать только один вариант');
      }

      const allowedIds = new Set(
        (question.options ?? []).map(option => option.optionId),
      );

      if ((answer.optionIds ?? []).some(id => !allowedIds.has(id))) {
        throw new BadRequestException(
          'Выбранный вариант не относится к этому вопросу',
        );
      }
    }

    const knownQuestionIds = new Set(questions.map(q => q.questionId));

    if (answers.some(a => !knownQuestionIds.has(a.questionId))) {
      throw new BadRequestException('В анкете есть неизвестный вопрос');
    }

    return this.dataSource.transaction(async manager => {
      const submissionRepo = manager.getRepository(QuestionnaireSubmission);
      const answerRepo = manager.getRepository(Answer);
      const answerOptionRepo = manager.getRepository(AnswerOption);

      const submission = await submissionRepo.save(
        submissionRepo.create({ questionnaireId, userId }),
      );

      for (const item of answers) {
        const question = questions.find(
          q => q.questionId === item.questionId,
        );

        if (!question) continue;

        const savedAnswer = await answerRepo.save(
          answerRepo.create({
            submissionId: submission.submissionId,
            questionId: question.questionId,
            textValue: question.type === 'text'
              ? item.textValue ?? null : null,
          }),
        );

        for (const optionId of item.optionIds ?? []) {
          await answerOptionRepo.save(
            answerOptionRepo.create({
              answerId: savedAnswer.answerId,
              optionId,
            }),
          );
        }
      }

      return {
        message: 'Ответы успешно сохранены',
        submissionId: submission.submissionId,
      };
    });
  }
}