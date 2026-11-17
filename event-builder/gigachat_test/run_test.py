import json
import os
import re
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole

from gigachat_test.api_client import create_event_draft
from gigachat_test.schema import (
    META_SCHEMA,
    PROGRAMS_LIST_SCHEMA,
    SCHEDULE_SCHEMA,
    COMMON_SCHEDULE_SCHEMA,
)
from gigachat_test.prompt import (
    META_PROMPT,
    PROGRAMS_LIST_PROMPT,
    PROGRAM_SCHEDULE_PROMPT,
    COMMON_SCHEDULE_PROMPT,
)

load_dotenv()
BASE = Path(__file__).resolve().parent.parent
MD_DIR = BASE / "data" / "markdown"
JSON_DIR = BASE / "data" / "json"
JSON_DIR.mkdir(parents=True, exist_ok=True)

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})$")


# ─────────────────────────────────────────────────────────────
# Нормализация значений под контракт Events API
# ─────────────────────────────────────────────────────────────

def _norm_date(value, min_d=None, max_d=None):
    """YYYY-MM-DD, в пределах [min_d, max_d]. Иначе None."""
    if not isinstance(value, str) or not DATE_RE.match(value.strip()):
        return None
    value = value.strip()
    if min_d and value < min_d:
        return None
    if max_d and value > max_d:
        return None
    return value


def _norm_time(value):
    """'9:00' -> '09:00'. Невалидное -> None."""
    if not isinstance(value, str):
        return None
    m = TIME_RE.match(value.strip())
    if not m:
        return None
    hh = min(23, max(0, int(m.group(1))))
    mm = min(59, max(0, int(m.group(2))))
    return f"{hh:02d}:{mm:02d}"


def _norm_location(loc):
    """{name, address, place} -> SaveLocationPlaceDto-совместимый объект или None."""
    if not isinstance(loc, dict):
        return None
    name = (loc.get("name") or "").strip() or None
    address = (loc.get("address") or "").strip() or None
    place = (loc.get("place") or "").strip() or None
    # API требует name или address, если location передан
    if not (name or address):
        return None
    return {"name": name, "address": address, "place": place}


def _fix_slot(raw, start_date, end_date):
    """Приводит слот к виду SaveScheduleItemDto / SaveCommonScheduleItemDto."""
    item_date = _norm_date(raw.get("itemDate"), start_date, end_date)
    start = _norm_time(raw.get("startTime"))
    end = _norm_time(raw.get("endTime"))

    # API: endTime должен быть строго позже startTime
    if start and end and end <= start:
        end = None

    name = (raw.get("name") or "").strip() or None

    return {
        "name": name,
        "itemDate": item_date,
        "startTime": start,
        "endTime": end,
        "location": _norm_location(raw.get("location")),
    }


def _clean_slots(slots, start_date, end_date):
    """Нормализует список слотов и отбрасывает пустые/невалидные."""
    result = []
    for raw in slots or []:
        slot = _fix_slot(raw, start_date, end_date)
        if not slot["itemDate"] or not slot["name"]:
            continue
        result.append(slot)
    return result


# ─────────────────────────────────────────────────────────────
# GigaChat
# ─────────────────────────────────────────────────────────────

