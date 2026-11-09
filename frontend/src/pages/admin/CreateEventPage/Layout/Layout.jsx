import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // <-- useNavigate убран
import { Check, Save, Send } from 'lucide-react';

import { eventsApi } from '../../../../shared/api/eventsApi';
import ProgramEditor from '../ProgramEditor/ProgramEditor';

import { getEventId, normalizeEvent, normalizePrograms, normalizeScheduleItem, resolveArray } from '../Utils/eventForm.utils';
import { buildBasicInfoPayload } from '../Utils/Payloads/BasicInfo.payload';
import { buildProgramsPayload } from '../Utils/Payloads/Programs.payload';
import { buildSchedulePayload } from '../Utils/Payloads/Schedule.payload';

import './Layout.scss';

const EMPTY_EVENT = { title: '', description: '', startDate: '', endDate: '', status: 'draft' };

function buildPayload(event, schedule, programs) {
    return {
        ...buildBasicInfoPayload(event),
        schedule: buildSchedulePayload(schedule),
        programs: buildProgramsPayload(programs, schedule),
    };
}

export default function Layout() {
    const params = useParams();
    const routeEventId = params.eventId ?? params.id ?? null;

    const [currentEventId, setCurrentEventId] = useState(routeEventId);
    const [event, setEvent] = useState(EMPTY_EVENT);
    const [schedule, setSchedule] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [locations, setLocations] = useState([]);

    const [loading, setLoading] = useState(Boolean(routeEventId));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError('');
            setNotice('');
            setCurrentEventId(routeEventId);
            setEvent(EMPTY_EVENT);
            setSchedule([]);
            setPrograms([]);

            try {
                const locs = await eventsApi.getLocationPlaces();
                if (!active) return;
                setLocations(Array.isArray(locs) ? locs : []);

                if (!routeEventId) return;

                const data = await eventsApi.getForManagement(routeEventId);
                if (!active) return;

                const loadedSchedule = resolveArray(data, 'schedule').map(normalizeScheduleItem);
                const loadedPrograms = normalizePrograms(resolveArray(data, 'programs'), loadedSchedule);

                setEvent(normalizeEvent(data));
                setSchedule(loadedSchedule);
                setPrograms(loadedPrograms);
            } catch (err) {
                if (active) setError(err.message || 'Ошибка загрузки');
            } finally {
                if (active) setLoading(false);
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
            const payload = buildPayload(event, schedule, programs);
            let savedId = currentEventId;

            if (currentEventId) {
                await eventsApi.updateDraft(currentEventId, payload);
            } else {
                const response = await eventsApi.createDraft(payload);
                savedId = getEventId(response);
                if (!savedId) throw new Error('Не удалось получить ID');

                setCurrentEventId(savedId);

                // Меняем URL, не вызывая перемонтирование компонента React Router
                window.history.replaceState(null, '', `/events/${savedId}/edit`);
            }

            if (publish) {
                await eventsApi.publishEvent(savedId);
                setEvent((prev) => ({ ...prev, status: 'published' }));
                setNotice('Мероприятие опубликовано.');
            } else {
                setNotice('Черновик сохранён.');
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
                    <h1>{currentEventId ? 'Редактирование мероприятия' : 'Создание мероприятия'}</h1>
                </div>
            </div>

            {error && <div className="event-editor__alert event-editor__alert--error">{error}</div>}
            {notice && (
                <div className="event-editor__alert event-editor__alert--success">
                    <Check size={18} />
                    {notice}
                </div>
            )}

            <div className="event-editor__workspace">
                <section className="event-editor__panel">
                    <div className="event-editor__tab-content">
                        <ProgramEditor
                            event={event}
                            onEventChange={setEvent}
                            schedule={schedule}
                            programs={programs}
                            onScheduleChange={setSchedule}
                            onProgramsChange={setPrograms}
                            locations={locations}
                        />
                    </div>
                </section>
            </div>

            <footer className="event-editor__bottom-bar">
                <div className="event-editor__bottom-actions">
                    <button type="button" className="event-editor__save" disabled={saving} onClick={() => handleSave(false)}>
                        <Save size={17} />
                        {saving ? 'Сохранение…' : 'Сохранить черновик'}
                    </button>
                    <button type="button" className="event-editor__publish" disabled={saving || event.status === 'published'} onClick={() => handleSave(true)}>
                        <Send size={17} />
                        {saving ? 'Обработка…' : event.status === 'published' ? 'Уже опубликовано' : 'Опубликовать'}
                    </button>
                </div>
            </footer>
        </main>
    );
}
