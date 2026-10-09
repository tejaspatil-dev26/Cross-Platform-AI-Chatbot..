from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cross-Platform AI Chatbot"
    API_V1_STR: str = "/api/v1"
    AI_PROVIDER: str = "mock"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    GEMINI_API_KEY: str = ""

    # RAG Configuration
    RAG_ENABLED: bool = True
    CHROMA_PERSIST_PATH: str = "./app/db/chroma"
    UPLOAD_DIR: str = "./uploaded_files"
    MAX_FILE_SIZE_MB: int = 50
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 100
    TOP_K_RESULTS: int = 6

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()