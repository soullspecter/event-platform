import { useState } from 'react';
import { MapPin, Plus, Trash2, X } from 'lucide-react';

import { createClientId } from '../Utils/eventForm.utils';
import './ProgramEditor.scss';

function createEmptyCard(startDate) {
    return {
        clientId: createClientId('schedule'),
        scheduleItemId: null,
        name: '',
        itemDate: startDate || '',
        startTime: '',
        endTime: '',
    };
}

function createEmptyProgram(scheduleItemClientId) {
    return {
        clientId: createClientId('program'),
        programId: null,
        name: '',
        description: '',
        locationId: null,
        manualLocation: null,
        scheduleItemClientId,
    };
}

function createManualLocation() {
    return { name: '', place: '', address: '' };
}

export default function ProgramEditor({ event, onEventChange, schedule, programs, onScheduleChange, onProgramsChange, locations = [] }) {
    const [activeDate, setActiveDate] = useState('');
    const [manualFor, setManualFor] = useState(null);
    const [manualForm, setManualForm] = useState(createManualLocation);

    const datesSet = new Set();
    if (event?.startDate && event?.endDate) {
        const [sy, sm, sd] = event.startDate.split('-').map(Number);
        const [ey, em, ed] = event.endDate.split('-').map(Number);
        const start = Date.UTC(sy, sm - 1, sd);
        const end = Date.UTC(ey, em - 1, ed);
        if (start <= end) {
            for (let cur = start; cur <= end; cur += 86400000) {
                datesSet.add(new Date(cur).toISOString().slice(0, 10));
            }
        }
    } else {
        if (event?.startDate) datesSet.add(event.startDate);
        if (event?.endDate) datesSet.add(event.endDate);
    }
    schedule.forEach((c) => c.itemDate && datesSet.add(c.itemDate));
    const dates = [...datesSet].sort();

    const selectedDate = dates.includes(activeDate) ? activeDate : dates[0] || '';
    if (selectedDate !== activeDate) setActiveDate(selectedDate);

    const visibleCards = schedule.filter((c) => c.itemDate === selectedDate);

    const countsByDate = {};
    for (const c of schedule) {
        if (c.itemDate) countsByDate[c.itemDate] = (countsByDate[c.itemDate] || 0) + 1;
    }

    function changeDate(date) {
        setActiveDate(date);
        closeManual();
    }

    function addCard() {
        if (!selectedDate) return;
        onScheduleChange((prev) => [...prev, createEmptyCard(selectedDate)]);
    }

    function removeCard(clientId) {
        onScheduleChange((prev) => prev.filter((c) => c.clientId !== clientId));
        onProgramsChange((prev) => prev.filter((p) => p.scheduleItemClientId !== clientId));
        if (manualFor?.cardClientId === clientId) closeManual();
    }

    function updateCard(clientId, changes) {
        onScheduleChange((prev) => prev.map((c) => (c.clientId === clientId ? { ...c, ...changes } : c)));
        if (changes.itemDate && changes.itemDate !== selectedDate) changeDate(changes.itemDate);
    }

    function updateProgram(programClientId, changes) {
        onProgramsChange((prev) => prev.map((p) => (p.clientId === programClientId ? { ...p, ...changes } : p)));
    }

    function addProgramToCard(cardClientId) {
        onProgramsChange((prev) => [...prev, createEmptyProgram(cardClientId)]);
    }

    function removeProgram(programClientId) {
        onProgramsChange((prev) => prev.filter((p) => p.clientId !== programClientId));
        if (manualFor?.programClientId === programClientId) closeManual();
    }

    function openManualFor(cardClientId, programClientId) {
        setManualFor({ cardClientId, programClientId });
        setManualForm(createManualLocation());
    }

    function closeManual() {
        setManualFor(null);
        setManualForm(createManualLocation());
    }

    function addManualLocation(cardClientId, programClientId) {
        if (!manualForm.place.trim() && !manualForm.name.trim()) return;

        updateProgram(programClientId, {
            manualLocation: {
                type: 'manual',
                name: manualForm.name.trim(),
                place: manualForm.place.trim(),
                address: manualForm.address.trim(),
            },
            locationId: null,
        });

        closeManual();
    }

    function getLocationLabel(loc) {
        return [loc.place, loc.location?.name, loc.location?.address].filter(Boolean).join(', ') || `Площадка #${loc.locationPlaceId}`;
    }

    return (
        <div className="program-editor">
            <section className="program-editor__basic">
                <div className="field">
                    <label>Название мероприятия</label>
                    <input value={event.title} onChange={(e) => onEventChange({ ...event, title: e.target.value })} placeholder="МОСТ-2025" />
                </div>

                <div className="field">
                    <label>Описание мероприятия</label>
                    <textarea
                        rows={4}
                        value={event.description || ''}
                        onChange={(e) => onEventChange({ ...event, description: e.target.value })}
                        placeholder="Расскажите, чему посвящено мероприятие, для кого оно и что ждёт участников…"
                    />
                </div>

                <div className="field-row field-row--2">
                    <div className="field">
                        <label>Дата начала</label>
                        <input type="date" value={event.startDate} onChange={(e) => onEventChange({ ...event, startDate: e.target.value })} />
                    </div>
                    <div className="field">
                        <label>Дата окончания</label>
                        <input type="date" value={event.endDate} onChange={(e) => onEventChange({ ...event, endDate: e.target.value })} />
                    </div>
                </div>
            </section>

            {dates.length === 0 ? (
                <div className="program-editor__empty">
                    <h3>Укажите даты мероприятия, чтобы начать заполнять программу</h3>
                </div>
            ) : (
                <>
                    <div className="program-editor__tabs">
                        {dates.map((date, index) => (
                            <button type="button" key={date} className={`program-editor__tab ${selectedDate === date ? 'is-active' : ''}`} onClick={() => changeDate(date)}>
                                <span className="program-editor__tab-num">{String(index + 1).padStart(2, '0')}</span>
                                <span className="program-editor__tab-body">
                                    <strong>
                                        {new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </strong>
                                    <small>{countsByDate[date] ?? 0} пунктов</small>
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="program-editor__list">
                        {visibleCards.map((card, cardIndex) => {
                            const cardPrograms = programs.filter((p) => p.scheduleItemClientId === card.clientId);

                            return (
                                <div className="program-card-wrapper" key={card.clientId}>
                                    <div className="program-card__number">{String(cardIndex + 1).padStart(2, '0')}</div>

                                    <article className="program-card">
                                        <header className="program-card__header">
                                            <div className="field program-card__title-field" style={{ flex: 1 }}>
                                                <label>Название пункта (например, Официальное открытие)</label>
                                                <input
                                                    type="text"
                                                    value={card.name || ''}
                                                    onChange={(e) => updateCard(card.clientId, { name: e.target.value })}
                                                    placeholder="Оставьте пустым, если это просто слот для программ"
                                                    style={{ marginBottom: 16 }}
                                                />

                                                <label>Время проведения</label>
                                                <div className="field-row field-row--2" style={{ marginBottom: 0 }}>
                                                    <input type="time" value={card.startTime || ''} onChange={(e) => updateCard(card.clientId, { startTime: e.target.value })} />
                                                    <input type="time" value={card.endTime || ''} onChange={(e) => updateCard(card.clientId, { endTime: e.target.value })} />
                                                </div>
                                            </div>

                                            <button type="button" className="program-card__remove" onClick={() => removeCard(card.clientId)} aria-label="Удалить пункт">
                                                <Trash2 size={16} />
                                            </button>
                                        </header>

                                        <div className="program-card__programs">
                                            <div className="program-card__programs-heading">
                                                <h4>События / Программы</h4>
                                                <span className="program-card__programs-count">{cardPrograms.length}</span>
                                            </div>

                                            {cardPrograms.map((program, programIndex) => {
                                                const isManualOpen = manualFor?.cardClientId === card.clientId && manualFor?.programClientId === program.clientId;
                                                const selectedLoc = program.locationId ? locations.find((l) => l.locationPlaceId === program.locationId) : null;

                                                return (
                                                    <div className="program-item" key={program.clientId}>
                                                        <header className="program-item__header">
                                                            <h5 className="program-item__title">Событие {String(programIndex + 1).padStart(2, '0')}</h5>
                                                            <button type="button" className="program-item__remove" onClick={() => removeProgram(program.clientId)} aria-label="Удалить событие">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </header>

                                                        <div className="field">
                                                            <label>Название события</label>
                                                            <input
                                                                value={program.name || ''}
                                                                onChange={(e) => updateProgram(program.clientId, { name: e.target.value })}
                                                                placeholder="Например: Площадка «Молодёжь. Служение Отечеству»"
                                                            />
                                                        </div>

                                                        <div className="field">
                                                            <label>Описание (спикеры, модераторы)</label>
                                                            <textarea
                                                                rows={3}
                                                                value={program.description || ''}
                                                                onChange={(e) => updateProgram(program.clientId, { description: e.target.value })}
                                                                placeholder="Спикер: Егор Бероев. Модератор: Екатерина Шилова..."
                                                            />
                                                        </div>

                                                        <div className="field">
                                                            <label>Площадка проведения</label>

                                                            {program.locationId ? (
                                                                <div className="program-item__location-selected">
                                                                    <MapPin size={14} />
                                                                    <span>{selectedLoc ? getLocationLabel(selectedLoc) : `Площадка #${program.locationId}`}</span>
                                                                    <button type="button" onClick={() => updateProgram(program.clientId, { locationId: null })} aria-label="Убрать площадку">
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ) : program.manualLocation ? (
                                                                <div className="program-item__location-selected">
                                                                    <MapPin size={14} />
                                                                    <span>
                                                                        {[program.manualLocation.name, program.manualLocation.place, program.manualLocation.address].filter(Boolean).join(', ') ||
                                                                            'Новая площадка'}
                                                                    </span>
                                                                    <button type="button" onClick={() => updateProgram(program.clientId, { manualLocation: null })} aria-label="Убрать площадку">
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="program-item__location-actions">
                                                                        <select
                                                                            value=""
                                                                            onChange={(e) => {
                                                                                if (e.target.value) {
                                                                                    updateProgram(program.clientId, {
                                                                                        locationId: Number(e.target.value),
                                                                                        manualLocation: null,
                                                                                    });
                                                                                }
                                                                            }}
                                                                        >
                                                                            <option value="">— выбрать из списка —</option>
                                                                            {locations.map((loc) => (
                                                                                <option key={loc.locationPlaceId} value={loc.locationPlaceId}>
                                                                                    {getLocationLabel(loc)}
                                                                                </option>
                                                                            ))}
                                                                        </select>

                                                                        <button type="button" className="program-item__add-location" onClick={() => openManualFor(card.clientId, program.clientId)}>
                                                                            <Plus size={14} />
                                                                            Добавить площадку
                                                                        </button>
                                                                    </div>

                                                                    {isManualOpen && (
                                                                        <div className="program-item__manual-form">
                                                                            <div className="program-item__manual-heading">
                                                                                <span>Новая площадка</span>
                                                                                <button type="button" onClick={closeManual}>
                                                                                    <X size={14} />
                                                                                </button>
                                                                            </div>
                                                                            <input
                                                                                value={manualForm.name}
                                                                                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                                                                                placeholder="Название локации (например, Музейный комплекс)"
                                                                            />
                                                                            <input
                                                                                value={manualForm.place}
                                                                                onChange={(e) => setManualForm({ ...manualForm, place: e.target.value })}
                                                                                placeholder="Место/Площадка (например, Холл)"
                                                                            />
                                                                            <input
                                                                                value={manualForm.address}
                                                                                onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                                                                                placeholder="Адрес (например, ул. Советская, 63)"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => addManualLocation(card.clientId, program.clientId)}
                                                                                disabled={!manualForm.place.trim() && !manualForm.name.trim()}
                                                                            >
                                                                                Сохранить площадку
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <button type="button" className="program-card__add-program" onClick={() => addProgramToCard(card.clientId)}>
                                                <Plus size={16} /> Добавить событие
                                            </button>
                                        </div>
                                    </article>
                                </div>
                            );
                        })}
                    </div>

                    <button type="button" className="program-editor__add" onClick={addCard}>
                        <Plus size={18} /> Добавить пункт программы
                    </button>
                </>
            )}
        </div>
    );
}
