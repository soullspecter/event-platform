import { useState } from 'react';
import { Plus, Trash2, ClipboardList, CalendarDays, CircleHelp, ListChecks, Check, X, Pencil } from 'lucide-react';

import { createClientId } from '../../Utils/eventForm.utils';

import '../QuestionnairesEditor/QuestionnairesEditor.scss';

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
        availableFrom: '',
        availableUntil: '',
        isPublished: false,
        questions: [createEmptyQuestion()],
    };
}

function toDateTimeLocal(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 16);
    }

    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function normalizeQuestionnaire(questionnaire) {
    return {
        clientId: questionnaire.clientId || questionnaire.localId || createClientId('questionnaire'),

        questionnaireId: questionnaire.questionnaireId ?? null,
        title: questionnaire.title || '',
        availableFrom: toDateTimeLocal(questionnaire.availableFrom),
        availableUntil: toDateTimeLocal(questionnaire.availableUntil),
        isPublished: questionnaire.isPublished ?? false,

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
    const [error, setError] = useState('');

    const [form, setForm] = useState(createEmptyQuestionnaire);

    const isEditing = Boolean(selectedId);

    function updateForm(changes) {
        setForm((current) => ({
            ...current,
            ...changes,
        }));
    }

    function updateQuestion(questionId, changes) {
        updateForm({
            questions: form.questions.map((question) => (question.clientId === questionId ? { ...question, ...changes } : question)),
        });
    }

    function addQuestion() {
        updateForm({
            questions: [...form.questions, createEmptyQuestion()],
        });
    }

    function removeQuestion(questionId) {
        updateForm({
            questions: form.questions.filter((question) => question.clientId !== questionId),
        });
    }

    function changeQuestionType(questionId, type) {
        const question = form.questions.find((item) => item.clientId === questionId);

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
        const question = form.questions.find((item) => item.clientId === questionId);

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
        const question = form.questions.find((item) => item.clientId === questionId);

        if (!question) return;

        updateQuestion(questionId, {
            options: question.options.map((option) => (option.clientId === optionId ? { ...option, text } : option)),
        });
    }

    function removeOption(questionId, optionId) {
        const question = form.questions.find((item) => item.clientId === questionId);

        if (!question) return;

        updateQuestion(questionId, {
            options: question.options.filter((option) => option.clientId !== optionId),
        });
    }

    // Открыть форму создания новой анкеты.
    function addQuestionnaire() {
        setSelectedId(null);
        setForm(createEmptyQuestionnaire());
        setError('');
    }

    // Открыть существующую анкету.
    function selectQuestionnaire(questionnaire) {
        setSelectedId(getQuestionnaireKey(questionnaire));
        setForm(normalizeQuestionnaire(questionnaire));
        setError('');
    }

    function removeQuestionnaire(questionnaire) {
        const key = getQuestionnaireKey(questionnaire);

        onQuestionnairesChange(questionnaires.filter((item) => getQuestionnaireKey(item) !== key));

        if (selectedId === key) {
            addQuestionnaire();
        }
    }

    function validateForm() {
        if (!form.title.trim()) {
            return 'Укажи название анкеты.';
        }

        if (form.availableFrom && form.availableUntil && new Date(form.availableUntil) < new Date(form.availableFrom)) {
            return 'Дата окончания доступности не может быть раньше даты начала.';
        }

        if (!form.questions.length) {
            return 'Добавь хотя бы один вопрос.';
        }

        for (const [index, question] of form.questions.entries()) {
            if (!question.text.trim()) {
                return `Заполни текст вопроса №${index + 1}.`;
            }

            if (question.type !== 'text') {
                const options = question.options.filter((option) => option.text.trim());

                if (options.length < 2) {
                    return `В вопросе №${index + 1} должно быть минимум два варианта ответа.`;
                }
            }
        }

        return '';
    }

    function handleSubmit(event) {
        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        const updatedQuestionnaire = {
            ...form,

            title: form.title.trim(),
            availableFrom: form.availableFrom || null,
            availableUntil: form.availableUntil || null,

            questions: form.questions.map((question, index) => ({
                ...question,
                text: question.text.trim(),
                sortOrder: index,

                options:
                    question.type === 'text'
                        ? []
                        : question.options
                              .filter((option) => option.text.trim())
                              .map((option, optionIndex) => ({
                                  ...option,
                                  text: option.text.trim(),
                                  sortOrder: optionIndex,
                              })),
            })),
        };

        // Убираем clientId из вложенных объектов не нужно:
        // он пригодится фронтенду для стабильной идентификации.
        // buildQuestionnairesPayload должен исключить его из API payload.

        if (isEditing) {
            onQuestionnairesChange(
                questionnaires.map((questionnaire) =>
                    getQuestionnaireKey(questionnaire) === selectedId
                        ? {
                              ...questionnaire,
                              ...updatedQuestionnaire,
                          }
                        : questionnaire,
                ),
            );
        } else {
            onQuestionnairesChange([
                ...questionnaires,
                {
                    ...updatedQuestionnaire,
                    isPublished: false,
                },
            ]);
        }

        // После добавления или изменения открываем новую пустую форму.
        setSelectedId(null);
        setForm(createEmptyQuestionnaire());
        setError('');
    }

    return (
        <div className="questionnaires-editor-split">
            {/* Левая панель */}
            <aside className="questionnaires-editor-split__sidebar">
                <button type="button" className="questionnaires-editor-split__add" onClick={addQuestionnaire}>
                    <Plus size={17} />
                    Создать анкету
                </button>

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

                                        <span className="questionnaires-editor-split__status">{questionnaire.isPublished ? 'Опубликована' : 'Черновик'}</span>
                                    </button>

                                    <div className="questionnaires-editor-split__item-actions">
                                        <button type="button" title="Редактировать" onClick={() => selectQuestionnaire(questionnaire)}>
                                            <Pencil size={15} />
                                        </button>

                                        <button type="button" title="Удалить" className="is-danger" onClick={() => removeQuestionnaire(questionnaire)}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>

            {/* Правая панель */}
            <section className="questionnaires-editor-split__editor">
                <form className="questionnaires-edit-form" onSubmit={handleSubmit}>
                    <div className="questionnaires-edit-form__header">
                        <div>
                            <h2>{isEditing ? 'Редактирование анкеты' : 'Новая анкета'}</h2>

                            <p>Настройте название, сроки проведения и вопросы</p>
                        </div>

                        {isEditing && (
                            <button type="button" className="questionnaires-edit-form__cancel" onClick={addQuestionnaire}>
                                <X size={16} />
                                Отмена
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="questionnaires-edit-form__error">
                            <X size={17} />
                            {error}
                        </div>
                    )}

                    <div className="questionnaires-edit-form__fields">
                        <label className="field">
                            <span>Название анкеты</span>
                            <input
                                maxLength={255}
                                value={form.title}
                                onChange={(event) =>
                                    updateForm({
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
                                    Доступна с
                                </span>

                                <input
                                    type="datetime-local"
                                    value={form.availableFrom}
                                    onChange={(event) =>
                                        updateForm({
                                            availableFrom: event.target.value,
                                        })
                                    }
                                />
                            </label>

                            <label className="field">
                                <span>
                                    <CalendarDays size={15} />
                                    Доступна до
                                </span>

                                <input
                                    type="datetime-local"
                                    value={form.availableUntil}
                                    onChange={(event) =>
                                        updateForm({
                                            availableUntil: event.target.value,
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

                        <span>{form.questions.length}</span>
                    </div>

                    <div className="questionnaires-edit-form__questions">
                        {form.questions.map((question, index) => (
                            <article className="questionnaires-edit-form__question" key={question.clientId}>
                                <div className="questionnaires-edit-form__question-header">
                                    <strong>
                                        <CircleHelp size={17} />
                                        Вопрос {index + 1}
                                    </strong>

                                    <button type="button" disabled={form.questions.length === 1} onClick={() => removeQuestion(question.clientId)} title="Удалить вопрос">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <label className="field">
                                    <span>Текст вопроса</span>
                                    <input
                                        maxLength={1000}
                                        value={question.text}
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
                                                    value={option.text}
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

                        <button type="submit" className="questionnaires-edit-form__primary">
                            <Check size={17} />
                            {isEditing ? 'Сохранить изменения' : 'Добавить анкету'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
