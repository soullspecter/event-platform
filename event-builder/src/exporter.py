import re
from pathlib import Path
from docx import Document
from docx.table import Table
from docx.oxml.ns import qn
from src.utils import iter_block_items


def iter_all_tables(doc):
    """Совместимость со старым интерфейсом; таблицы в порядке документа."""
    for table in doc.element.body.iter(qn("w:tbl")):
        yield Table(table, doc)


def clean_cell_text(text: str) -> str:
    text = text.replace("\n", " ").replace("\r", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _paragraph_to_markdown(text: str) -> str:
    text = text.strip()
    if not text:
        return ""
    if re.match(r"^\d+(\.\d+)*\.?\s+[А-ЯЁ]", text):
        return f"\n### {text}\n"
    return text


def _table_to_markdown(table: Table, table_number: int) -> list[str]:
    lines = [f"\n**[Таблица {table_number}]**"]
    if not table.rows:
        return lines

    rows = []
    max_cols = 0
    for row in table.rows:
        # Не схлопываем одинаковые значения: это могут быть разные ячейки.
        cells = [clean_cell_text(cell.text) for cell in row.cells]
        rows.append(cells)
        max_cols = max(max_cols, len(cells))

    for row in rows:
        row.extend([""] * (max_cols - len(row)))
        # Экранируем вертикальные черты внутри текста ячеек.
        escaped = [cell.replace("|", r"\|") for cell in row]
        lines.append("| " + " | ".join(escaped) + " |")
    lines.append("")
    return lines


def process_markdown_export(src_dir: Path, dst_dir: Path):
    """Экспортирует абзацы и таблицы в исходном порядке."""
    dst_dir.mkdir(parents=True, exist_ok=True)

    for src in sorted(src_dir.glob("*_нормализовано.docx")):
        dst = dst_dir / f"{src.stem.replace('_нормализовано', '')}.md"
        print(f"  [Markdown] {src.name}")

        try:
            doc = Document(str(src))
            md_lines = []
            table_number = 0

            for block in iter_block_items(doc):
                if isinstance(block, Table):
                    table_number += 1
                    md_lines.extend(_table_to_markdown(block, table_number))
                else:
                    rendered = _paragraph_to_markdown(block.text or "")
                    if rendered:
                        md_lines.append(rendered)

            dst.write_text("\n".join(md_lines).strip() + "\n", encoding="utf-8")
            print(f"    ✓ Готово: {dst.name}")
        except Exception as exc:
            print(f"    ✗ Ошибка: {exc}")
