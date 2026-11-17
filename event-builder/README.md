# event-builder: создание черновиков мероприятий

Проект сохраняет существующий конвейер обработки DOC/DOCX:

1. `src/converter.py` — конвертация DOC в DOCX.
2. `src/normalizer.py` — удаление служебных разделов по текущему `DROP_CHAPTERS`.
3. `src/exporter.py` — экспорт в Markdown в порядке исходного документа (абзацы и таблицы не переставляются).
4. `gigachat_test/` — извлечение событий, расписания, программ и локаций через GigaChat.
5. При `--send-to-api` каждый объект `events[]` отправляется в `POST /events/drafts`.

**Публикация не выполняется.** В проекте нет вызова `POST /events/:id/publish`.

## Установка

Требуется Python 3.10+ и установленный Microsoft Word или LibreOffice для конвертации старых `.doc`.

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
```

Скопируйте `.env.example` в `.env` и заполните `GIGACHAT_CREDENTIALS`.

Для отправки черновиков дополнительно заполните:

- `EVENTS_DRAFTS_URL` — полный URL endpoint `POST /events/drafts` (с учётом глобального API-префикса, если он есть).
- `EVENTS_API_TOKEN` — JWT access token пользователя с ролью `admin`.

Не добавляйте `.env` в архивы и репозиторий.

## Запуск

Только конвертация, нормализация и экспорт Markdown:

```bash
python main.py
```

Обработать Markdown через GigaChat и сохранить JSON локально в `data/json/`:

```bash
python main.py --gigachat
```

Создать черновики в Events API:

```bash
python main.py --send-to-api
```

Можно отдельно обработать уже подготовленные Markdown-файлы:

```bash
python -m gigachat_test.run_test
python -m gigachat_test.run_test "data/markdown"
python -m gigachat_test.run_test "data/markdown/example.md" --send-to-api
```

## Контроль полноты

Markdown-парсер присваивает каждой строке таблиц `sourceRowId`. Модель возвращает этот ID для соответствующего элемента `schedule`. Валидатор проверяет:

- что временные строки таблиц не пропущены;
- что один `sourceRowId` не использован повторно;
- что модель не придумала неизвестные ID;
- что `scheduleItemIndex` каждой программы находится в пределах массива `schedule`;
- что даты и время имеют допустимый формат.

Если проверка полноты не проходит, выполняется одна повторная попытка с перечислением пропусков. Если повторная проверка тоже не проходит, JSON не отправляется в API.

Важное ограничение: эвристика считает обязательными строки таблиц, в которых обнаружено время. Табличные строки без времени модель классифицирует по контексту. Проверка не может гарантировать правильность смысловой классификации модели, поэтому итоговый черновик всё равно следует проверить перед публикацией.

## API-совместимость

Поля payload соответствуют `SaveEventDto`, `SaveScheduleItemDto`, `SaveProgramDto` и `SaveLocationPlaceDto` из предоставленного `events-module`:

- `title`, `description`, `startDate`, `endDate`;
- `schedule[]`: `name`, `itemDate`, `startTime`, `endTime`;
- `programs[]`: `name`, `description`, `scheduleItemIndex`, `manualLocation`.

Внутренний `sourceRowId` удаляется перед отправкой в API. Для создания черновика endpoint защищён JWT и ролью `admin`.