def _ask_gigachat(prompt: str, user_content: str, schema: dict, max_retries: int = 3) -> dict:
    credentials = os.getenv("GIGACHAT_CREDENTIALS")
    if not credentials:
        raise RuntimeError("Не задан GIGACHAT_CREDENTIALS в .env")

    model_name = os.getenv("GIGACHAT_MODEL", "GigaChat-3-Ultra")
    base_url = os.getenv("GIGACHAT_BASE_URL", "https://api.giga.chat/v1")
    timeout = int(os.getenv("GIGACHAT_TIMEOUT", "240"))

    content = ""
    for attempt in range(max_retries):
        try:
            with GigaChat(
                credentials=credentials,
                verify_ssl_certs=False,
                model=model_name,
                base_url=base_url,
                timeout=timeout,
            ) as giga:
                response = giga.chat(Chat(
                    model=model_name,
                    messages=[
                        Messages(role=MessagesRole.SYSTEM, content=prompt),
                        Messages(role=MessagesRole.USER, content=user_content),
                    ],
                    max_tokens=4096,
                    response_format={
                        "type": "json_schema",
                        "schema": schema,
                        "strict": True,
                    },
                ))

            content = response.choices[0].message.content
            return json.loads(content)

        except json.JSONDecodeError:
            print(f"      ⚠ GigaChat выдал текст вместо JSON (попытка {attempt + 1}/{max_retries}).")
            if attempt == max_retries - 1:
                raise RuntimeError(
                    f"GigaChat не смог выдать JSON после {max_retries} попыток.\nОтвет: {content[:300]}"
                )
            time.sleep(2)

        except Exception as e:
            print(f"      ⚠ Ошибка API GigaChat (попытка {attempt + 1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                raise
            time.sleep(2)


# ─────────────────────────────────────────────────────────────
# Обработка одного документа
# ─────────────────────────────────────────────────────────────

def run_one(md_file: Path, send_to_api: bool = False) -> dict:
    markdown = md_file.read_text(encoding="utf-8")
    print(f"  Длина Markdown: {len(markdown)} символов")

    # Шаг 1: Метаданные
    print("  [Шаг 1/4] Метаданные...")
    meta = _ask_gigachat(META_PROMPT, markdown, META_SCHEMA)
    print(f"    title: {meta.get('title')}")

    start_date = _norm_date(meta.get("startDate"))
    end_date = _norm_date(meta.get("endDate"), start_date)
    if not start_date:
        raise RuntimeError(f"Не удалось извлечь startDate (получено: {meta.get('startDate')!r})")
    if not end_date:
        end_date = start_date
    print(f"    период: {start_date} — {end_date}")

    # Шаг 2: Список программ
    print("  [Шаг 2/4] Выделение программ...")
    programs_result = _ask_gigachat(PROGRAMS_LIST_PROMPT, markdown, PROGRAMS_LIST_SCHEMA)
    programs_list = programs_result.get("programs", [])
    print(f"    Найдено программ: {len(programs_list)}")

    # Шаг 3: Расписание для каждой программы
    final_programs = []
    for idx, prog in enumerate(programs_list, start=1):
        prog_name = (prog.get("name") or "").strip() or "Без названия"
        print(f"    [Шаг 3/4] Расписание для '{prog_name}' ({idx}/{len(programs_list)})...")

        content = (
            f"Документ:\n{markdown}\n\n"
            f"Программа: {prog_name}\n"
            f"Описание: {prog.get('description') or ''}"
        )

        try:
            schedule_result = _ask_gigachat(PROGRAM_SCHEDULE_PROMPT, content, SCHEDULE_SCHEMA)
            raw_schedule = schedule_result.get("schedule", [])
            schedule = _clean_slots(raw_schedule, start_date, end_date)
            print(f"      получено {len(schedule)} валидных слотов (из {len(raw_schedule)})")
        except Exception as e:
            print(f"      ⚠ Ошибка извлечения слотов: {e}")
            schedule = []

        final_programs.append({
            "name": prog_name[:255],
            "description": (prog.get("description") or "").strip(),
            "schedule": schedule,
        })

    # Шаг 4: Общее расписание (плоский массив)
    print("  [Шаг 4/4] Общее расписание...")
    common_result = _ask_gigachat(COMMON_SCHEDULE_PROMPT, markdown, COMMON_SCHEDULE_SCHEMA)
    raw_common = common_result.get("commonSchedule", [])
    common_schedule = _clean_slots(raw_common, start_date, end_date)
    print(f"    получено {len(common_schedule)} валидных общих слотов (из {len(raw_common)})")

    # Итоговый JSON под контракт POST /events/drafts
    result = {
        "title": meta.get("title"),
        "description": None,
        "startDate": start_date,
        "endDate": end_date,
        "programs": final_programs,
        "commonSchedule": common_schedule,
    }

    json_path = JSON_DIR / f"{md_file.stem}.json"
    json_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✓ JSON сохранён: {json_path}")

    if send_to_api:
        try:
            api_result = create_event_draft(result)
            print("  ✓ Черновик создан в Events API")
            return api_result
        except Exception as e:
            print(f"  ✗ Ошибка отправки в API: {e}")

    return result


def main():
    args = sys.argv[1:]
    send_to_api = "--send-to-api" in args
    args = [arg for arg in args if arg != "--send-to-api"]

    if args:
        path = Path(args[0])
        files = [path] if path.is_file() else sorted(path.glob("*.md"))
    else:
        files = sorted(MD_DIR.glob("*.md"))

    if not files:
        print(f"Нет Markdown-файлов для обработки: {MD_DIR}")
        raise SystemExit(1)

    print(f"Найдено документов: {len(files)}\n")

    success = 0
    errors = 0

    for index, md_file in enumerate(files, start=1):
        print(f"Документ {index}/{len(files)}")
        print("=" * 80)
        print(f"Файл: {md_file.name}")
        print("=" * 80)

        try:
            run_one(md_file, send_to_api=send_to_api)
            success += 1
        except Exception as exc:
            errors += 1
            print(f"  ✗ Ошибка: {exc}")

        print()

    print("=" * 80)
    print("ИТОГ")
    print("=" * 80)
    print(f"Всего документов: {len(files)}")
    print(f"Успешно: {success}")
    print(f"Ошибок: {errors}")


if __name__ == "__main__":
    main()