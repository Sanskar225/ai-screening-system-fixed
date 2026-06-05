import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.db_models import InterviewSession, InterviewQuestion, InterviewReport
from app.models.schemas import ReportResponse
from app.services.interview_service import interview_service

router = APIRouter()
logger = logging.getLogger(__name__)


def _build_qna(session_id: str, db: Session):
    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session_id)
        .order_by(InterviewQuestion.order_index)
        .all()
    )
    return [
        {
            "question": q.question_text, "answer": q.answer_text or "Not answered",
            "topic": q.topic, "difficulty": q.difficulty,
            "score": q.score, "feedback": q.answer_analysis,
        }
        for q in questions
    ]


@router.post("/generate/{session_id}", response_model=ReportResponse)
def generate_report(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status not in ("completed", "active"):
        raise HTTPException(status_code=400, detail="Interview must be active or completed")

    try:
        report = interview_service.generate_report(db, session)
    except Exception as e:
        logger.error(f"Report generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

    return ReportResponse(
        id=report.id, session_id=session_id,
        candidate_name=session.candidate_name, role=session.role,
        overall_score=report.overall_score, strengths=report.strengths or [],
        weaknesses=report.weaknesses or [], topic_scores=report.topic_scores or {},
        recommendation=report.recommendation, summary=report.summary,
        detailed_feedback=report.detailed_feedback or {},
        questions_and_answers=_build_qna(session_id, db),
        created_at=report.created_at,
    )


@router.get("/{session_id}", response_model=ReportResponse)
def get_report(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    report = db.query(InterviewReport).filter(InterviewReport.session_id == session_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found. Generate it first.")

    return ReportResponse(
        id=report.id, session_id=session_id,
        candidate_name=session.candidate_name, role=session.role,
        overall_score=report.overall_score, strengths=report.strengths or [],
        weaknesses=report.weaknesses or [], topic_scores=report.topic_scores or {},
        recommendation=report.recommendation, summary=report.summary,
        detailed_feedback=report.detailed_feedback or {},
        questions_and_answers=_build_qna(session_id, db),
        created_at=report.created_at,
    )


@router.get("/", response_model=List[dict])
def list_all_reports(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    rows = (
        db.query(InterviewReport, InterviewSession)
        .join(InterviewSession, InterviewReport.session_id == InterviewSession.id)
        .order_by(InterviewReport.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    return [
        {
            "report_id": r.id, "session_id": r.session_id,
            "candidate_name": s.candidate_name, "role": s.role,
            "overall_score": r.overall_score, "recommendation": r.recommendation,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r, s in rows
    ]
