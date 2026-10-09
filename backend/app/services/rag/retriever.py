# -*- coding: utf-8 -*-
"""
Retriever - searches vector store and builds an LLM-ready context prompt.
Supports both semantic search and full-document overview/summary extraction.
"""
from typing import List, Tuple
from app.services.rag import vector_store
from app.core.config import settings

OVERVIEW_KEYWORDS = [
    "summary", "summarize", "about", "overview", "explain", "describe",
    "presentation", "ppt", "document", "file", "project", "topic",
    "main point", "key point", "what is this", "tell me about", "brief",
    "short", "detail", "details"
]


def is_overview_query(query: str) -> bool:
    """Check if the user is asking for an overview or summary of the uploaded document(s)."""
    q = query.lower()
    return any(k in q for k in OVERVIEW_KEYWORDS)


def retrieve_context(query: str, top_k: int = None) -> Tuple[str, List[dict]]:
    """
    Search for relevant document chunks and build a context string.

    Returns:
        context_str: formatted context string to inject into LLM prompt
        sources: list of source metadata dicts for citation display
    """
    total_docs = vector_store.get_document_count()
    if total_docs == 0:
        return "", []

    top_k = top_k or settings.TOP_K_RESULTS
    is_overview = is_overview_query(query)

    hits = []
    # If the user is asking for a summary/overview and total chunks is small (<= 15),
    # fetch all chunks in order so the LLM gets the entire presentation/document.
    if is_overview and total_docs <= 15:
        hits = vector_store.get_all_chunks(limit=15)
    else:
        # Standard semantic search
        hits = vector_store.search(query, top_k=top_k)

        # For overview queries with larger documents, also ensure first 2-3 chunks are included
        if is_overview and total_docs > 0:
            overview_chunks = vector_store.get_all_chunks(limit=3)
            existing_ids = {f"{h.get('file_id')}_{h.get('chunk_index')}" for h in hits}
            for oc in overview_chunks:
                key = f"{oc.get('file_id')}_{oc.get('chunk_index')}"
                if key not in existing_ids:
                    hits.append(oc)
                    existing_ids.add(key)

    # Fallback: if search returned no hits but documents exist, supply initial chunks
    if not hits and total_docs > 0:
        hits = vector_store.get_all_chunks(limit=top_k)

    if not hits:
        return "", []

    # Build context block
    context_parts = []
    for i, hit in enumerate(hits, 1):
        context_parts.append(
            f"[Source {i}: {hit['file_name']} (Chunk {hit.get('chunk_index', 0) + 1})]\n{hit['text']}"
        )

    context_str = "\n\n---\n\n".join(context_parts)
    return context_str, hits


def build_rag_system_prompt(context_str: str, base_prompt: str = "") -> str:
    """
    Build the final system prompt that includes retrieved context.
    """
    rag_instruction = """You are Shri, a friendly, intelligent, and accurate domain-specific AI assistant.
You have direct access to the user's uploaded documents/presentations in the knowledge base.

DOCUMENT CONTEXT:
{context}

---
INSTRUCTIONS:
1. Use the DOCUMENT CONTEXT above to thoroughly and clearly answer the user's question, summarize, or explain the material.
2. If the user asks what the document/presentation is about or asks for an explanation/summary (e.g. "what is this ppt about in short"), provide a well-structured overview covering the title, objectives, team/authors (if mentioned), key technologies, architecture, and takeaways based on the context.
3. Always cite the document name (e.g. "According to [filename]...") when presenting information.
4. If a question is completely unrelated to the documents and cannot be answered from the context, politely clarify what documents are currently loaded."""

    if base_prompt:
        return f"{base_prompt}\n\n{rag_instruction.format(context=context_str)}"
    return rag_instruction.format(context=context_str)


def has_documents() -> bool:
    """Check if any documents are loaded in the vector store."""
    return vector_store.get_document_count() > 0
