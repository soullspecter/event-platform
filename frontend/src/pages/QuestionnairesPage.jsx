import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Ошибка запроса');
  }

  return data;
}

export default function QuestionnairesPage() {
  const { eventId } = useParams();

  const [questionnaires, setQuestionnaires] = useState([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({});

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadQuestionnaires();
  }, [eventId]);

  async function loadQuestionnaires() {
    try {
      setLoading(true);

      const data = await apiRequest(
        `/questionnaires/available/${eventId}`,
      );

      setQuestionnaires(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateTextAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        textValue: value,
        optionIds: [],
      },
    }));
  }

  function updateSingleChoice(questionId, optionId) {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        textValue: null,
        optionIds: [Number(optionId)],
      },
    }));
  }

  function updateMultipleChoice(questionId, optionId, checked) {
    setAnswers((current) => {
      const previous = current[questionId]?.optionIds || [];

      const optionIds = checked
        ? [...previous, Number(optionId)]
        : previous.filter((id) => id !== Number(optionId));

      return {
        ...current,
        [questionId]: {
          textValue: null,
          optionIds,
        },
      };
    });
  }

  async function submitQuestionnaire(event) {
    event.preventDefault();

    if (!selectedQuestionnaire) return;

    setError('');
    setSuccess('');

    const questions = selectedQuestionnaire.questions || [];

    for (const question of questions) {
      const answer = answers[question.questionId];

      if (!question.isRequired) continue;

      if (question.type === 'text') {
        if (!answer?.textValue?.trim()) {
          setError(`Ответь на обязательный вопрос: ${question.text}`);
          return;
        }
      } else if (!answer?.optionIds?.length) {
        setError(`Выбери вариант ответа: ${question.text}`);
        return;
      }
    }

    const payload = {
      answers: questions
        .filter((question) => answers[question.questionId])
        .map((question) => ({
          questionId: question.questionId,
          textValue:
            question.type === 'text'
              ? answers[question.questionId].textValue
              : null,
          optionIds:
            question.type === 'text'
              ? []
              : answers[question.questionId].optionIds || [],
        })),
    };

    try {
      setSending(true);

      await apiRequest(
        `/questionnaires/${selectedQuestionnaire.questionnaireId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      setSuccess('Ответы успешно отправлены');
      setSelectedQuestionnaire(null);
      setAnswers({});

      await loadQuestionnaires();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <main>Загрузка анкет...</main>;
  }

  if (selectedQuestionnaire) {
    return (
      <main className="questionnaire-form">
        <button
          type="button"
          onClick={() => {
            setSelectedQuestionnaire(null);
            setAnswers({});
            setError('');
          }}
        >
          Назад к анкетам
        </button>

        <h1>{selectedQuestionnaire.title}</h1>
        <p>{selectedQuestionnaire.description}</p>

        {error && <div role="alert">{error}</div>}
        {success && <div role="status">{success}</div>}

        <form onSubmit={submitQuestionnaire}>
          {(selectedQuestionnaire.questions || []).map((question) => (
            <fieldset key={question.questionId}>
              <legend>
                {question.text}
                {question.isRequired && ' *'}
              </legend>

              {question.type === 'text' && (
                <textarea
                  value={answers[question.questionId]?.textValue || ''}
                  onChange={(event) =>
                    updateTextAnswer(
                      question.questionId,
                      event.target.value,
                    )
                  }
                  required={question.isRequired}
                />
              )}

              {question.type === 'single_choice' &&
                (question.options || []).map((option) => (
                  <label key={option.optionId}>
                    <input
                      type="radio"
                      name={`question-${question.questionId}`}
                      value={option.optionId}
                      checked={
                        answers[question.questionId]?.optionIds?.[0] ===
                        option.optionId
                      }
                      onChange={() =>
                        updateSingleChoice(
                          question.questionId,
                          option.optionId,
                        )
                      }
                    />
                    {option.optionText}
                  </label>
                ))}

              {question.type === 'multiple_choice' &&
                (question.options || []).map((option) => (
                  <label key={option.optionId}>
                    <input
                      type="checkbox"
                      checked={(
                        answers[question.questionId]?.optionIds || []
                      ).includes(option.optionId)}
                      onChange={(event) =>
                        updateMultipleChoice(
                          question.questionId,
                          option.optionId,
                          event.target.checked,
                        )
                      }
                    />
                    {option.optionText}
                  </label>
                ))}
            </fieldset>
          ))}

          <button type="submit" disabled={sending}>
            {sending ? 'Отправка...' : 'Отправить ответы'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="questionnaires-page">
      <h1>Анкеты мероприятия</h1>

      {error && <div role="alert">{error}</div>}
      {success && <div role="status">{success}</div>}

      {questionnaires.length === 0 ? (
        <p>Сейчас нет доступных анкет.</p>
      ) : (
        <div>
          {questionnaires.map((questionnaire) => (
            <article key={questionnaire.questionnaireId}>
              <h2>{questionnaire.title}</h2>
              <p>{questionnaire.description}</p>

              <button
                type="button"
                onClick={() => {
                  setSelectedQuestionnaire(questionnaire);
                  setAnswers({});
                  setError('');
                  setSuccess('');
                }}
              >
                Пройти анкету
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}