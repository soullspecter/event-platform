import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { createClientId } from '../../Utils/eventForm.utils';

import './ProgramEditor.scss';

function createEmptySlot(date) {
    return {
        clientId: createClientId('slot'),
        scheduleItemId: null,
        names: [''],
        itemDate: date || '',
        startTime: '',
        endTime: '',
        locationPlaceId: null,
        manualLocation: null,
    };
}

function createEmptyProgram(date) {
    return {
        clientId: createClientId('program'),
        programId: null,
        name: '',
        description: '',
        schedule: [createEmptySlot(date)],
    };
}

function createEmptyCommon(date) {
    return {
        clientId: createClientId('common'),
        commonItemId: null,
        name: '',
        itemDate: date || '',
        startTime: '',
        endTime: '',
        locationPlaceId: null,
        manualLocation: null,
    };
}

function getSlotNames(slot) {
    if (Array.isArray(slot.names)) {
        return slot.names;
    }

    // Поддержка старых данных, где было одно поле name.
    return slot.name ? [slot.name] : [];
}

function LocationEditor({ value, manualLocation, onChange, locations }) {
    const mode = manualLocation ? 'manual' : 'existing';

    const getLocationLabel = (loc) => [loc.place, loc.location?.name, loc.location?.address].filter(Boolean).join(' · ') || `Площадка #${loc.locationPlaceId}`;

    function chooseMode(nextMode) {
        if (nextMode === 'existing') {
            onChange({
                locationPlaceId: null,
                manualLocation: null,
            });
        } else {
            onChange({
                locationPlaceId: null,
                manualLocation: {
                    name: '',
                    address: '',
                    place: '',
                },
            });
        }
    }

    function updateManualLocation(field, fieldValue) {
        onChange({
            locationPlaceId: null,
            manualLocation: {
                ...(manualLocation ?? {}),
                [field]: fieldValue,
            },
        });
    }

    return (
        <div className="location-editor">
            <div className="location-editor__heading">
                <label>Площадка проведения</label>

                <div className="location-editor__switch">
                    <button type="button" className={mode === 'existing' ? 'is-active' : ''} onClick={() => chooseMode('existing')}>
                        Из списка
                    </button>

                    <button type="button" className={mode === 'manual' ? 'is-active' : ''} onClick={() => chooseMode('manual')}>
                        Новая площадка
                    </button>
                </div>
            </div>

            {mode === 'existing' ? (
                <select
                    value={value || ''}
                    onChange={(e) =>
                        onChange({
                            locationPlaceId: e.target.value ? Number(e.target.value) : null,
                            manualLocation: null,
                        })
                    }
                >
                    <option value="">— без площадки —</option>

                    {locations.map((loc) => (
                        <option key={loc.locationPlaceId} value={loc.locationPlaceId}>
                            {getLocationLabel(loc)}
                        </option>
                    ))}
                </select>
            ) : (
                <div className="location-editor__manual">
                    <div className="field">
                        <label>Название места / организации</label>

                        <input value={manualLocation?.name ?? ''} onChange={(e) => updateManualLocation('name', e.target.value)} placeholder="Например, Конференц-центр" />
                    </div>

                    <div className="field">
                        <label>Адрес</label>

                        <input value={manualLocation?.address ?? ''} onChange={(e) => updateManualLocation('address', e.target.value)} placeholder="Улица, дом, город" />
                    </div>

                    <div className="field">
                        <label>Название площадки / помещения</label>

                        <input value={manualLocation?.place ?? ''} onChange={(e) => updateManualLocation('place', e.target.value)} placeholder="Например, Большой зал" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProgramEditor({ event, dates = [], selectedDate = '', programs = [], onProgramsChange, commonSchedule = [], onCommonScheduleChange, locations = [] }) {
    const [selectedId, setSelectedId] = useState(null);
    const [selectedType, setSelectedType] = useState('program');
    const [selectedCommonIds, setSelectedCommonIds] = useState([]);

    const selectedProgram = programs.find((program) => program.clientId === selectedId);

    const commonForDate = commonSchedule.filter((item) => item.itemDate === selectedDate).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    const isCommonSelected = selectedType === 'common';

    const selectedCommonItems = isCommonSelected ? commonSchedule.filter((item) => selectedCommonIds.includes(item.clientId)) : [];

    const programsForDate = programs.filter((program) => (program.schedule ?? []).length === 0 || (program.schedule ?? []).some((slot) => slot.itemDate === selectedDate));

    function addProgram() {
        const item = createEmptyProgram(selectedDate);

        onProgramsChange((current) => [...current, item]);

        setSelectedType('program');
        setSelectedId(item.clientId);
    }

    function addCommon() {
        if (!selectedDate) return;

        setSelectedType('common');
        setSelectedId(selectedDate);
        setSelectedCommonIds(commonForDate.map((item) => item.clientId));
    }

    function addCommonItem() {
        if (!selectedDate) return;

        const item = createEmptyCommon(selectedDate);

        onCommonScheduleChange((current) => [...current, item]);

        setSelectedType('common');
        setSelectedId(selectedDate);

        setSelectedCommonIds((current) => (current.includes(item.clientId) ? current : [...current, item.clientId]));
    }

    function updateProgram(changes) {
        onProgramsChange((current) => current.map((program) => (program.clientId === selectedId ? { ...program, ...changes } : program)));
    }

    function updateProgramSlot(slotId, changes) {
        if (!selectedProgram) return;

        updateProgram({
            schedule: (selectedProgram.schedule ?? []).map((slot) => {
                if (slot.clientId !== slotId) return slot;

                // Убираем старое поле name и переводим его в names.
                const updatedSlot = {
                    ...slot,
                    ...changes,
                    names: changes.names ?? getSlotNames(slot),
                };

                delete updatedSlot.name;

                return updatedSlot;
            }),
        });
    }

    function updateSlotName(slotId, nameIndex, value) {
        const slot = selectedProgram?.schedule?.find((item) => item.clientId === slotId);

        if (!slot) return;

        const names = [...getSlotNames(slot)];
        names[nameIndex] = value;

        updateProgramSlot(slotId, { names });
    }

    function addSlotName(slotId) {
        const slot = selectedProgram?.schedule?.find((item) => item.clientId === slotId);

        if (!slot) return;

        updateProgramSlot(slotId, {
            names: [...getSlotNames(slot), ''],
        });
    }

    function removeSlotName(slotId, nameIndex) {
        const slot = selectedProgram?.schedule?.find((item) => item.clientId === slotId);

        if (!slot) return;

        updateProgramSlot(slotId, {
            names: getSlotNames(slot).filter((_, index) => index !== nameIndex),
        });
    }

    function removeProgramSlot(slotId) {
        if (!selectedProgram) return;

        updateProgram({
            schedule: (selectedProgram.schedule ?? []).filter((slot) => slot.clientId !== slotId),
        });
    }

    function addProgramSlot() {
        if (!selectedProgram) return;

        updateProgram({
            schedule: [...(selectedProgram.schedule ?? []), createEmptySlot(selectedDate)],
        });
    }

    function updateCommonItem(itemId, changes) {
        onCommonScheduleChange((current) => current.map((item) => (item.clientId === itemId ? { ...item, ...changes } : item)));
    }

    function removeCommonItem(itemId) {
        const confirmed = window.confirm('Удалить этот пункт общего расписания?');

        if (!confirmed) return;

        onCommonScheduleChange((current) => current.filter((item) => item.clientId !== itemId));

        setSelectedCommonIds((current) => current.filter((id) => id !== itemId));
    }

    function removeCommonSchedule() {
        const confirmed = window.confirm('Удалить всё общее расписание этого дня вместе со всеми пунктами? Изменение сохранится после нажатия «Сохранить черновик».');

        if (!confirmed) return;

        onCommonScheduleChange((current) => current.filter((item) => item.itemDate !== selectedDate));

        setSelectedId(null);
        setSelectedType('program');
        setSelectedCommonIds([]);
    }

    function removeSelectedProgram() {
        if (!selectedId) return;

        const confirmed = window.confirm('Удалить выбранную программу? Изменение сохранится после нажатия «Сохранить черновик».');

        if (!confirmed) return;

        onProgramsChange((current) => current.filter((program) => program.clientId !== selectedId));

        setSelectedId(null);
    }

    function selectProgram(programId) {
        setSelectedType('program');
        setSelectedId(programId);
    }

    function selectCommon() {
        setSelectedType('common');
        setSelectedId(selectedDate);

        setSelectedCommonIds(commonForDate.map((item) => item.clientId));
    }

    if (!dates.length) {
        return <div className="program-editor__empty">Укажите корректные даты начала и окончания мероприятия на вкладке «Основная информация», чтобы начать заполнять программу.</div>;
    }

    return (
        <div className="program-editor-split">
            <aside className="program-editor-split__sidebar">
                <div className="program-editor-split__actions">
                    <button type="button" onClick={addProgram}>
                        <Plus size={16} />
                        Создать программу
                    </button>

                    <button type="button" onClick={addCommon}>
                        <Plus size={16} />
                        Создать общее расписание
                    </button>
                </div>

                <div className="program-editor-split__list-heading">Программы и расписание</div>

                <ul className="program-editor-split__list">
                    {programsForDate.map((program) => (
                        <li key={program.clientId}>
                            <button type="button" className={selectedType === 'program' && selectedId === program.clientId ? 'is-active' : ''} onClick={() => selectProgram(program.clientId)}>
                                <strong>{program.name || 'Новая программа'}</strong>

                                <small>{(program.schedule ?? []).length} слотов</small>
                            </button>
                        </li>
                    ))}

                    {(commonForDate.length > 0 || isCommonSelected) && (
                        <li>
                            <button type="button" className={isCommonSelected ? 'is-active' : ''} onClick={selectCommon}>
                                <strong>Общее расписание</strong>

                                <small>
                                    {commonForDate.length} {commonForDate.length === 1 ? 'пункт' : commonForDate.length >= 2 && commonForDate.length <= 4 ? 'пункта' : 'пунктов'}
                                </small>
                            </button>
                        </li>
                    )}

                    {!programsForDate.length && !commonForDate.length && !isCommonSelected && <li className="program-editor-split__no-items">На эту дату пока ничего не добавлено.</li>}
                </ul>
            </aside>

            <section className="program-editor-split__editor">
                {!selectedId ? (
                    <div className="program-editor-split__empty">Выберите программу или общее расписание слева либо создайте новый элемент.</div>
                ) : selectedType === 'program' && selectedProgram ? (
                    <div className="program-edit-form">
                        <div className="program-edit-form__header">
                            <h2>Редактирование программы</h2>

                            <button type="button" onClick={removeSelectedProgram} className="text-danger">
                                <Trash2 size={16} />
                                Удалить программу
                            </button>
                        </div>

                        <div className="field">
                            <label>Название программы</label>

                            <input maxLength={255} value={selectedProgram.name ?? ''} onChange={(e) => updateProgram({ name: e.target.value })} placeholder="Название программы" />
                        </div>

                        <div className="field">
                            <label>Описание программы</label>

                            <textarea
                                rows={4}
                                value={selectedProgram.description ?? ''}
                                onChange={(e) =>
                                    updateProgram({
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Описание программы..."
                            />
                        </div>

                        <div className="program-edit-form__slots">
                            <div className="program-edit-form__section-heading">
                                <h3>Слоты расписания</h3>

                                <span>{(selectedProgram.schedule ?? []).length}</span>
                            </div>

                            {(selectedProgram.schedule ?? []).map((slot, index) => (
                                <div className="slot-card" key={slot.clientId}>
                                    <div className="slot-card__header">
                                        <strong>Слот {index + 1}</strong>

                                        <button type="button" aria-label={`Удалить слот ${index + 1}`} onClick={() => removeProgramSlot(slot.clientId)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="slot-card__names">
                                        <div className="field">
                                            <label>Названия активностей</label>
                                        </div>

                                        {getSlotNames(slot).map((name, nameIndex) => (
                                            <div className="slot-card__name-row" key={nameIndex}>
                                                <input
                                                    maxLength={255}
                                                    value={name}
                                                    onChange={(e) => updateSlotName(slot.clientId, nameIndex, e.target.value)}
                                                    placeholder={`Название ${nameIndex + 1}`}
                                                    aria-label={`Название активности ${nameIndex + 1}`}
                                                />

                                                <button type="button" aria-label={`Удалить название ${nameIndex + 1}`} onClick={() => removeSlotName(slot.clientId, nameIndex)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        <button type="button" className="program-edit-form__add-slot" onClick={() => addSlotName(slot.clientId)}>
                                            <Plus size={16} />
                                            Добавить название
                                        </button>
                                    </div>

                                    <div className="field-row field-row--2">
                                        <div className="field">
                                            <label>Дата</label>

                                            <input
                                                type="date"
                                                min={event.startDate}
                                                max={event.endDate}
                                                value={slot.itemDate ?? ''}
                                                onChange={(e) =>
                                                    updateProgramSlot(slot.clientId, {
                                                        itemDate: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="field">
                                            <label>Время</label>

                                            <div className="slot-card__time">
                                                <input
                                                    type="time"
                                                    value={slot.startTime ?? ''}
                                                    onChange={(e) =>
                                                        updateProgramSlot(slot.clientId, {
                                                            startTime: e.target.value,
                                                        })
                                                    }
                                                />

                                                <span>—</span>

                                                <input
                                                    type="time"
                                                    value={slot.endTime ?? ''}
                                                    onChange={(e) =>
                                                        updateProgramSlot(slot.clientId, {
                                                            endTime: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <LocationEditor
                                        value={slot.locationPlaceId}
                                        manualLocation={slot.manualLocation}
                                        locations={locations}
                                        onChange={(changes) => updateProgramSlot(slot.clientId, changes)}
                                    />
                                </div>
                            ))}

                            <button type="button" className="program-edit-form__add-slot" onClick={addProgramSlot}>
                                <Plus size={16} />
                                Добавить слот
                            </button>
                        </div>
                    </div>
                ) : isCommonSelected ? (
                    <div className="program-edit-form">
                        <div className="program-edit-form__header">
                            <div>
                                <h2>Общее расписание</h2>

                                <p>
                                    {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('ru-RU', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>

                            {commonForDate.length > 0 && (
                                <button type="button" onClick={removeCommonSchedule} className="text-danger">
                                    <Trash2 size={16} />
                                    Удалить расписание
                                </button>
                            )}
                        </div>

                        <div className="program-edit-form__slots">
                            <div className="program-edit-form__section-heading">
                                <h3>Пункты расписания</h3>

                                <span>{selectedCommonItems.length}</span>
                            </div>

                            {selectedCommonItems.length === 0 && <div className="program-editor-split__empty">На этот день пока нет пунктов общего расписания. Добавьте первый пункт.</div>}

                            {selectedCommonItems.map((item, index) => (
                                <div className="slot-card" key={item.clientId}>
                                    <div className="slot-card__header">
                                        <strong>Слот {index + 1}</strong>

                                        <button type="button" aria-label={`Удалить пункт ${index + 1}`} onClick={() => removeCommonItem(item.clientId)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="field">
                                        <label>Название активности</label>

                                        <input
                                            maxLength={255}
                                            value={item.name ?? ''}
                                            onChange={(e) => updateCommonItem(item.clientId, { name: e.target.value })}
                                            placeholder="Например, Открытие мероприятия"
                                        />
                                    </div>

                                    <div className="field-row field-row--2">
                                        <div className="field">
                                            <label>Дата</label>

                                            <input
                                                type="date"
                                                min={event.startDate}
                                                max={event.endDate}
                                                value={item.itemDate ?? ''}
                                                onChange={(e) =>
                                                    updateCommonItem(item.clientId, {
                                                        itemDate: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="field">
                                            <label>Время</label>

                                            <div className="slot-card__time">
                                                <input
                                                    type="time"
                                                    value={item.startTime ?? ''}
                                                    onChange={(e) =>
                                                        updateCommonItem(item.clientId, {
                                                            startTime: e.target.value,
                                                        })
                                                    }
                                                />

                                                <span>—</span>

                                                <input
                                                    type="time"
                                                    value={item.endTime ?? ''}
                                                    onChange={(e) =>
                                                        updateCommonItem(item.clientId, {
                                                            endTime: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <LocationEditor
                                        value={item.locationPlaceId}
                                        manualLocation={item.manualLocation}
                                        locations={locations}
                                        onChange={(changes) => updateCommonItem(item.clientId, changes)}
                                    />
                                </div>
                            ))}

                            <button type="button" className="program-edit-form__add-slot" onClick={addCommonItem}>
                                <Plus size={16} />
                                Добавить пункт расписания
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="program-editor-split__empty">Выбранный элемент больше не существует.</div>
                )}
            </section>
        </div>
    );
}
