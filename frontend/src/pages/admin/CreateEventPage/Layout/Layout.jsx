import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Save, Send, Info, List, ClipboardList } from 'lucide-react';

import { eventsApi } from '../../../../shared/api/eventsApi';
import BasicInfoEditor from '../ProgramEditor/BasicInfo/BasicInfoEditor';
import ProgramEditor from '../ProgramEditor/ProgramEditor/ProgramEditor';
import QuestionnairesAdminPage from '../ProgramEditor/QuestionnairesEditor/QuestionnairesEditor';

import { getEventId, normalizeEvent, normalizePrograms, normalizeCommonSchedule } from '../Utils/eventForm.utils';

import { buildEventPayload } from '../Utils/Payloads/Event.payload';

import './Layout.scss';

const EMPTY_EVENT = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft',
};

function normalizeDate(value) {
    if (!value) return '';

    const dateString = String(value).trim();

    if (!dateString) return '';

    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!match) return '';

    const [, year, month, day] = match;

    const y = Number(year);
    const m = Number(month);
    const d = Number(day);

    const date = new Date(Date.UTC(y, m - 1, d));

    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
        return '';
    }

    return `${year}-${month}-${day}`;
}

// Форматирование даты для интерфейса.
function formatDate(value) {
    const normalized = normalizeDate(value);

    if (!normalized) return '';

    const [year, month, day] = normalized.split('-').map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });
}

// Получение всех дат мероприятия.
function getEventDates(startDate, endDate) {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    if (!start || !end || end < start) {
        return [];
    }

    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);

    const startTimestamp = Date.UTC(sy, sm - 1, sd);
    const endTimestamp = Date.UTC(ey, em - 1, ed);

    const result = [];

    for (let current = startTimestamp; current <= endTimestamp; current += 86400000) {
        result.push(new Date(current).toISOString().slice(0, 10));
    }

    return result;
}

