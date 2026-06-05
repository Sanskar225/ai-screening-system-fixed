import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.db_models import InterviewSession, InterviewQuestion
from app.models.schemas import QuestionResponse, AnswerSubmit, AnswerResponse
from app.services.interview_service import interview_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/start/{session_id}")
def start_interview(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.resume_text:
        raise HTTPException(status_code=400, detail="Resume must be uploaded before starting")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    existing_questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session_id)
        .order_by(InterviewQuestion.order_index)
        .all()
    )
    if existing_questions and session.status == "active":
        first_q = existing_questions[0]
        return {
            "session_id": session_id, "status": "active",
            "total_questions": session.total_questions,
            "current_question": _serialize_question(first_q),
            "message": "Interview in progress",
        }

    try:
        questions = interview_service.generate_interview_questions(db, session)
    except Exception as e:
        logger.error(f"Question generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

    if not questions:
        raise HTTPException(status_code=500, detail="No questions were generated")

    return {
        "session_id": session_id, "status": "active",
        "total_questions": len(questions),
        "current_question": _serialize_question(questions[0]),
        "message": "Interview started successfully",
    }


@router.get("/{session_id}/question/{question_index}", response_model=QuestionResponse)
def get_question(session_id: str, question_index: int, db: Session = Depends(get_db)):
    question = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session_id, InterviewQuestion.order_index == question_index)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("/{session_id}/answer/{question_id}", response_model=AnswerResponse)
def submit_answer(session_id: str, question_id: str, payload: AnswerSubmit, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    question = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.id == question_id, InterviewQuestion.session_id == session_id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.answer_text:
        raise HTTPException(status_code=400, detail="Question already answered")
    if not payload.answer_text or len(payload.answer_text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    try:
        evaluation, is_last = interview_service.submit_answer(db, session, question, payload.answer_text)
    except Exception as e:
        logger.error(f"Answer submission failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process answer")

    next_question = None
    if not is_last:
        next_q = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.session_id == session_id,
                InterviewQuestion.order_index == session.current_question_index,
            )
            .first()
        )
        if next_q:
            next_question = QuestionResponse(
                id=next_q.id, order_index=next_q.order_index,
                question_text=next_q.question_text, question_type=next_q.question_type,
                difficulty=next_q.difficulty, topic=next_q.topic, session_id=session_id,
            )

    return AnswerResponse(
        question_id=question_id, answer_received=True,
        next_question=next_question, is_last_question=is_last,
        feedback=evaluation.get("feedback") if evaluation else None,
    )


@router.get("/{session_id}/questions", response_model=List[QuestionResponse])
def get_all_questions(session_id: str, db: Session = Depends(get_db)):
    return (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.session_id == session_id)
        .order_by(InterviewQuestion.order_index)
        .all()
    )


@router.get("/{session_id}/status")
def get_interview_status(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session_id, "status": session.status,
        "current_question_index": session.current_question_index,
        "total_questions": session.total_questions,
        "candidate_name": session.candidate_name, "role": session.role,
        "progress_percent": (
            round(session.current_question_index / session.total_questions * 100)
            if session.total_questions > 0 else 0
        ),
    }


def _serialize_question(q: InterviewQuestion) -> dict:
    return {
        "id": q.id, "order_index": q.order_index,
        "question_text": q.question_text, "question_type": q.question_type,
        "difficulty": q.difficulty, "topic": q.topic, "session_id": q.session_id,
    }
