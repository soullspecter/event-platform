import { useState } from 'react';
import { Plus, Trash2, ClipboardList, CalendarDays, CircleHelp, ListChecks, Check, X } from 'lucide-react';

import './QuestionnairesAdminPage.scss';

const createEmptyQuestion = () => ({
    text: '',
    type: 'text',
    isRequired: false,
    options: [],
});

const createEmptyForm = () => ({
    title: '',
    description: '',
    availableFrom: '',
    availableUntil: '',
    questions: [createEmptyQuestion()],
});

export default function QuestionnairesAdminPage({ questionnaires = [], onQuestionnairesChange }) {
    const [form, setForm] = useState(createEmptyForm);
    const [error, setError] = useState('');

    function updateForm(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function updateQuestion(index, field, value) {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((question, i) => (i === index ? { ...question, [field]: value } : question)),
        }));
    }

    function addQuestion() {
        setForm((current) => ({
            ...current,
            questions: [...current.questions, createEmptyQuestion()],
        }));
    }

    function removeQuestion(index) {
        setForm((current) => ({
            ...current,
            questions: current.questions.filter((_, i) => i !== index),
        }));
    }

    function changeQuestionType(index, type) {
        updateQuestion(index, 'type', type);
        updateQuestion(index, 'options', type === 'text' ? [] : ['']);
    }

    function addOption(questionIndex) {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((question, i) =>
                i === questionIndex
                    ? {
                          ...question,
                          options: [...question.options, ''],
                      }
                    : question,
            ),
        }));
    }

    function updateOption(questionIndex, optionIndex, value) {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((question, i) =>
                i === questionIndex
                    ? {
                          ...question,
                          options: question.options.map((option, j) => (j === optionIndex ? value : option)),
                      }
                    : question,
            ),
        }));
    }

    function removeOption(questionIndex, optionIndex) {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((question, i) =>
                i === questionIndex
                    ? {
                          ...question,
                          options: question.options.filter((_, j) => j !== optionIndex),
                      }
                    : question,
            ),
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (!form.title.trim()) {
            setError('Укажи название анкеты.');
            return;
        }

        if (form.questions.length === 0) {
            setError('Добавь хотя бы один вопрос.');
            return;
        }

        for (const [index, question] of form.questions.entries()) {
            if (!question.text.trim()) {
                setError(`Заполни текст вопроса №${index + 1}.`);
                return;
            }

            if (question.type !== 'text') {
                const validOptions = question.options.filter((option) => option.trim());

                if (validOptions.length < 2) {
                    setError(`В вопросе №${index + 1} должно быть минимум два варианта ответа.`);
                    return;
                }
            }
        }

        const newQuestionnaire = {
            localId: `questionnaire-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: form.title.trim(),
            description: form.description.trim(),
            availableFrom: form.availableFrom || null,
            availableUntil: form.availableUntil || null,
            isPublished: false,
            questions: form.questions.map((question, index) => ({
                text: question.text.trim(),
                type: question.type,
                isRequired: question.isRequired,
                sortOrder: index,
                options: question.type === 'text' ? [] : question.options.map((option) => option.trim()).filter(Boolean),
            })),
        };

        onQuestionnairesChange([...questionnaires, newQuestionnaire]);

        setForm(createEmptyForm());
        setError('');
    }

    function removeQuestionnaire(localId) {
        onQuestionnairesChange(questionnaires.filter((questionnaire) => questionnaire.localId !== localId));
    }

    return (
        <main className="questionnaires-admin">
            <div className="questionnaires-admin__header">
                <div className="questionnaires-admin__heading-icon">
                    <ClipboardList size={23} />
                </div>

                <div>
                    <h2>Анкеты мероприятия</h2>
                    <p>Создавайте опросы и собирайте ответы участников</p>
                </div>
            </div>

            <form className="questionnaires-admin__form" onSubmit={handleSubmit}>
                <div className="questionnaires-admin__section-heading">
                    <div>
                        <h3>Новая анкета</h3>
                        <p>Настройте название, сроки проведения и вопросы</p>
                    </div>
                </div>

                {error && (
                    <div className="questionnaires-admin__error" role="alert">
                        <X size={17} />
                        {error}
                    </div>
                )}

                <div className="questionnaires-admin__fields">
                    <label className="questionnaires-admin__field questionnaires-admin__field--full">
                        <span>Название анкеты</span>
                        <input type="text" value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Например, Регистрация участников" maxLength={255} />
                    </label>

                    <label className="questionnaires-admin__field questionnaires-admin__field--full">
                        <span>Описание</span>
                        <textarea
                            value={form.description}
                            onChange={(event) => updateForm('description', event.target.value)}
                            placeholder="Расскажите участникам, для чего нужна эта анкета..."
                            rows={3}
                        />
                    </label>

                    <label className="questionnaires-admin__field">
                        <span>
                            <CalendarDays size={15} />
                            Доступна с
                        </span>
                        <input type="datetime-local" value={form.availableFrom} onChange={(event) => updateForm('availableFrom', event.target.value)} />
                    </label>

                    <label className="questionnaires-admin__field">
                        <span>
                            <CalendarDays size={15} />
                            Доступна до
                        </span>
                        <input type="datetime-local" value={form.availableUntil} onChange={(event) => updateForm('availableUntil', event.target.value)} />
                    </label>
                </div>

                <div className="questionnaires-admin__questions-heading">
                    <div>
                        <h3>Вопросы анкеты</h3>
                        <p>Добавьте вопросы, на которые будут отвечать участники</p>
                    </div>

                    <span className="questionnaires-admin__count">
                        {form.questions.length} {form.questions.length === 1 ? 'вопрос' : form.questions.length < 5 ? 'вопроса' : 'вопросов'}
                    </span>
                </div>

                <div className="questionnaires-admin__questions">
                    {form.questions.map((question, index) => (
                        <article className="questionnaires-admin__question" key={index}>
                            <div className="questionnaires-admin__question-top">
                                <div className="questionnaires-admin__question-number">
                                    <CircleHelp size={17} />
                                    Вопрос {index + 1}
                                </div>

                                <button
                                    type="button"
                                    className="questionnaires-admin__icon-button questionnaires-admin__icon-button--danger"
                                    onClick={() => removeQuestion(index)}
                                    disabled={form.questions.length === 1}
                                    title="Удалить вопрос"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>

                            <label className="questionnaires-admin__field">
                                <span>Текст вопроса</span>
                                <input type="text" value={question.text} onChange={(event) => updateQuestion(index, 'text', event.target.value)} placeholder="Введите формулировку вопроса" />
                            </label>

                            <div className="questionnaires-admin__question-settings">
                                <label className="questionnaires-admin__field">
                                    <span>Тип ответа</span>
                                    <select value={question.type} onChange={(event) => changeQuestionType(index, event.target.value)}>
                                        <option value="text">Свободный текст</option>
                                        <option value="single_choice">Один вариант ответа</option>
                                        <option value="multiple_choice">Несколько вариантов</option>
                                    </select>
                                </label>

                                <label className="questionnaires-admin__required">
                                    <input type="checkbox" checked={question.isRequired} onChange={(event) => updateQuestion(index, 'isRequired', event.target.checked)} />
                                    <span>Обязательный вопрос</span>
                                </label>
                            </div>

                            {question.type !== 'text' && (
                                <div className="questionnaires-admin__options">
                                    <div className="questionnaires-admin__options-heading">
                                        <ListChecks size={17} />
                                        <span>Варианты ответа</span>
                                    </div>

                                    {question.options.map((option, optionIndex) => (
                                        <div className="questionnaires-admin__option" key={optionIndex}>
                                            <span className="questionnaires-admin__option-marker">{optionIndex + 1}</span>

                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(event) => updateOption(index, optionIndex, event.target.value)}
                                                placeholder={`Вариант ответа ${optionIndex + 1}`}
                                            />

                                            <button
                                                type="button"
                                                className="questionnaires-admin__icon-button questionnaires-admin__icon-button--danger"
                                                onClick={() => removeOption(index, optionIndex)}
                                                title="Удалить вариант"
                                            >
                                                <X size={17} />
                                            </button>
                                        </div>
                                    ))}

                                    <button type="button" className="questionnaires-admin__add-option" onClick={() => addOption(index)}>
                                        <Plus size={16} />
                                        Добавить вариант ответа
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </div>

                <div className="questionnaires-admin__form-actions">
                    <button type="button" className="questionnaires-admin__button questionnaires-admin__button--secondary" onClick={addQuestion}>
                        <Plus size={17} />
                        Добавить вопрос
                    </button>

                    <button type="submit" className="questionnaires-admin__button questionnaires-admin__button--primary">
                        <Check size={17} />
                        Добавить анкету
                    </button>
                </div>
            </form>

            <section className="questionnaires-admin__created">
                <div className="questionnaires-admin__section-heading">
                    <div>
                        <h3>Созданные анкеты</h3>
                        <p>Анкеты будут сохранены вместе с мероприятием</p>
                    </div>

                    <span className="questionnaires-admin__count">{questionnaires.length}</span>
                </div>

                {questionnaires.length === 0 ? (
                    <div className="questionnaires-admin__empty">
                        <div className="questionnaires-admin__empty-icon">
                            <ClipboardList size={26} />
                        </div>
                        <strong>Пока нет ни одной анкеты</strong>
                        <p>Создайте первую анкету с помощью формы выше</p>
                    </div>
                ) : (
                    <div className="questionnaires-admin__created-list">
                        {questionnaires.map((questionnaire, index) => (
                            <article className="questionnaires-admin__created-card" key={questionnaire.localId || questionnaire.questionnaireId || index}>
                                <div className="questionnaires-admin__created-icon">
                                    <ClipboardList size={20} />
                                </div>

                                <div className="questionnaires-admin__created-info">
                                    <h4>{questionnaire.title}</h4>
                                    <p>{questionnaire.description || 'Описание не указано'}</p>
                                    <span>{questionnaire.questions?.length || 0} вопросов</span>
                                </div>

                                <div className="questionnaires-admin__created-actions">
                                    <span className="questionnaires-admin__status">Черновик</span>

                                    {questionnaire.localId && (
                                        <button
                                            type="button"
                                            className="questionnaires-admin__icon-button questionnaires-admin__icon-button--danger"
                                            onClick={() => removeQuestionnaire(questionnaire.localId)}
                                            title="Удалить анкету"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
