import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';

import { Questionnaire } from './entities/questionnaire.entity';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuestionnaireSubmission } from './entities/questionnaire-submission.entity';
import { Answer } from './entities/answer.entity';
import { AnswerOption } from './entities/answer-option.entity';

import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';
import { SaveEventQuestionnaireDto } from './dto/save-event-questionnaire.dto';

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

    // =====================================================
    // СОЗДАНИЕ АНКЕТЫ ОТДЕЛЬНО
    // Оставлено для существующего POST /questionnaires
    // =====================================================

    async create(dto: CreateQuestionnaireDto) {
        this.validateDates(dto.availableFrom, dto.availableUntil);

        const questionnaire = this.questionnairesRepo.create({
            eventId: dto.eventId,
            title: dto.title,
            availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
            availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
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

    // =====================================================
    // СОХРАНЕНИЕ АНКЕТ ВМЕСТЕ С МЕРОПРИЯТИЕМ
    // Вызывается из EventsService внутри транзакции
    // =====================================================

    async replaceForEvent(manager: EntityManager, eventId: number, items: SaveEventQuestionnaireDto[]) {
        const questionnaireRepo = manager.getRepository(Questionnaire);
        const questionRepo = manager.getRepository(Question);
        const optionRepo = manager.getRepository(QuestionOption);
        const submissionRepo = manager.getRepository(QuestionnaireSubmission);
        const answerRepo = manager.getRepository(Answer);
        const answerOptionRepo = manager.getRepository(AnswerOption);

        const existingQuestionnaires = await questionnaireRepo.find({
            where: { eventId },
            relations: {
                questions: {
                    options: true,
                },
            },
        });

        const existingQuestionnaireMap = new Map(existingQuestionnaires.map((q) => [q.questionnaireId, q]));

        const incomingQuestionnaireIds = new Set<number>();

        // Проверяем входящие данные до начала изменений.
        for (const item of items) {
            if (!item.title?.trim()) {
                throw new BadRequestException('Укажите название анкеты');
            }

            this.validateDates(item.availableFrom, item.availableUntil);

            if (item.questionnaireId !== undefined) {
                if (!existingQuestionnaireMap.has(item.questionnaireId)) {
                    throw new BadRequestException('Анкета не принадлежит этому мероприятию');
                }

                if (incomingQuestionnaireIds.has(item.questionnaireId)) {
                    throw new BadRequestException('Повторяется ID анкеты');
                }

                incomingQuestionnaireIds.add(item.questionnaireId);
            }

            for (const question of item.questions ?? []) {
                if (!question.text?.trim()) {
                    throw new BadRequestException('Текст вопроса не может быть пустым');
                }

                const options = question.options ?? [];

                if (question.type === 'text' && options.length > 0) {
                    throw new BadRequestException('У текстового вопроса не должно быть вариантов ответа');
                }

                if (question.type !== 'text' && options.length === 0) {
                    throw new BadRequestException('Добавьте хотя бы один вариант ответа');
                }

                for (const option of options) {
                    if (!option.text?.trim()) {
                        throw new BadRequestException('Текст варианта ответа не может быть пустым');
                    }
                }
            }
        }

        // Удаляем анкеты, которых больше нет в редакторе.
        for (const oldQuestionnaire of existingQuestionnaires) {
            if (incomingQuestionnaireIds.has(oldQuestionnaire.questionnaireId)) {
                continue;
            }

            const submissionsCount = await submissionRepo.count({
                where: {
                    questionnaireId: oldQuestionnaire.questionnaireId,
                },
            });

            if (submissionsCount > 0) {
                throw new BadRequestException(`Нельзя удалить анкету "${oldQuestionnaire.title}": на неё уже есть ответы`);
            }

            await questionnaireRepo.remove(oldQuestionnaire);
        }

        // Создаём или обновляем анкеты.
        for (const item of items) {
            let questionnaire: Questionnaire;

            if (item.questionnaireId !== undefined) {
                questionnaire = existingQuestionnaireMap.get(item.questionnaireId)!;

                questionnaire.title = item.title.trim();
                questionnaire.availableFrom = item.availableFrom ? new Date(item.availableFrom) : null;
                questionnaire.availableUntil = item.availableUntil ? new Date(item.availableUntil) : null;
                questionnaire.isPublished = item.isPublished ?? false;

                await questionnaireRepo.save(questionnaire);
            } else {
                questionnaire = await questionnaireRepo.save(
                    questionnaireRepo.create({
                        eventId,
                        title: item.title.trim(),
                        availableFrom: item.availableFrom ? new Date(item.availableFrom) : null,
                        availableUntil: item.availableUntil ? new Date(item.availableUntil) : null,
                        isPublished: item.isPublished ?? false,
                    }),
                );
            }

            // Получаем существующие вопросы анкеты.
            const oldQuestions = await questionRepo.find({
                where: {
                    questionnaireId: questionnaire.questionnaireId,
                },
                relations: {
                    options: true,
                },
            });

            const oldQuestionMap = new Map(oldQuestions.map((q) => [q.questionId, q]));

            const incomingQuestionIds = new Set<number>();

            // Проверяем принадлежность ID вопросов.
            for (const questionData of item.questions ?? []) {
                if (questionData.questionId !== undefined) {
                    if (!oldQuestionMap.has(questionData.questionId)) {
                        throw new BadRequestException('Вопрос не принадлежит этой анкете');
                    }

                    if (incomingQuestionIds.has(questionData.questionId)) {
                        throw new BadRequestException('Повторяется ID вопроса');
                    }

                    incomingQuestionIds.add(questionData.questionId);
                }
            }

            // Удаляем вопросы, которые убрали из редактора.
            for (const oldQuestion of oldQuestions) {
                if (incomingQuestionIds.has(oldQuestion.questionId)) {
                    continue;
                }

                const answersCount = await answerRepo.count({
                    where: {
                        questionId: oldQuestion.questionId,
                    },
                });

                if (answersCount > 0) {
                    throw new BadRequestException(`Нельзя удалить вопрос "${oldQuestion.text}": на него уже есть ответы`);
                }

                await questionRepo.remove(oldQuestion);
            }

            // Создаём или обновляем вопросы.
            for (const [questionIndex, questionData] of (item.questions ?? []).entries()) {
                let question: Question;

                if (questionData.questionId !== undefined) {
                    question = oldQuestionMap.get(questionData.questionId)!;

                    const answersCount = await answerRepo.count({
                        where: {
                            questionId: question.questionId,
                        },
                    });

                    // Нельзя менять смысл вопроса, если на него уже ответили.
                    if (answersCount > 0 && (question.text !== questionData.text || question.type !== questionData.type || question.isRequired !== (questionData.isRequired ?? false))) {
                        throw new BadRequestException(`Нельзя изменить вопрос "${question.text}": на него уже есть ответы`);
                    }

                    question.text = questionData.text.trim();
                    question.type = questionData.type;
                    question.isRequired = questionData.isRequired ?? false;
                    question.sortOrder = questionData.sortOrder ?? questionIndex;

                    await questionRepo.save(question);
                } else {
                    question = await questionRepo.save(
                        questionRepo.create({
                            questionnaireId: questionnaire.questionnaireId,
                            text: questionData.text.trim(),
                            type: questionData.type,
                            isRequired: questionData.isRequired ?? false,
                            sortOrder: questionData.sortOrder ?? questionIndex,
                        }),
                    );
                }

                // Получаем варианты ответа.
                const oldOptions = await optionRepo.find({
                    where: {
                        questionId: question.questionId,
                    },
                });

                const oldOptionMap = new Map(oldOptions.map((o) => [o.optionId, o]));

                const incomingOptionIds = new Set<number>();

                // Проверяем ID вариантов ответа.
                for (const optionData of questionData.options ?? []) {
                    if (optionData.optionId !== undefined) {
                        if (!oldOptionMap.has(optionData.optionId)) {
                            throw new BadRequestException('Вариант ответа не принадлежит этому вопросу');
                        }

                        if (incomingOptionIds.has(optionData.optionId)) {
                            throw new BadRequestException('Повторяется ID варианта ответа');
                        }

                        incomingOptionIds.add(optionData.optionId);
                    }
                }

                // Удаляем варианты, которые убрали из редактора.
                for (const oldOption of oldOptions) {
                    if (incomingOptionIds.has(oldOption.optionId)) {
                        continue;
                    }

                    const usedCount = await answerOptionRepo.count({
                        where: {
                            optionId: oldOption.optionId,
                        },
                    });

                    if (usedCount > 0) {
                        throw new BadRequestException(`Нельзя удалить вариант "${oldOption.optionText}": он уже выбран в ответах`);
                    }

                    await optionRepo.remove(oldOption);
                }

                // Создаём или обновляем варианты.
                for (const [optionIndex, optionData] of (questionData.options ?? []).entries()) {
                    if (optionData.optionId !== undefined) {
                        const option = oldOptionMap.get(optionData.optionId)!;

                        const usedCount = await answerOptionRepo.count({
                            where: {
                                optionId: option.optionId,
                            },
                        });

                        if (usedCount > 0 && option.optionText !== optionData.text.trim()) {
                            throw new BadRequestException(`Нельзя изменить вариант "${option.optionText}": он уже использован в ответах`);
                        }

                        option.optionText = optionData.text.trim();
                        option.sortOrder = optionData.sortOrder ?? optionIndex;

                        await optionRepo.save(option);
                    } else {
                        await optionRepo.save(
                            optionRepo.create({
                                questionId: question.questionId,
                                optionText: optionData.text.trim(),
                                sortOrder: optionData.sortOrder ?? optionIndex,
                            }),
                        );
                    }
                }
            }
        }

        return questionnaireRepo.find({
            where: { eventId },
            relations: {
                questions: {
                    options: true,
                },
            },
            order: {
                questionnaireId: 'ASC',
            },
        });
    }

    // =====================================================
    // ПОЛУЧЕНИЕ АНКЕТ МЕРОПРИЯТИЯ
    // =====================================================

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
                questions: {
                    sortOrder: 'ASC',
                },
            },
        });
    }

    // =====================================================
    // ПОЛУЧЕНИЕ ДОСТУПНЫХ АНКЕТ УЧАСТНИКОМ
    // =====================================================

    async findAvailableForUser(eventId: number, userId: number) {
        const registered = await this.dataSource.query(
            `SELECT 1 FROM registrations
             WHERE event_id = $1 AND user_id = $2
             LIMIT 1`,
            [eventId, userId],
        );

        if (!registered.length) {
            throw new ForbiddenException('Для просмотра анкеты необходимо зарегистрироваться на мероприятие');
        }

        const now = new Date();

        const questionnaires = await this.questionnairesRepo.find({
            where: {
                eventId,
                isPublished: true,
            },
            relations: {
                questions: {
                    options: true,
                },
            },
            order: {
                questionnaireId: 'DESC',
                questions: {
                    sortOrder: 'ASC',
                },
            },
        });

        return questionnaires
            .filter((q) => (!q.availableFrom || q.availableFrom <= now) && (!q.availableUntil || q.availableUntil >= now))
            .map((q) => ({
                ...q,
                questions: (q.questions ?? [])
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((question) => ({
                        ...question,
                        options: (question.options ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
                    })),
            }));
    }

    // =====================================================
    // ОТПРАВКА ОТВЕТОВ УЧАСТНИКОМ
    // =====================================================

    async submit(questionnaireId: number, userId: number, dto: SubmitQuestionnaireDto) {
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

        if ((questionnaire.availableFrom && questionnaire.availableFrom > now) || (questionnaire.availableUntil && questionnaire.availableUntil < now)) {
            throw new ForbiddenException('Анкета сейчас недоступна');
        }

        const registered = await this.dataSource.query(
            `SELECT 1 FROM registrations
             WHERE event_id = $1 AND user_id = $2
             LIMIT 1`,
            [questionnaire.eventId, userId],
        );

        if (!registered.length) {
            throw new ForbiddenException('Вы не зарегистрированы на мероприятие');
        }

        const alreadySubmitted = await this.submissionsRepo.findOne({
            where: {
                questionnaireId,
                userId,
            },
        });

        if (alreadySubmitted) {
            throw new ConflictException('Вы уже заполняли эту анкету');
        }

        const questions = questionnaire.questions ?? [];
        const answers = dto.answers ?? [];

        const knownQuestionIds = new Set(questions.map((q) => q.questionId));

        const submittedQuestionIds = new Set<number>();

        for (const answer of answers) {
            if (!knownQuestionIds.has(answer.questionId)) {
                throw new BadRequestException('В анкете есть неизвестный вопрос');
            }

            if (submittedQuestionIds.has(answer.questionId)) {
                throw new BadRequestException('Один вопрос указан несколько раз');
            }

            submittedQuestionIds.add(answer.questionId);

            if (new Set(answer.optionIds ?? []).size !== (answer.optionIds ?? []).length) {
                throw new BadRequestException('Один вариант ответа выбран несколько раз');
            }
        }

        for (const question of questions) {
            const answer = answers.find((a) => a.questionId === question.questionId);

            if (!answer) {
                if (question.isRequired) {
                    throw new BadRequestException(`Заполните обязательный вопрос: ${question.text}`);
                }

                continue;
            }

            if (question.type === 'text' && question.isRequired && !answer.textValue?.trim()) {
                throw new BadRequestException(`Заполните обязательный вопрос: ${question.text}`);
            }

            if (question.type === 'single_choice' && question.isRequired && (!answer.optionIds || answer.optionIds.length !== 1)) {
                throw new BadRequestException(`Выберите один вариант: ${question.text}`);
            }

            if (question.type === 'multiple_choice' && question.isRequired && (!answer.optionIds || answer.optionIds.length === 0)) {
                throw new BadRequestException(`Выберите хотя бы один вариант: ${question.text}`);
            }

            if (question.type === 'text' && (answer.optionIds?.length ?? 0) > 0) {
                throw new BadRequestException('Для текстового вопроса нельзя выбирать варианты');
            }

            if (question.type === 'single_choice' && (answer.optionIds?.length ?? 0) > 1) {
                throw new BadRequestException('Можно выбрать только один вариант');
            }

            const allowedIds = new Set((question.options ?? []).map((option) => option.optionId));

            if ((answer.optionIds ?? []).some((id) => !allowedIds.has(id))) {
                throw new BadRequestException('Выбранный вариант не относится к этому вопросу');
            }
        }

        return this.dataSource.transaction(async (manager) => {
            const submissionRepo = manager.getRepository(QuestionnaireSubmission);
            const answerRepo = manager.getRepository(Answer);
            const answerOptionRepo = manager.getRepository(AnswerOption);

            const submission = await submissionRepo.save(
                submissionRepo.create({
                    questionnaireId,
                    userId,
                }),
            );

            for (const item of answers) {
                const question = questions.find((q) => q.questionId === item.questionId);

                if (!question) continue;

                const savedAnswer = await answerRepo.save(
                    answerRepo.create({
                        submissionId: submission.submissionId,
                        questionId: question.questionId,
                        textValue: question.type === 'text' ? (item.textValue ?? null) : null,
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

    // =====================================================
    // ПРОВЕРКА ДАТ АНКЕТЫ
    // =====================================================

    private validateDates(availableFrom?: string | null, availableUntil?: string | null) {
        if (availableFrom && availableUntil && new Date(availableFrom) >= new Date(availableUntil)) {
            throw new BadRequestException('Дата окончания должна быть позже даты начала');
        }
    }
}
