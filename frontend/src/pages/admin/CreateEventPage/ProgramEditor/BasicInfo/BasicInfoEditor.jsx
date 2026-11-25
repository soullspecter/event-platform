import './BasicInfoEditor.scss';
import '../ProgramEditor/ProgramEditor.scss';
import ImportDocumentButton from '../components/ImportDocumentButton';
export default function BasicInfoEditor({ event, onEventChange }) {
    const update = (field, value) => onEventChange((current) => ({ ...current, [field]: value }));

    return (
        <section className="basic-info-editor">
            <div className="basic-info-editor__section">
                <ImportDocumentButton
                    onImported={(eventId) => {
                        window.location.href = `/events/${eventId}/edit`;
                    }}
                />

                <div className="field">
                    <label htmlFor="event-title">Название мероприятия</label>
                    <input id="event-title" maxLength={255} value={event.title ?? ''} onChange={(e) => update('title', e.target.value)} placeholder="Например, МОСТ-2026" />
                </div>

                <div className="field">
                    <label htmlFor="event-description">Описание мероприятия</label>
                    <textarea
                        id="event-description"
                        rows={5}
                        value={event.description ?? ''}
                        onChange={(e) => update('description', e.target.value)}
                        placeholder="Расскажите, чему посвящено мероприятие..."
                    />
                </div>

                <div className="field-row field-row--2">
                    <div className="field">
                        <label htmlFor="event-start-date">Дата начала</label>
                        <input id="event-start-date" type="date" value={event.startDate ?? ''} max={event.endDate || undefined} onChange={(e) => update('startDate', e.target.value)} />
                    </div>
                    <div className="field">
                        <label htmlFor="event-end-date">Дата окончания</label>
                        <input id="event-end-date" type="date" value={event.endDate ?? ''} min={event.startDate || undefined} onChange={(e) => update('endDate', e.target.value)} />
                    </div>
                </div>

                {event.startDate && event.endDate && event.endDate < event.startDate && <p className="basic-info-editor__error">Дата окончания не может быть раньше даты начала.</p>}
            </div>
        </section>
    );
}
