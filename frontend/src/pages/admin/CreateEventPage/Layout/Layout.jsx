
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Check,
    Save,
    Send,
    Info,
    List,
    ClipboardList,
} from 'lucide-react';

import { eventsApi } from '../../../../shared/api/eventsApi';
import BasicInfoEditor from '../ProgramEditor/BasicInfo/BasicInfoEditor';
import ProgramEditor from '../ProgramEditor/ProgramEditor/ProgramEditor';
import QuestionnairesAdminPage from '../../QuestionnairesAdminPage.jsx';

import {
    getEventId,
    normalizeEvent,
    normalizePrograms,
    normalizeCommonSchedule,
} from '../Utils/eventForm.utils';

import { buildEventPayload } from '../Utils/Payloads/Event.payload';

import './Layout.scss';

const EMPTY_EVENT = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft',
};

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

    const dates = (() => {
        const { startDate, endDate } = event;

        if (!startDate || !endDate || endDate < startDate) {
            return [];
        }

        const result = [];

        const [sy, sm, sd] = startDate.split('-').map(Number);
        const [ey, em, ed] = endDate.split('-').map(Number);

        const start = Date.UTC(sy, sm - 1, sd);
        const end = Date.UTC(ey, em - 1, ed);

        for (let current = start; current <= end; current += 86400000) {
            result.push(new Date(current).toISOString().slice(0, 10));
        }

        return result;
    })();

    const selectedProgramDate = dates.includes(activeProgramDate)
        ? activeProgramDate
        : dates[0] || '';

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
                const [places, data] = await Promise.all([
                    eventsApi.getLocationPlaces(),
                    routeEventId
                        ? eventsApi.getForManagement(routeEventId)
                        : Promise.resolve(null),
                ]);

                if (!active) return;

                setLocations(Array.isArray(places) ? places : []);

                if (data) {
                    setEvent(normalizeEvent(data));
                    setPrograms(normalizePrograms(data.programs));
                    setCommonSchedule(
                        normalizeCommonSchedule(data.commonScheduleByDate),
                    );
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

            if (currentEventId) {
                savedData = await eventsApi.updateDraft(
                    currentEventId,
                    payload,
                );
            } else {
                savedData = await eventsApi.createDraft(payload);
                savedId = getEventId(savedData);

                if (!savedId) {
                    throw new Error(
                        'Backend не вернул ID созданного мероприятия',
                    );
                }

                setCurrentEventId(savedId);

                window.history.replaceState(
                    null,
                    '',
                    `/events/${savedId}/edit`,
                );
            }

            if (publish) {
                await eventsApi.publishEvent(savedId);

                setEvent((prev) => ({
                    ...prev,
                    status: 'published',
                }));

                setNotice('Мероприятие опубликовано.');
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
            <div className="event-editor__top">
                <div className="event-editor__heading">
                    <h1>
                        {currentEventId
                            ? 'Редактирование мероприятия'
                            : 'Создание мероприятия'}
                    </h1>
                </div>
            </div>

            {error && (
                <div className="event-editor__alert event-editor__alert--error">
                    {error}
                </div>
            )}

            {notice && (
                <div className="event-editor__alert event-editor__alert--success">
                    <Check size={18} />
                    {notice}
                </div>
            )}

            <div className="event-editor__tabs">
                <button
                    type="button"
                    className={`event-editor__tab ${
                        activeTab === 'basic' ? 'is-active' : ''
                    }`}
                    onClick={() => setActiveTab('basic')}
                >
                    <Info size={18} />
                    <span className="event-editor__tab-label">
                        Основная информация
                    </span>
                </button>

                <button
                    type="button"
                    className={`event-editor__tab ${
                        activeTab === 'program' ? 'is-active' : ''
                    }`}
                    onClick={() => setActiveTab('program')}
                >
                    <List size={18} />
                    <span className="event-editor__tab-label">
                        Программа
                    </span>
                </button>

                <button
                    type="button"
                    className={`event-editor__tab ${
                        activeTab === 'questionnaires' ? 'is-active' : ''
                    }`}
                    onClick={() => setActiveTab('questionnaires')}
                >
                    <ClipboardList size={18} />
                    <span className="event-editor__tab-label">
                        Анкеты
                    </span>
                </button>
            </div>

            {activeTab === 'program' && dates.length > 0 && (
                <div
                    className="event-editor__date-tabs"
                    aria-label="Даты мероприятия"
                >
                    {dates.map((date) => (
                        <button
                            type="button"
                            key={date}
                            className={
                                selectedProgramDate === date
                                    ? 'is-active'
                                    : ''
                            }
                            onClick={() => setActiveProgramDate(date)}
                        >
                            {new Date(`${date}T12:00:00}`).toLocaleDateString(
                                'ru-RU',
                                {
                                    day: 'numeric',
                                    month: 'short',
                                },
                            )}
                        </button>
                    ))}
                </div>
            )}

            <div className="event-editor__workspace">
                <section className="event-editor__panel">
                    <div className="event-editor__tab-content">
                        {activeTab === 'basic' && (
                            <BasicInfoEditor
                                event={event}
                                onEventChange={setEvent}
                            />
                        )}

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

            <footer className="event-editor__bottom-bar">
                <div className="event-editor__bottom-actions">
                    <button
                        type="button"
                        className="event-editor__save"
                        disabled={saving}
                        onClick={() => handleSave(false)}
                    >
                        <Save size={17} />
                        {saving
                            ? 'Сохранение…'
                            : 'Сохранить черновик'}
                    </button>

                    <button
                        type="button"
                        className="event-editor__publish"
                        disabled={
                            saving || event.status === 'published'
                        }
                        onClick={() => handleSave(true)}
                    >
                        <Send size={17} />
                        {saving
                            ? 'Обработка…'
                            : event.status === 'published'
                                ? 'Уже опубликовано'
                                : 'Опубликовать'}
                    </button>
                </div>
            </footer>
        </main>
    );
}
