from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "AI Screening System"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./screening.db"

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    LLM_PROVIDER: str = "anthropic"
    LLM_MODEL: str = "claude-3-haiku-20240307"

    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    CHROMA_PERSIST_DIR: str = "./chroma_db"

    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    TOP_K_RETRIEVAL: int = 5

    MAX_QUESTIONS: int = 8
    MIN_QUESTIONS: int = 5

    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs("./data/books", exist_ok=True)
