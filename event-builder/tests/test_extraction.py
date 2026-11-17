import unittest

from gigachat_test.table_parser import extract_markdown_tables, flatten_rows
from gigachat_test.validator import validate_llm_result, to_api_payload


class MarkdownExtractionTests(unittest.TestCase):
    def test_blank_lines_and_duplicate_cells_are_preserved(self):
        markdown = """Программа мероприятия

\\| Начало | Окончание | Название |

\\|---|---|---|

\\| 10:00 | 11:00 | Открытие |

\\| 10:00 | 11:00 | Открытие |
"""
        rows = flatten_rows(extract_markdown_tables(markdown))
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["cells"], ["10:00", "11:00", "Открытие"])
        self.assertEqual(rows[1]["cells"], ["10:00", "11:00", "Открытие"])
        self.assertNotEqual(rows[0]["sourceRowId"], rows[1]["sourceRowId"])

    def test_single_row_table_is_not_dropped(self):
        rows = flatten_rows(extract_markdown_tables("| 12:00 | Закрытие |\n"))
        self.assertEqual(len(rows), 1)
        self.assertTrue(rows[0]["isTimeCandidate"])

    def test_date_is_not_mistaken_for_time(self):
        rows = flatten_rows(extract_markdown_tables("| 13.06.2025 | Открытие |\n"))
        self.assertEqual(len(rows), 1)
        self.assertFalse(rows[0]["isTimeCandidate"])

    def test_validator_and_api_payload(self):
        rows = flatten_rows(extract_markdown_tables(
            "| Начало | Конец | Активность |\n|---|---|---|\n| 10:00 | 11:00 | Открытие |\n"
        ))
        result = {
            "events": [{
                "title": "Тест",
                "description": "Описание",
                "startDate": "2025-06-13",
                "endDate": "2025-06-13",
                "schedule": [{
                    "name": "Открытие", "itemDate": "2025-06-13",
                    "startTime": "10:00", "endTime": "11:00", "sourceRowId": 0
                }],
                "programs": []
            }]
        }
        validate_llm_result(result, rows)
        payload = to_api_payload(result["events"][0])
        self.assertNotIn("sourceRowId", payload["schedule"][0])
        self.assertEqual(payload["schedule"][0]["startTime"], "10:00")


if __name__ == "__main__":
    unittest.main()
