
import argparse
import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole

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


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "data" / "json"


def ask_gigachat(
    prompt: str,
    markdown: str,
    schema: dict,
    max_retries: int = 5,
) -> dict:
    credentials = os.getenv("GIGACHAT_CREDENTIALS", "").strip()
    if not credentials:
        raise RuntimeError("Не задан GIGACHAT_CREDENTIALS в .env")

    model_name = os.getenv("GIGACHAT_MODEL", "GigaChat-3-Ultra")
    base_url = os.getenv("GIGACHAT_BASE_URL", "https://api.giga.chat/v1")
    timeout = int(os.getenv("GIGACHAT_TIMEOUT", "240"))

    for attempt in range(1, max_retries + 1):
        try:
            with GigaChat(
                credentials=credentials,
                verify_ssl_certs=False,
                model=model_name,
                base_url=base_url,
                timeout=timeout,
            ) as giga:
                response = giga.chat(
                    Chat(
                        model=model_name,
                        messages=[
                            Messages(
                                role=MessagesRole.SYSTEM,
                                content=prompt,
                            ),
                            Messages(
                                role=MessagesRole.USER,
                                content=markdown,
                            ),
                        ],
                        max_tokens=4096,
                        temperature=0,
                        response_format={
                            "type": "json_schema",
                            "schema": schema,
                            "strict": True,
                        },
                    )
                )

            return json.loads(response.choices[0].message.content)

        except Exception:
            if attempt == max_retries:
                raise
            time.sleep(2)


def extract_event(markdown: str) -> dict:
    print("1/3 Извлекаю метаданные...")
    meta = ask_gigachat(
        META_PROMPT,
        markdown,
        META_SCHEMA,
    )

    print("2/3 Извлекаю программы...")
    programs_result = ask_gigachat(
        PROGRAMS_LIST_PROMPT,
        markdown,
        PROGRAMS_LIST_SCHEMA,
    )

    programs = programs_result.get("programs", [])

    for index, program in enumerate(programs, start=1):
        program_name = program.get("name", "")

        print(
            f"  Извлекаю расписание программы "
            f"{index}/{len(programs)}: {program_name}"
        )

        schedule_markdown = (
            f"Название программы: {program_name}\n\n"
            f"Исходный документ:\n{markdown}"
        )

        schedule_result = ask_gigachat(
            PROGRAM_SCHEDULE_PROMPT,
            schedule_markdown,
            SCHEDULE_SCHEMA,
        )

        program["schedule"] = schedule_result.get("schedule", [])

    print("3/3 Извлекаю общее расписание...")
    common_result = ask_gigachat(
        COMMON_SCHEDULE_PROMPT,
        markdown,
        COMMON_SCHEDULE_SCHEMA,
    )

    return {
        **meta,
        "programs": programs,
        "commonSchedule": common_result.get("commonSchedule", []),
    }


def process_file(input_path: Path) -> Path:
    markdown = input_path.read_text(encoding="utf-8")

    result = extract_event(markdown)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    output_path = OUTPUT_DIR / f"{input_path.stem}.json"

    output_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"JSON сохранён: {output_path}")

    return output_path


def main() -> None:
    load_dotenv(BASE_DIR.parent / ".env")

    # Папка с markdown по умолчанию: <проект>/output/markdown
    # BASE_DIR = .../event-builder/gigachat_test
    # BASE_DIR.parent = .../event-builder
    default_markdown_dir = BASE_DIR.parent / "data" / "markdown"

    parser = argparse.ArgumentParser(
        description="Извлечение данных мероприятия из Markdown через GigaChat"
    )

    parser.add_argument(
        "path",
        nargs="?",
        default=str(default_markdown_dir),
        help=(
            "Путь к Markdown-файлу или папке с Markdown-файлами "
            f"(по умолчанию: {default_markdown_dir})"
        ),
    )

    args = parser.parse_args()

    source = Path(args.path)

    if not source.is_absolute():
        source = Path.cwd() / source

    if source.is_file():
        process_file(source)
        return

    if source.is_dir():
        files = sorted(source.glob("*.md"))

        if not files:
            print(f"В папке нет .md файлов: {source}")
            return

        for input_path in files:
            print(f"\nОбрабатываю: {input_path.name}")
            process_file(input_path)

        return

    raise FileNotFoundError(f"Файл или папка не найдены: {source}")


if __name__ == "__main__":
    main()