export default function Layout() {
    const params = useParams();

    const routeEventId = params.eventId ?? params.id ?? null;

    const [currentEventId, setCurrentEventId] = useState(routeEventId);

    const [event, setEvent] = useState(EMPTY_EVENT);
    const [programs, setPrograms] = useState([]);
    const [commonSchedule, setCommonSchedule] = useState([]);
    const [locations, setLocations] = useState([]);

    const [activeTab, setActiveTab] = useState('basic');
    const [activeProgramDate, setActiveProgramDate] = useState('');

    const [loading, setLoading] = useState(Boolean(routeEventId));
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    // Даты мероприятия.
    const dates = getEventDates(event.startDate, event.endDate);

    const selectedProgramDate = dates.includes(activeProgramDate) ? activeProgramDate : dates[0] || '';

    // Загрузка мероприятия.
    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);

            setError('');
            setNotice('');

            setCurrentEventId(routeEventId);

            setEvent(EMPTY_EVENT);
            setPrograms([]);
            setCommonSchedule([]);
            setActiveProgramDate('');

            try {
                const [places, data] = await Promise.all([eventsApi.getLocationPlaces(), routeEventId ? eventsApi.getForManagement(routeEventId) : Promise.resolve(null)]);

                if (!active) return;

                setLocations(Array.isArray(places) ? places : []);

                if (data) {
                    setEvent({
                        ...normalizeEvent(data),
                        questionnaires: data.questionnaires || [],
                    });

                    setPrograms(normalizePrograms(data.programs));
                    setCommonSchedule(normalizeCommonSchedule(data.commonScheduleByDate));
                }
            } catch (err) {
                if (active) {
                    setError(err.message || 'Ошибка загрузки');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [routeEventId]);

    // Сохранение черновика или публикация.
    async function handleSave(publish = false) {
        if (saving) return;

        setError('');
        setNotice('');
        setSaving(true);

        try {
            const payload = buildEventPayload({
                event,
                programs,
                commonSchedule,
            });

            let savedId = currentEventId;
            let savedData;

            // Сначала сохраняем все изменения.
            if (currentEventId) {
                savedData = await eventsApi.updateDraft(currentEventId, payload);
            } else {
                savedData = await eventsApi.createDraft(payload);

                savedId = getEventId(savedData);

                if (!savedId) {
                    throw new Error('Backend не вернул ID созданного мероприятия');
                }

                setCurrentEventId(savedId);

                window.history.replaceState(null, '', `/events/${savedId}/edit`);
            }

            // Затем публикуем мероприятие.
            if (publish) {
                await eventsApi.publishEvent(savedId);

                setEvent((prev) => ({
                    ...prev,
                    status: 'published',
                }));

                setNotice('Изменения сохранены. Мероприятие опубликовано.');
            } else {
                setNotice('Изменения сохранены.');
            }
        } catch (err) {
            setError(err.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="event-editor__loading">
                <span className="event-editor__spinner" />
                Загрузка...
            </div>
        );
    }

    return (
        <main className="event-editor">
            {/* Заголовок */}
            <div className="event-editor__top">
                <div className="event-editor__heading">
                    <h1>{currentEventId ? 'Редактирование мероприятия' : 'Создание мероприятия'}</h1>
                </div>
            </div>

            {/* Ошибка */}
            {error && <div className="event-editor__alert event-editor__alert--error">{error}</div>}

            {/* Уведомление */}
            {notice && (
                <div className="event-editor__alert event-editor__alert--success">
                    <Check size={18} />
                    {notice}
                </div>
            )}

            {/* Основные вкладки */}
            <div className="event-editor__tabs">
                <button type="button" className={`event-editor__tab ${activeTab === 'basic' ? 'is-active' : ''}`} onClick={() => setActiveTab('basic')}>
                    <Info size={18} />
                    <span className="event-editor__tab-label">Основная информация</span>
                </button>

                <button type="button" className={`event-editor__tab ${activeTab === 'program' ? 'is-active' : ''}`} onClick={() => setActiveTab('program')}>
                    <List size={18} />
                    <span className="event-editor__tab-label">Программа</span>
                </button>

                <button type="button" className={`event-editor__tab ${activeTab === 'questionnaires' ? 'is-active' : ''}`} onClick={() => setActiveTab('questionnaires')}>
                    <ClipboardList size={18} />
                    <span className="event-editor__tab-label">Анкеты</span>
                </button>
            </div>

            {/* Выбор даты программы */}
            {activeTab === 'program' && dates.length > 0 && (
                <div className="event-editor__date-tabs" aria-label="Даты мероприятия">
                    {dates.map((date) => (
                        <button type="button" key={date} className={selectedProgramDate === date ? 'is-active' : ''} onClick={() => setActiveProgramDate(date)}>
                            {formatDate(date)}
                        </button>
                    ))}
                </div>
            )}

            {/* Рабочая область */}
            <div className="event-editor__workspace">
                <section className="event-editor__panel">
                    <div className="event-editor__tab-content">
                        {activeTab === 'basic' && <BasicInfoEditor event={event} onEventChange={setEvent} />}

                        {activeTab === 'program' && (
                            <ProgramEditor
                                event={event}
                                dates={dates}
                                selectedDate={selectedProgramDate}
                                programs={programs}
                                onProgramsChange={setPrograms}
                                commonSchedule={commonSchedule}
                                onCommonScheduleChange={setCommonSchedule}
                                locations={locations}
                            />
                        )}

                        {activeTab === 'questionnaires' && (
                            <QuestionnairesAdminPage
                                eventId={currentEventId}
                                event={event}
                                questionnaires={event.questionnaires || []}
                                onQuestionnairesChange={(questionnaires) =>
                                    setEvent((prev) => ({
                                        ...prev,
                                        questionnaires,
                                    }))
                                }
                            />
                        )}
                    </div>
                </section>
            </div>

            {/* Нижняя панель действий */}
            <footer className="event-editor__bottom-bar">
                <div className="event-editor__bottom-actions">
                    <button type="button" className="event-editor__save" disabled={saving} onClick={() => handleSave(false)}>
                        <Save size={17} />
                        {saving ? 'Сохранение…' : 'Сохранить черновик'}
                    </button>

                    <button type="button" className="event-editor__publish" disabled={saving} onClick={() => handleSave(true)}>
                        <Send size={17} />
                        {saving ? 'Публикация…' : 'Опубликовать'}
                    </button>
                </div>
            </footer>
        </main>
    );
}
