import argparse

from config.settings import INPUT_DIR, RAW_DIR, OUTPUT_DIR
from config.table_settings import OUTPUT_TABLES_DIR
from src.converter import process_conversion
from src.normalizer import process_normalization
from src.exporter import process_markdown_export
from src.table_parser.column_filter import process_column_filter


def main():
    parser = argparse.ArgumentParser(description="Подготовка документов и создание черновиков мероприятий")
    parser.add_argument("--gigachat", action="store_true", help="После экспорта обработать Markdown через GigaChat")
    parser.add_argument("--send-to-api", action="store_true", help="Создать черновики через Events API (без публикации)")
    args = parser.parse_args()

    print("🚀 Запуск event-builder...\n")

    print("=== ШАГ 1: Конвертация .doc -> .docx ===")
    process_conversion(INPUT_DIR, RAW_DIR)

    print("\n=== ШАГ 2: Нормализация документов (удаление служебных разделов) ===")
    process_normalization(RAW_DIR, OUTPUT_DIR)

    print("\n=== ШАГ 2B: Чистка таблиц от лишних колонок ===")
    process_column_filter(OUTPUT_DIR, OUTPUT_TABLES_DIR)

    print("\n=== ШАГ 3: Экспорт в Markdown ===")
    markdown_dir = OUTPUT_DIR.parent / "markdown"
    process_markdown_export(OUTPUT_DIR, markdown_dir)

    print(f"\n✓ Markdown-файлы: {markdown_dir}")
    print(f"✓ Docx без лишних колонок: {OUTPUT_TABLES_DIR}")

    if args.gigachat or args.send_to_api:
        print("\n=== ШАГ 4: Извлечение программы через GigaChat ===")
        from gigachat_test.run_test import main as gigachat_main
        import sys
        original_argv = sys.argv[:]
        try:
            sys.argv = [original_argv[0], str(markdown_dir)]
            if args.send_to_api:
                sys.argv.append("--send-to-api")
            gigachat_main()
        finally:
            sys.argv = original_argv

    print("\n✓ Готово. Публикация мероприятий не выполняется.")


if __name__ == "__main__":
    main()