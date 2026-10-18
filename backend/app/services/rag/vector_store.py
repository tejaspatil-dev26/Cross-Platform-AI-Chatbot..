"""
Vector Store � ChromaDB wrapper for storing and searching document embeddings.
Persists to disk automatically. No external server required.
"""
import os
import uuid
import logging
from typing import List, Dict, Optional
from app.core.config import settings

# Force offline loading for cached HuggingFace models to avoid online check delays
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

logger = logging.getLogger(__name__)

# Lazy-loaded ChromaDB client (initialized on first use)
_chroma_client = None
_collection = None
_embedder = None


def _get_embedder():
    """Load sentence-transformer embedding model (lazy, cached)."""
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            device = "cpu" if settings.FORCE_CPU else settings.EMBEDDING_DEVICE
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL} on device: {device}")
            _embedder = SentenceTransformer(settings.EMBEDDING_MODEL, device=device)
            logger.info(f"Embedding model loaded successfully on device '{device}'.")
        except ImportError:
            logger.error("sentence-transformers not installed. Run: pip install sentence-transformers")
            raise
    return _embedder


def _get_collection():
    """Get or create ChromaDB collection (lazy, cached)."""
    global _chroma_client, _collection
    if _collection is None:
        try:
            import chromadb
            os.makedirs(settings.CHROMA_PERSIST_PATH, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_PATH)
            _collection = _chroma_client.get_or_create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"ChromaDB collection ready. Documents: {_collection.count()}")
        except ImportError:
            logger.error("chromadb not installed. Run: pip install chromadb")
            raise
    return _collection


def add_document(chunks: List[str], file_id: str, file_name: str, file_type: str) -> int:
    """
    Add document chunks to vector store.
    Returns number of chunks added.
    """
    if not chunks:
        return 0

    collection = _get_collection()
    embedder = _get_embedder()

    embeddings = embedder.encode(chunks).tolist()

    ids = [f"{file_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "file_id": file_id,
            "file_name": file_name,
            "file_type": file_type,
            "chunk_index": i,
        }
        for i in range(len(chunks))
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    logger.info(f"Added {len(chunks)} chunks for '{file_name}' (id={file_id})")
    return len(chunks)


def search(query: str, top_k: int = None, file_id: str = None) -> List[Dict]:
    """
    Search for relevant chunks given a query string.
    Returns list of dicts with 'text', 'file_name', 'score'.
    """
    top_k = top_k or settings.TOP_K_RESULTS
    collection = _get_collection()

    if collection.count() == 0:
        return []

    embedder = _get_embedder()
    query_embedding = embedder.encode([query]).tolist()

    query_kwargs = {
        "query_embeddings": query_embedding,
        "n_results": min(top_k, collection.count()),
        "include": ["documents", "metadatas", "distances"],
    }
    if file_id:
        query_kwargs["where"] = {"file_id": file_id}

    results = collection.query(**query_kwargs)

    hits = []
    if results and results["documents"]:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            score = round(1 - dist, 4)
            hits.append({
                "text": doc,
                "file_name": meta.get("file_name", "Unknown"),
                "file_id": meta.get("file_id", ""),
                "chunk_index": meta.get("chunk_index", 0),
                "score": score,
            })

    return hits


def get_all_chunks(limit: int = 20) -> List[Dict]:
    """Retrieve stored chunks directly (ordered by index) for whole-document summaries."""
    collection = _get_collection()
    if collection.count() == 0:
        return []
    try:
        data = collection.get(limit=limit, include=["documents", "metadatas"])
        chunks = []
        if data and data.get("documents"):
            for doc, meta in zip(data["documents"], data["metadatas"]):
                chunks.append({
                    "text": doc,
                    "file_name": meta.get("file_name", "Unknown"),
                    "file_id": meta.get("file_id", ""),
                    "chunk_index": meta.get("chunk_index", 0),
                    "score": 1.0,
                })
        # Sort chunks by file_name and chunk_index so documents read in order
        chunks.sort(key=lambda x: (x.get("file_name", ""), x.get("chunk_index", 0)))
        return chunks
    except Exception as e:
        logger.error(f"Error fetching document chunks: {e}")
        return []


def delete_document(file_id: str) -> int:
    """Remove all chunks for a given file_id. Returns chunks deleted."""
    collection = _get_collection()
    try:
        existing = collection.get(where={"file_id": file_id})
        if existing and existing["ids"]:
            collection.delete(ids=existing["ids"])
            count = len(existing["ids"])
            logger.info(f"Deleted {count} chunks for file_id={file_id}")
            return count
    except Exception as e:
        logger.error(f"Error deleting document {file_id}: {e}")
    return 0


def list_documents() -> List[Dict]:
    """Return list of unique documents in the vector store."""
    collection = _get_collection()
    if collection.count() == 0:
        return []

    try:
        all_items = collection.get(include=["metadatas"])
        seen = {}
        for meta in all_items["metadatas"]:
            fid = meta.get("file_id")
            if fid and fid not in seen:
                seen[fid] = {
                    "file_id": fid,
                    "file_name": meta.get("file_name", "Unknown"),
                    "file_type": meta.get("file_type", "unknown"),
                }
        return list(seen.values())
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        return []


def get_document_count() -> int:
    """Return total number of stored chunks."""
    try:
        return _get_collection().count()
    except Exception:
        return 0
