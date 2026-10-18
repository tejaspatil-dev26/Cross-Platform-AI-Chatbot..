from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cross-Platform AI Chatbot"
    API_V1_STR: str = "/api/v1"
    # AI Provider Settings
    AI_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_NUM_GPU: int = 0         # 0 = CPU only (no GPU used)
    OLLAMA_NUM_THREAD: int = 8      # Multi-threaded CPU generation (optimized for multi-core CPUs)
    OLLAMA_NUM_CTX: int = 2048      # Faster CPU prompt evaluation (avoids huge 128k KV-cache overhead)
    OLLAMA_KEEP_ALIVE: str = "60m"  # Keep model in RAM to eliminate repeated cold-boot load times
    OLLAMA_TIMEOUT: float = 120.0   # seconds
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # CPU / GPU Configuration
    FORCE_CPU: bool = True          # Force all operations (LLM & Embeddings) to run on CPU without GPU
    EMBEDDING_DEVICE: str = "cpu"   # "cpu" or "cuda"

    # RAG Configuration
    RAG_ENABLED: bool = True
    CHROMA_PERSIST_PATH: str = "./app/db/chroma"
    UPLOAD_DIR: str = "./uploaded_files"
    MAX_FILE_SIZE_MB: int = 50
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    TOP_K_RESULTS: int = 3

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()