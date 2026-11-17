"""
Отправляет готовый JSON в FastAPI-обвязку (или напрямую в NestJS).

Использование:
    python -m workers.send_json data/json/foo.json
    python -m workers.send_json                  # первый файл из data/json/
"""
import json
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

BASE = Path(__file__).resolve().parent.parent
JSON_DIR = BASE / "data" / "json"
FASTAPI_URL = "http://localhost:8000/drafts/from-json"


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if path is None:
        files = sorted(JSON_DIR.glob("*.json"))
        if not files:
            print(f"Нет JSON-файлов: {JSON_DIR}")
            sys.exit(1)
        path = files[0]

    if not path.exists():
        print(f"Файл не найден: {path}")
        sys.exit(1)

    payload = json.loads(path.read_text(encoding="utf-8"))

    print(f"Файл: {path}")
    print(f"  title:          {payload.get('title')!r}")
    print(f"  startDate:      {payload.get('startDate')!r}")
    print(f"  endDate:        {payload.get('endDate')!r}")
    print(f"  programs:       {len(payload.get('programs') or [])}")
    print(f"  commonSchedule: {len(payload.get('commonSchedule') or [])}")
    print()

    try:
        response = requests.post(FASTAPI_URL, json=payload, timeout=120)
    except requests.RequestException as e:
        print(f"✗ Сетевая ошибка: {e}")
        sys.exit(1)

    print(f"HTTP {response.status_code}")
    print(response.text[:3000])

    if not response.ok:
        sys.exit(1)


if __name__ == "__main__":
    main()