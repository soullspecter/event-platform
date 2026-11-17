import re
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# ВТОРОЙ СЛОЙ: настройки парсера таблиц (src/table_parser/)
# Пока только чистка колонок.
# ──────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_TABLES_DIR = BASE_DIR / "data" / "output_tables"

# Колонки, которые удаляем из таблиц полностью
DROP_COLUMN_PATTERNS = [
    r"^№\s*п/?п\.?$",
    r"^номер$",
    r"^п/п$",
    r"^комментари",
    r"^ответственн",
    r"^контакт",
    r"^тел",
    r"^e-?mail",
    r"^целевая\s+аудитори",
    r"^проходимост",
    r"^количество\s+участников",
    r"^формат",
]

DROP_COLUMN_RE = [re.compile(p, re.IGNORECASE) for p in DROP_COLUMN_PATTERNS]