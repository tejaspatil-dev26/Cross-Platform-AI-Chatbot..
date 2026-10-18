import os
import uuid
import shutil
import logging
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status

from app.core.config import settings
from app.schemas.upload import UploadResponse, DocumentListResponse, DocumentInfo, DeleteResponse
from app.services.rag import document_processor, chunker, vector_store

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=UploadResponse)
@router.post("/", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):

    """
    Upload a document or image, extract text, chunk it, and index it into the vector store.
    Supported: PDF, DOCX, PPTX, XLSX, TXT, MD, CSV, JSON, XML, HTML, Images (PNG, JPG, etc.), Code
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )

    # Check extension support
    if not document_processor.is_supported_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported types include PDF, DOCX, PPTX, XLSX, TXT, CSV, MD, images, and code files."
        )

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    file_id = str(uuid.uuid4())[:8]
    sanitized_name = Path(file.filename).name
    saved_filename = f"{file_id}_{sanitized_name}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    # Save file to disk
    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Check file size limit
    file_size = os.path.getsize(saved_path)
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        try:
            os.remove(saved_path)
        except OSError:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
        )

    # Extract text from file
    try:
        extracted_text = document_processor.extract_text_from_file(saved_path)
    except Exception as e:
        logger.error(f"Extraction failed for {file.filename}: {e}")
        extracted_text = ""

    ext = Path(file.filename).suffix.lower()

    if not extracted_text or not extracted_text.strip():
        return UploadResponse(
            file_id=file_id,
            file_name=sanitized_name,
            file_type=ext,
            file_size=file_size,
            chunks_count=0,
            status="empty",
            message=f"File saved, but no readable text could be extracted."
        )

    # Chunk text
    chunks = chunker.chunk_text(extracted_text)

    # Store in ChromaDB vector store
    chunks_count = 0
    try:
        chunks_count = vector_store.add_document(
            chunks=chunks,
            file_id=file_id,
            file_name=sanitized_name,
            file_type=ext,
        )
    except Exception as e:
        logger.error(f"Failed to index document into vector store: {e}")
        return UploadResponse(
            file_id=file_id,
            file_name=sanitized_name,
            file_type=ext,
            file_size=file_size,
            chunks_count=0,
            status="error",
            message=f"File saved, but embedding indexing failed: {str(e)}"
        )

    return UploadResponse(
        file_id=file_id,
        file_name=sanitized_name,
        file_type=ext,
        file_size=file_size,
        chunks_count=chunks_count,
        status="success",
        message=f"Successfully processed and indexed into knowledge base ({chunks_count} chunks)."
    )


@router.get("/files", response_model=DocumentListResponse)
@router.get("/files/", response_model=DocumentListResponse)
async def list_uploaded_files():

    """List all documents currently in the RAG knowledge base."""
    docs = vector_store.list_documents()
    total_chunks = vector_store.get_document_count()
    return DocumentListResponse(
        documents=[
            DocumentInfo(
                file_id=d["file_id"],
                file_name=d["file_name"],
                file_type=d["file_type"],
                chunks_count=d.get("chunks_count", 0),
            )
            for d in docs
        ],
        total_documents=len(docs),
        total_chunks=total_chunks,
    )


@router.delete("/{file_id}", response_model=DeleteResponse)
async def delete_uploaded_file(file_id: str):
    """Remove a document and its chunks from the knowledge base."""
    deleted_count = vector_store.delete_document(file_id)

    # Also clean up the physical file from disk if it exists
    if os.path.exists(settings.UPLOAD_DIR):
        for f in os.listdir(settings.UPLOAD_DIR):
            if f.startswith(f"{file_id}_"):
                try:
                    os.remove(os.path.join(settings.UPLOAD_DIR, f))
                except OSError:
                    pass

    return DeleteResponse(
        file_id=file_id,
        chunks_deleted=deleted_count,
        status="deleted",
        message=f"Document removed from knowledge base."
    )
