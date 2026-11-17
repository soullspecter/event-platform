import re
from pathlib import Path
from docx import Document
from docx.table import Table
from docx.enum.section import WD_ORIENT
from src.utils import iter_block_items, delete_element

KEEP_CHAPTERS = re.compile(
    r"^\s*(?:\d+(?:\.\d+)*\.?|[ivx]+\.?)?\s*"
    r"(место\s+и\s+сроки|сроки\s+и\s+место|срок\s+и\s+место|"
    r"место\s+проведения|сроки\s+проведения|дата\s+проведения|"
    r"программа\s+мероприятия|программа\s+фестиваля|программа\s+форума|"
    r"программа\s+серии|программа\s+работы|виды\s+спорта|"
    r"мероприятия\s+фестиваля|расписание|участники|"
    r"программа)", 
    re.IGNORECASE
)

DROP_CHAPTERS = re.compile(
    r"^\s*(?:\d+(?:\.\d+)*\.?|[ivx]+\.?)?\s*"
    r"(общие\s+положения|цел[ьи]\s+и\s+задачи|организатор|учредител|"
    r"финанс|условия\s+финансирования|" 
    r"страхов|оргкомитет|комитет|"
    r"обеспечение\s+безопасности|подведени[ея]\s+итогов|"
    r"протест|подача\s+заявок|контакт|заключительн|награждени|"
    r"определение\s+победител|условия\s+определения|жюри|"
    r"условия\s+проведения|порядок\s+подачи|требования\s+к\s+участникам|"
    r"распределение\s+(прав|зон|обязанностей)|заявка|критерии|"
    r"приложение\s+\d+|положение\s+о\s+порядке|рекомендации)",
    re.IGNORECASE
)

CITY_YEAR_RE = re.compile(r"г\.\s*Тюмень,\s*\d{4}\s*год", re.IGNORECASE)


LEGAL_MARKERS_RE = re.compile(
    r"(стратегией\s+развития|федеральным\s+законом|распоряжением\s+правительства|"
    r"муниципальным\s+заданием|проводится\s+в\s+соответствии|в\s+соответствии\s+с|"
    r"указом\s+президента|постановлением\s+правительства)",
    re.IGNORECASE
)

def remove_page_breaks(doc):
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            if run._element.xpath('.//w:br[@w:type="page"]'):
                run._element.getparent().remove(run._element)

def normalize_docx(src: Path, dst: Path):
    doc = Document(str(src))
    blocks = list(iter_block_items(doc))

    to_delete = set()
    state = "before_title"
    has_wide_table = False

    for i, block in enumerate(blocks):
        if isinstance(block, Table):
            if state == "before_title" or state == "drop":
                to_delete.add(i)
            else:
                if len(block.columns) > 4:
                    has_wide_table = True
            continue

        text = (block.text or "").strip()
        
        if not text:
            to_delete.add(i)
            continue

        if state == "before_title":
            if "ПОЛОЖЕНИЕ" in text.upper():
                state = "unknown"
                continue
            else:
                to_delete.add(i)
                continue

        if CITY_YEAR_RE.search(text):
            to_delete.add(i)
            continue

        if LEGAL_MARKERS_RE.search(text):
            to_delete.add(i)
            continue

        if len(text) < 200:
            if KEEP_CHAPTERS.search(text):
                state = "keep"
                continue
                
            if DROP_CHAPTERS.search(text):
                state = "drop"
                to_delete.add(i)
                continue

        if state == "drop":
            to_delete.add(i)

    for i in sorted(to_delete, reverse=True):
        if i < len(blocks):
            try:
                delete_element(blocks[i])
            except Exception:
                pass

    remove_page_breaks(doc)

    if has_wide_table:
        for section in doc.sections:
            section.orientation = WD_ORIENT.LANDSCAPE
            new_width, new_height = section.page_height, section.page_width
            section.page_width = new_width
            section.page_height = new_height

    paragraphs = doc.paragraphs
    while paragraphs and not paragraphs[0].text.strip():
        p = paragraphs[0]._element
        p.getparent().remove(p)
        paragraphs = doc.paragraphs

    doc.save(str(dst))

def process_normalization(src_dir: Path, dst_dir: Path):
    dst_dir.mkdir(parents=True, exist_ok=True)
    for src in src_dir.glob("*.docx"):
        dst = dst_dir / f"{src.stem}_нормализовано.docx"
        print(f"  [Нормализация] {src.name}")
        try:
            normalize_docx(src, dst)
            print(f"    ✓ Готово: {dst.name}")
        except Exception as e:
            print(f"    ✗ Ошибка: {e}")