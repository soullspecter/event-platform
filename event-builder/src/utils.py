import re
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph
from config.settings import DROP_LINE_RE

def sanitize_filename(name: str) -> str:
    name = re.sub(r'[^\w\s\-]', '', name)
    name = re.sub(r'[\s_]+', ' ', name).strip()
    return name

def is_service_line(text: str) -> bool:
    """Проверяет, является ли строка служебной."""
    t = text.strip()
    if not t:
        return False
    for regex in DROP_LINE_RE:
        if regex.search(t):
            return True
    return False

def iter_block_items(parent):
    body = parent.element.body
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, parent)
        elif child.tag == qn("w:tbl"):
            yield Table(child, parent)

def delete_element(el):
    el._element.getparent().remove(el._element)