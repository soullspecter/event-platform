META_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": ["string", "null"]},
        "startDate": {"type": ["string", "null"]},
        "endDate": {"type": ["string", "null"]},
    },
    "required": ["title", "startDate", "endDate"],
}

# Шаг 2: Выделяем только смысловые программы
PROGRAMS_LIST_SCHEMA = {
    "type": "object",
    "properties": {
        "programs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "tempId": {"type": "string"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["tempId", "name", "description"],
            },
        }
    },
    "required": ["programs"],
}

# Шаг 3: Расписание для конкретной программы
SCHEDULE_SCHEMA = {
    "type": "object",
    "properties": {
        "schedule": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "itemDate": {"type": "string"},
                    "startTime": {"type": "string"},
                    "endTime": {"type": "string"},
                    "name": {"type": "string"},
                    "location": {
                        "type": ["object", "null"],
                        "properties": {
                            "name": {"type": ["string", "null"]},
                            "address": {"type": ["string", "null"]},
                            "place": {"type": ["string", "null"]},
                        },
                        "required": ["name", "address", "place"],
                    },
                },
                "required": ["itemDate", "startTime", "endTime", "name", "location"],
            },
        }
    },
    "required": ["schedule"],
}

# Шаг 4: Общее расписание
COMMON_SCHEDULE_SCHEMA = {
    "type": "object",
    "properties": {
        "commonSchedule": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "itemDate": {"type": "string"},
                    "startTime": {"type": "string"},
                    "endTime": {"type": "string"},
                    "name": {"type": "string"},
                    "location": {
                        "type": ["object", "null"],
                        "properties": {
                            "name": {"type": ["string", "null"]},
                            "address": {"type": ["string", "null"]},
                            "place": {"type": ["string", "null"]},
                        },
                        "required": ["name", "address", "place"],
                    },
                },
                "required": ["itemDate", "startTime", "endTime", "name", "location"],
            },
        }
    },
    "required": ["commonSchedule"],
}