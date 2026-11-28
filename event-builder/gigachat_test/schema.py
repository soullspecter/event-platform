
META_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": ["string", "null"]},
        "startDate": {"type": ["string", "null"]},
        "endDate": {"type": ["string", "null"]},
        "description": {"type": ["string", "null"]},
    },
    "required": ["title", "startDate", "endDate", "description"],
}


PROGRAMS_LIST_SCHEMA = {
    "type": "object",
    "properties": {
        "programs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["name", "description"],
            },
        }
    },
    "required": ["programs"],
}


SCHEDULE_SCHEMA = {
    "type": "object",
    "properties": {
        "schedule": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "itemDate": {"type": "string"},
                    "startTime": {"type": ["string", "null"]},
                    "endTime": {"type": ["string", "null"]},
                    "names": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 1,
                    },
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
                "required": [
                    "itemDate",
                    "startTime",
                    "endTime",
                    "names",
                    "location",
                ],
            },
        }
    },
    "required": ["schedule"],
}


COMMON_SCHEDULE_SCHEMA = {
    "type": "object",
    "properties": {
        "commonSchedule": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "itemDate": {"type": "string"},
                    "startTime": {"type": ["string", "null"]},
                    "endTime": {"type": ["string", "null"]},
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
                "required": [
                    "itemDate",
                    "startTime",
                    "endTime",
                    "name",
                    "location",
                ],
            },
        }
    },
    "required": ["commonSchedule"],
}
