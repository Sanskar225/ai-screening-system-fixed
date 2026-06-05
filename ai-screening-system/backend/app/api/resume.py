import os
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.db_models import InterviewSession
from app.models.schemas import ResumeUploadResponse
from app.services.resume_service import parse_resume

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload/{session_id}", response_model=ResumeUploadResponse)
async def upload_resume(session_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status not in ("pending", "active"):
        raise HTTPException(status_code=400, detail="Session is not in a valid state for resume upload")

    filename = file.filename or "resume.txt"
    if not (filename.endswith(".pdf") or filename.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    save_path = os.path.join(settings.UPLOAD_DIR, f"{session_id}_{filename}")
    with open(save_path, "wb") as f:
        f.write(content)

    try:
        parsed = parse_resume(content, filename, session.role)
    except Exception as e:
        logger.error(f"Resume parsing failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse resume")

    session.resume_text = parsed["text"]
    session.resume_filename = filename
    session.extracted_skills = parsed["skills"]
    session.extracted_technologies = parsed["technologies"]
    session.extracted_experience = parsed["experience"]
    db.commit()

    return ResumeUploadResponse(
        session_id=session_id,
        extracted_skills=parsed["skills"],
        extracted_technologies=parsed["technologies"],
        extracted_experience=parsed["experience"],
        resume_preview=parsed.get("preview", parsed["text"][:300]),
    )
