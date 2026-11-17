"""
Удаляет из таблиц docx лишние колонки по паттернам из config/table_settings.py.
Ничего не склеивает, не разбивает, не рендерит — только вырезает колонки.
"""
from pathlib import Path

from docx import Document
from docx.table import Table

from config.table_settings import DROP_COLUMN_RE


def _is_drop_header(text: str) -> bool:
    text = (text or "").strip()
    if not text:
        return False
    return any(rx.search(text) for rx in DROP_COLUMN_RE)


def _drop_columns_from_table(table: Table) -> None:
    """Удаляет колонки, чьи заголовки матчатся DROP_COLUMN_RE."""
    if not table.rows:
        return

    header_cells = table.rows[0].cells
    drop_idx = [i for i, cell in enumerate(header_cells) if _is_drop_header(cell.text)]

    if not drop_idx:
        return

    # Удаляем колонки с конца, чтобы индексы не съезжали
    for col_idx in sorted(drop_idx, reverse=True):
        _remove_column(table, col_idx)


def _remove_column(table: Table, col_idx: int) -> None:
    """Удаляет колонку col_idx из таблицы через XML."""
    tbl = table._tbl
    grid = tbl.find(".//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tblGrid")
    if grid is not None:
        cols = grid.findall("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}gridCol")
        if col_idx < len(cols):
            grid.remove(cols[col_idx])

    for row in table.rows:
        if col_idx < len(row.cells):
            tc = row.cells[col_idx]._tc
            tc.getparent().remove(tc)


def filter_table_columns(src: Path, dst: Path) -> None:
    """Читает docx, удаляет лишние колонки во всех таблицах, сохраняет новый docx."""
    doc = Document(str(src))
    for table in doc.tables:
        _drop_columns_from_table(table)
    doc.save(str(dst))


def process_column_filter(src_dir: Path, dst_dir: Path) -> None:
    dst_dir.mkdir(parents=True, exist_ok=True)
    for src in sorted(src_dir.glob("*.docx")):
        dst = dst_dir / f"{src.stem}_без_лишних_колонок.docx"
        print(f"  [Columns] {src.name}")
        try:
            filter_table_columns(src, dst)
            print(f"    ✓ Готово: {dst.name}")
        except Exception as exc:
            print(f"    ✗ Ошибка: {exc}")