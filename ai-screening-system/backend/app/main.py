from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api import sessions, resume, interview, reports
from app.core.database import engine, Base
from app.core.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Candidate Screening System",
    description="RAG-powered intelligent interview system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])


@app.get("/health")
def health_check():
    from app.services.rag_service import rag_service
    return {
        "status": "ok",
        "version": "1.0.0",
        "rag_backend": "chromadb" if rag_service.using_vector_db else "keyword-fallback",
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
