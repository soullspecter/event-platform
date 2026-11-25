import { useState } from 'react';
import { Plus, Trash2, ClipboardList, CalendarDays, CircleHelp, ListChecks, X } from 'lucide-react';

import { createClientId } from '../../Utils/eventForm.utils';

import '../QuestionnairesEditor/QuestionnairesEditor.scss';

// Временная зона анкет — Екатеринбург (UTC+5).
const QUESTIONNAIRE_TIME_ZONE = 'Asia/Yekaterinburg';
const YEKATERINBURG_OFFSET = '+05:00';

function createEmptyQuestion() {
    return {
        clientId: createClientId('question'),
        questionId: null,
        text: '',
        type: 'text',
        isRequired: false,
        options: [],
    };
}

function createEmptyQuestionnaire() {
    return {
        clientId: createClientId('questionnaire'),
        questionnaireId: null,
        title: '',
        availableFrom: null,
        availableUntil: null,
        questions: [createEmptyQuestion()],
    };
}

// ISO-дата из backend -> строка для datetime-local по Екатеринбургу.
function toDateTimeLocal(value) {
    if (!value) return '';

    const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(String(value));

    const date = new Date(hasTimeZone ? value : `${String(value).replace(' ', 'T')}:00${YEKATERINBURG_OFFSET}`);

    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: QUESTIONNAIRE_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

// Значение datetime-local по Екатеринбургу -> ISO UTC для backend.
function fromDateTimeLocal(value) {
    if (!value) return null;

    const date = new Date(`${value}:00${YEKATERINBURG_OFFSET}`);

    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
}

function normalizeQuestionnaire(questionnaire) {
    return {
        clientId: questionnaire.clientId || questionnaire.localId || createClientId('questionnaire'),

        questionnaireId: questionnaire.questionnaireId ?? null,
        title: questionnaire.title || '',

        availableFrom: questionnaire.availableFrom || null,
        availableUntil: questionnaire.availableUntil || null,

        questions: (questionnaire.questions || []).map((question) => ({
            clientId: question.clientId || createClientId('question'),

            questionId: question.questionId ?? null,
            text: question.text || '',
            type: question.type || 'text',
            isRequired: question.isRequired ?? false,

            options: (question.options || []).map((option) => {
                if (typeof option === 'string') {
                    return {
                        clientId: createClientId('option'),
                        text: option,
                    };
                }

                return {
                    clientId: option.clientId || createClientId('option'),
                    optionId: option.optionId ?? null,
                    text: option.text ?? option.optionText ?? '',
                    sortOrder: option.sortOrder,
                };
            }),
        })),
    };
}

function getQuestionnaireKey(questionnaire) {
    return questionnaire.questionnaireId != null ? `id:${questionnaire.questionnaireId}` : `client:${questionnaire.clientId || questionnaire.localId}`;
}

export default function QuestionnairesAdminPage({ questionnaires = [], onQuestionnairesChange }) {
    const [selectedId, setSelectedId] = useState(null);

    const selectedQuestionnaire = questionnaires.find((questionnaire) => getQuestionnaireKey(questionnaire) === selectedId);

    function updateSelectedQuestionnaire(changes) {
        if (!selectedId) return;

        const updatedQuestionnaires = questionnaires.map((questionnaire) =>
            getQuestionnaireKey(questionnaire) === selectedId
                ? {
                      ...questionnaire,
                      ...changes,
                  }
                : questionnaire,
        );

        onQuestionnairesChange(updatedQuestionnaires);
    }

    function updateQuestion(questionId, changes) {
        if (!selectedQuestionnaire) return;

        updateSelectedQuestionnaire({
            questions: selectedQuestionnaire.questions.map((question) =>
                question.clientId === questionId
                    ? {
                          ...question,
                          ...changes,
                      }
                    : question,
            ),
        });
    }

    function addQuestion() {
        if (!selectedQuestionnaire) return;

        updateSelectedQuestionnaire({
            questions: [...selectedQuestionnaire.questions, createEmptyQuestion()],
        });
    }

    function removeQuestion(questionId) {
        if (!selectedQuestionnaire) return;

        updateSelectedQuestionnaire({
            questions: selectedQuestionnaire.questions.filter((question) => question.clientId !== questionId),
        });
    }

    function changeQuestionType(questionId, type) {
        const question = selectedQuestionnaire?.questions.find((item) => item.clientId === questionId);

        if (!question) return;

        updateQuestion(questionId, {
            type,
            options:
                type === 'text'
                    ? []
                    : question.options.length
                      ? question.options
                      : [
                            {
                                clientId: createClientId('option'),
                                text: '',
                            },
                        ],
        });
    }

    function addOption(questionId) {
        const question = selectedQuestionnaire?.questions.find((item) => item.clientId === questionId);

        if (!question) return;

        updateQuestion(questionId, {
            options: [
                ...question.options,
                {
                    clientId: createClientId('option'),
                    text: '',
                },
            ],
        });
    }

    function updateOption(questionId, optionId, text) {
        const question = selectedQuestionnaire?.questions.find((item) => item.clientId === questionId);

        if (!question) return;

        updateQuestion(questionId, {
            options: question.options.map((option) =>
                option.clientId === optionId
                    ? {
                          ...option,
                          text,
                      }
                    : option,
            ),
        });
    }

    function removeOption(questionId, optionId) {
        const question = selectedQuestionnaire?.questions.find((item) => item.clientId === questionId);

        if (!question) return;

        updateQuestion(questionId, {
            options: question.options.filter((option) => option.clientId !== optionId),
        });
    }

    function addQuestionnaire() {
        const questionnaire = createEmptyQuestionnaire();

        onQuestionnairesChange([...questionnaires, questionnaire]);

        setSelectedId(getQuestionnaireKey(questionnaire));
    }

    function selectQuestionnaire(questionnaire) {
        const key = getQuestionnaireKey(questionnaire);

        setSelectedId(key);

        if (!questionnaire.clientId) {
            const normalized = normalizeQuestionnaire(questionnaire);

            onQuestionnairesChange(questionnaires.map((item) => (getQuestionnaireKey(item) === key ? normalized : item)));

            setSelectedId(getQuestionnaireKey(normalized));
        }
    }

    function removeSelectedQuestionnaire() {
        if (!selectedQuestionnaire) return;

        const confirmed = window.confirm('Удалить выбранную анкету? Изменение сохранится после нажатия «Сохранить черновик».');

        if (!confirmed) return;

        const key = getQuestionnaireKey(selectedQuestionnaire);

        onQuestionnairesChange(questionnaires.filter((questionnaire) => getQuestionnaireKey(questionnaire) !== key));

        setSelectedId(null);
    }

    return (
        <div className="questionnaires-editor-split">
            <aside className="questionnaires-editor-split__sidebar">
                <div className="questionnaires-editor-split__actions">
                    <button type="button" onClick={addQuestionnaire}>
                        <Plus size={16} />
                        Создать анкету
                    </button>
                </div>

                <div className="questionnaires-editor-split__list-heading">
                    Созданные анкеты
                    <span>{questionnaires.length}</span>
                </div>

                {questionnaires.length === 0 ? (
                    <div className="questionnaires-editor-split__empty-list">
                        <ClipboardList size={27} />
                        <p>Пока нет созданных анкет</p>
                    </div>
                ) : (
                    <ul className="questionnaires-editor-split__list">
                        {questionnaires.map((questionnaire) => {
                            const key = getQuestionnaireKey(questionnaire);

                            return (
                                <li key={key}>
                                    <button type="button" className={selectedId === key ? 'is-active' : ''} onClick={() => selectQuestionnaire(questionnaire)}>
                                        <strong>{questionnaire.title || 'Без названия'}</strong>

                                        <small>{questionnaire.questions?.length || 0} вопросов</small>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>

            <section className="questionnaires-editor-split__editor">
                {!selectedQuestionnaire ? (
                    <div className="questionnaires-editor-split__empty">Выберите анкету слева или создайте новую.</div>
                ) : (
                    <div className="questionnaires-edit-form">
                        <div className="questionnaires-edit-form__header">
                            <div>
                                <h2>{selectedQuestionnaire.questionnaireId ? 'Редактирование анкеты' : 'Новая анкета'}</h2>

                                <p>Настройте название, сроки проведения и вопросы</p>
                            </div>

                            <button type="button" className="text-danger" onClick={removeSelectedQuestionnaire}>
                                <Trash2 size={16} />
                                Удалить анкету
                            </button>
                        </div>

                        <div className="questionnaires-edit-form__fields">
                            <label className="field">
                                <span>Название анкеты</span>

                                <input
                                    maxLength={255}
                                    value={selectedQuestionnaire.title ?? ''}
                                    onChange={(event) =>
                                        updateSelectedQuestionnaire({
                                            title: event.target.value,
                                        })
                                    }
                                    placeholder="Например, Регистрация участников"
                                />
                            </label>

                            <div className="field-row">
                                <label className="field">
                                    <span>
                                        <CalendarDays size={15} />
                                        Доступна с (Екатеринбург)
                                    </span>

                                    <input
                                        type="datetime-local"
                                        value={toDateTimeLocal(selectedQuestionnaire.availableFrom)}
                                        onChange={(event) =>
                                            updateSelectedQuestionnaire({
                                                availableFrom: fromDateTimeLocal(event.target.value),
                                            })
                                        }
                                    />
                                </label>

                                <label className="field">
                                    <span>
                                        <CalendarDays size={15} />
                                        Доступна до (Екатеринбург)
                                    </span>

                                    <input
                                        type="datetime-local"
                                        value={toDateTimeLocal(selectedQuestionnaire.availableUntil)}
                                        onChange={(event) =>
                                            updateSelectedQuestionnaire({
                                                availableUntil: fromDateTimeLocal(event.target.value),
                                            })
                                        }
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="questionnaires-edit-form__section-heading">
                            <div>
                                <h3>Вопросы анкеты</h3>
                                <p>Добавьте вопросы для участников</p>
                            </div>

                            <span>{selectedQuestionnaire.questions.length}</span>
                        </div>

                        <div className="questionnaires-edit-form__questions">
                            {selectedQuestionnaire.questions.map((question, index) => (
                                <article className="questionnaires-edit-form__question" key={question.clientId}>
                                    <div className="questionnaires-edit-form__question-header">
                                        <strong>
                                            <CircleHelp size={17} />
                                            Вопрос {index + 1}
                                        </strong>

                                        <button type="button" disabled={selectedQuestionnaire.questions.length === 1} onClick={() => removeQuestion(question.clientId)} title="Удалить вопрос">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <label className="field">
                                        <span>Текст вопроса</span>

                                        <input
                                            maxLength={1000}
                                            value={question.text ?? ''}
                                            onChange={(event) =>
                                                updateQuestion(question.clientId, {
                                                    text: event.target.value,
                                                })
                                            }
                                            placeholder="Введите формулировку вопроса"
                                        />
                                    </label>

                                    <div className="questionnaires-edit-form__settings">
                                        <label className="field">
                                            <span>Тип ответа</span>

                                            <select value={question.type} onChange={(event) => changeQuestionType(question.clientId, event.target.value)}>
                                                <option value="text">Свободный текст</option>

                                                <option value="single_choice">Один вариант ответа</option>

                                                <option value="multiple_choice">Несколько вариантов</option>
                                            </select>
                                        </label>

                                        <label className="questionnaires-edit-form__required">
                                            <input
                                                type="checkbox"
                                                checked={question.isRequired}
                                                onChange={(event) =>
                                                    updateQuestion(question.clientId, {
                                                        isRequired: event.target.checked,
                                                    })
                                                }
                                            />
                                            Обязательный вопрос
                                        </label>
                                    </div>

                                    {question.type !== 'text' && (
                                        <div className="questionnaires-edit-form__options">
                                            <div className="questionnaires-edit-form__options-heading">
                                                <ListChecks size={17} />
                                                Варианты ответа
                                            </div>

                                            {question.options.map((option, optionIndex) => (
                                                <div className="questionnaires-edit-form__option" key={option.clientId}>
                                                    <span>{optionIndex + 1}</span>

                                                    <input
                                                        maxLength={500}
                                                        value={option.text ?? ''}
                                                        onChange={(event) => updateOption(question.clientId, option.clientId, event.target.value)}
                                                        placeholder={`Вариант ответа ${optionIndex + 1}`}
                                                    />

                                                    <button type="button" onClick={() => removeOption(question.clientId, option.clientId)} title="Удалить вариант">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}

                                            <button type="button" className="questionnaires-edit-form__add-option" onClick={() => addOption(question.clientId)}>
                                                <Plus size={16} />
                                                Добавить вариант ответа
                                            </button>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>

                        <div className="questionnaires-edit-form__actions">
                            <button type="button" className="questionnaires-edit-form__secondary" onClick={addQuestion}>
                                <Plus size={17} />
                                Добавить вопрос
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
