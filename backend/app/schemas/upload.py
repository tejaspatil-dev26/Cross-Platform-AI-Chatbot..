from pydantic import BaseModel
from typing import List, Optional


class UploadResponse(BaseModel):
    file_id: str
    file_name: str
    file_type: str
    file_size: int
    chunks_count: int
    status: str
    message: str


class DocumentInfo(BaseModel):
    file_id: str
    file_name: str
    file_type: str
    chunks_count: int = 0


class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total_documents: int
    total_chunks: int


class DeleteResponse(BaseModel):
    file_id: str
    chunks_deleted: int
    status: str
    message: str
