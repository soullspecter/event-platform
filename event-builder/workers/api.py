
import shutil
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.converter import process_conversion
from src.normalizer import process_normalization
from src.exporter import process_markdown_export
from src.table_parser.column_filter import process_column_filter

from gigachat_test.api_client import create_event_draft, EventsApiError
from gigachat_test.run_test import extract_event

load_dotenv()

app = FastAPI(title="Event Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


def send_to_events_api(payload):
    """Передаёт готовый JSON в NestJS без изменений."""
    return create_event_draft(payload)


@app.post("/drafts/from-json")
def drafts_from_json(payload: dict):
    try:
        result = send_to_events_api(payload)
        return JSONResponse(content=result, status_code=201)
    except EventsApiError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/drafts/from-document")
async def drafts_from_document(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in (".doc", ".docx", ".md"):
        raise HTTPException(
            status_code=400,
            detail="Поддерживаются .doc, .docx, .md",
        )

    tmp_dir = Path(tempfile.mkdtemp(prefix="event-builder-"))

    tmp_input = tmp_dir / "input"
    tmp_raw = tmp_dir / "raw_converted"
    tmp_output = tmp_dir / "output"
    tmp_tables = tmp_dir / "output_tables"
    tmp_md = tmp_dir / "markdown"

    try:
        tmp_input.mkdir()

        uploaded = tmp_input / (file.filename or f"upload{suffix}")
        uploaded.write_bytes(await file.read())

        if suffix == ".md":
            tmp_md.mkdir()
            shutil.copy(uploaded, tmp_md / f"{uploaded.stem}.md")
        else:
            process_conversion(tmp_input, tmp_raw)
            process_normalization(tmp_raw, tmp_output)
            process_column_filter(tmp_output, tmp_tables)
            process_markdown_export(tmp_output, tmp_md)

        md_files = sorted(tmp_md.glob("*.md"))

        if not md_files:
            raise HTTPException(
                status_code=500,
                detail="Markdown не создан",
            )

        markdown = md_files[0].read_text(encoding="utf-8")
        payload = extract_event(markdown)

        result = send_to_events_api(payload)

        return JSONResponse(content=result, status_code=201)

    except EventsApiError as e:
        raise HTTPException(status_code=502, detail=str(e))

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
