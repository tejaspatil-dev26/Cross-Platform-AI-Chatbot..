"""
Document Processor � extracts raw text from all supported file types.
Supported: PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, TXT, MD, CSV, JSON,
           XML, HTML, RTF, images (PNG, JPG, JPEG, GIF, WEBP, BMP, TIFF),
           code files (PY, JS, TS, JAVA, CPP, C, CS)
"""
import os
import mimetypes
import logging
import chardet
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# -- PDF ------------------------------------------------------------------------
def _extract_pdf(file_path: str) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction error for {file_path}: {e}")
        return ""

# -- DOCX -----------------------------------------------------------------------
def _extract_docx(file_path: str) -> str:
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        # Also extract tables
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)
        return "\n".join(paragraphs)
    except Exception as e:
        logger.error(f"DOCX extraction error for {file_path}: {e}")
        return ""

# -- PPTX -----------------------------------------------------------------------
def _extract_shape_text(shape) -> List[str]:
    """Recursively extract all text lines from a PowerPoint shape, table, or group."""
    lines = []
    # 1. Text frames
    if hasattr(shape, "has_text_frame") and shape.has_text_frame:
        for p in shape.text_frame.paragraphs:
            txt = p.text.strip()
            if txt:
                lines.append(txt)
    elif hasattr(shape, "text") and shape.text.strip():
        lines.append(shape.text.strip())

    # 2. Tables
    if hasattr(shape, "has_table") and shape.has_table:
        for row in shape.table.rows:
            row_cells = [cell.text.strip().replace("\n", " ") for cell in row.cells if cell.text.strip()]
            if row_cells:
                lines.append(" | ".join(row_cells))

    # 3. Grouped shapes (recursive)
    if hasattr(shape, "shapes"):
        for sub_shape in shape.shapes:
            lines.extend(_extract_shape_text(sub_shape))

    return lines


def _extract_pptx(file_path: str) -> str:
    try:
        from pptx import Presentation
        prs = Presentation(file_path)
        slides_text = []
        for i, slide in enumerate(prs.slides, 1):
            slide_lines = [f"--- Slide {i} ---"]
            for shape in slide.shapes:
                slide_lines.extend(_extract_shape_text(shape))

            # Extract speaker notes if present
            if hasattr(slide, "has_notes_slide") and slide.has_notes_slide:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    slide_lines.append(f"[Notes: {notes}]")

            slides_text.append("\n".join(slide_lines))
        return "\n\n".join(slides_text).strip()
    except Exception as e:
        logger.error(f"PPTX extraction error for {file_path}: {e}")
        return ""

# -- XLSX -----------------------------------------------------------------------
def _extract_xlsx(file_path: str) -> str:
    try:
        import openpyxl
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        rows_text = []
        for sheet in wb.worksheets:
            rows_text.append(f"--- Sheet: {sheet.title} ---")
            for row in sheet.iter_rows(values_only=True):
                row_str = " | ".join(str(cell) for cell in row if cell is not None)
                if row_str.strip():
                    rows_text.append(row_str)
        return "\n".join(rows_text)
    except Exception as e:
        return f"[XLSX extraction error: {e}]"

# -- Image OCR ------------------------------------------------------------------
def _extract_image(file_path: str) -> str:
    try:
        from PIL import Image
        import pytesseract
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        if text.strip():
            return text.strip()
        return "[Image uploaded � no text detected via OCR. Image is stored for context.]"
    except ImportError:
        return "[Image OCR not available: install Tesseract OCR from https://github.com/UB-Mannheim/tesseract/wiki]"
    except Exception as e:
        return f"[Image OCR error: {e}]"

# -- Plain text / code / CSV / JSON / XML / HTML / RTF -------------------------
def _extract_text(file_path: str) -> str:
    try:
        # Auto-detect encoding
        with open(file_path, "rb") as f:
            raw = f.read()
        detected = chardet.detect(raw)
        encoding = detected.get("encoding") or "utf-8"
        return raw.decode(encoding, errors="replace").strip()
    except Exception as e:
        return f"[Text extraction error: {e}]"

def _extract_rtf(file_path: str) -> str:
    try:
        from striprtf.striprtf import rtf_to_text
        with open(file_path, "r", errors="replace") as f:
            content = f.read()
        return rtf_to_text(content).strip()
    except Exception as e:
        return _extract_text(file_path)

# -- Public API -----------------------------------------------------------------
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".tif"}
DOCUMENT_EXTENSIONS = {
    ".pdf": _extract_pdf,
    ".docx": _extract_docx,
    ".doc": _extract_docx,
    ".pptx": _extract_pptx,
    ".ppt": _extract_pptx,
    ".xlsx": _extract_xlsx,
    ".xls": _extract_xlsx,
    ".rtf": _extract_rtf,
}

def extract_text_from_file(file_path: str) -> str:
    """Main entry point � detects file type and extracts text."""
    ext = Path(file_path).suffix.lower()

    if ext in DOCUMENT_EXTENSIONS:
        return DOCUMENT_EXTENSIONS[ext](file_path)

    if ext in IMAGE_EXTENSIONS:
        return _extract_image(file_path)

    # Default: treat as text (TXT, MD, CSV, JSON, XML, HTML, PY, JS, TS, etc.)
    return _extract_text(file_path)


def is_supported_file(filename: str) -> bool:
    """Returns True if the file extension is supported and not a temp/lock file."""
    base = Path(filename).name
    # Ignore Windows/Office lock files (e.g. ~$document.docx), hidden files, and desktop metadata
    if base.startswith("~$") or base.startswith(".") or base in ("Thumbs.db", "desktop.ini"):
        return False

    ext = Path(filename).suffix.lower()
    supported = (
        set(DOCUMENT_EXTENSIONS.keys())
        | IMAGE_EXTENSIONS
        | {".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm",
           ".py", ".js", ".ts", ".java", ".cpp", ".c", ".cs", ".go",
           ".rs", ".rb", ".php", ".yaml", ".yml", ".toml", ".ini", ".cfg"}
    )
    return ext in supported
