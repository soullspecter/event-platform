import shutil
import subprocess
import os
from pathlib import Path
from src.utils import sanitize_filename

def convert_via_word(src: Path, dst: Path) -> bool:
    """Конвертирует .doc в .docx через установленный MS Word."""
    try:
        import win32com.client
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        word.DisplayAlerts = False
        
        try:
            doc = word.Documents.Open(str(src.absolute()))
            doc.SaveAs(str(dst.absolute()), FileFormat=16)
            doc.Close()
            return True
        finally:
            word.Quit()
    except Exception as e:
        print(f"    [Word] не удалось: {e}")
        return False

def get_soffice_path():
    """Ищет soffice.exe для фоллбэка (если Word не сработает)."""
    if shutil.which("soffice"):
        return "soffice"
    if os.name == 'nt':
        possible_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
        for p in possible_paths:
            if os.path.exists(p):
                return p
    return None

def process_conversion(src_dir: Path, dst_dir: Path):
    """Находит все .doc/.docx в src_dir, конвертирует в .docx и складывает в dst_dir."""
    dst_dir.mkdir(parents=True, exist_ok=True)
    
    files = [p for p in src_dir.iterdir() if p.suffix.lower() in (".doc", ".docx") and not p.name.startswith("~$")]
    
    for src in files:
        clean_name = sanitize_filename(src.stem)
        dst = dst_dir / f"{clean_name}.docx"
        
        if dst.exists():
            print(f"  [Пропуск] Уже сконвертирован: {dst.name}")
            continue

        if src.suffix.lower() == ".docx":
            shutil.copy(src, dst)
            print(f"  [Копия] {src.name} -> {dst.name}")
            continue

        print(f"  [Конвертация] {src.name}...")
        
        # 1. Пытаемся через MS Word
        if convert_via_word(src, dst):
            print(f"    ✓ Успешно (через Word)")
            continue

        # 2. Fallback на LibreOffice
        soffice_path = get_soffice_path()
        if soffice_path:
            try:
                subprocess.run(
                    [soffice_path, "--headless", "--convert-to", "docx", "--outdir", str(dst_dir), str(src)],
                    check=True, capture_output=True, timeout=120
                )
                orig_dst = dst_dir / f"{src.stem}.docx"
                if orig_dst.exists() and orig_dst != dst:
                    orig_dst.rename(dst)
                if dst.exists():
                    print(f"    ✓ Успешно (через LibreOffice)")
                    continue
            except Exception as e:
                print(f"    [LibreOffice] не удалось: {e}")

        print(f"    ✗ ОШИБКА: Не удалось сконвертировать {src.name}")