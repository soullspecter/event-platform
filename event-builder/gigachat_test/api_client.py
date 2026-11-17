import json
import os

import requests


class EventsApiError(RuntimeError):
    pass


def create_event_draft(payload: dict) -> dict:
    """
    Создаёт черновик через POST /events/drafts.
    Публикационные endpoint'ы здесь намеренно отсутствуют.
    """
    url = os.getenv("EVENTS_DRAFTS_URL", "").strip()
    token = os.getenv("EVENTS_API_TOKEN", "").strip()

    if not url:
        raise EventsApiError("Не задан EVENTS_DRAFTS_URL в .env")
    if not token:
        raise EventsApiError("Не задан EVENTS_API_TOKEN в .env")

    try:
        response = requests.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=60,
        )
    except requests.RequestException as e:
        raise EventsApiError(f"Сетевая ошибка при запросе к API: {e}") from e

    if not response.ok:
        try:
            body = response.json()
            pretty = json.dumps(body, ensure_ascii=False, indent=2)
        except ValueError:
            pretty = response.text
        raise EventsApiError(f"API вернул HTTP {response.status_code}:\n{pretty}")

    try:
        return response.json()
    except ValueError:
        return {"rawResponse": response.text}