from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.db_models import InterviewSession
from app.models.schemas import SessionCreate, SessionResponse, RoleInfo

router = APIRouter()

AVAILABLE_ROLES = [
    RoleInfo(id="ai_ml", name="AI/ML Engineer", description="Machine learning, deep learning, model development and deployment", key_topics=["Supervised Learning", "Deep Learning", "NLP", "MLOps", "Model Evaluation"]),
    RoleInfo(id="data_science", name="Data Scientist", description="Data analysis, statistical modelling, and applied machine learning", key_topics=["EDA", "Statistical Learning", "Feature Engineering", "Model Evaluation"]),
    RoleInfo(id="backend", name="Backend Engineer", description="Server-side development, API design, and system architecture", key_topics=["API Design", "Database Design", "System Scalability", "Microservices"]),
    RoleInfo(id="ml_research", name="ML Research Engineer", description="Advanced ML research, novel architectures, and theoretical foundations", key_topics=["Deep Learning Theory", "Optimisation", "NLP/CV Research", "Statistical Learning"]),
    RoleInfo(id="fullstack", name="Full Stack Engineer", description="End-to-end development covering frontend, backend, and infrastructure", key_topics=["API Design", "Database Design", "System Design", "DevOps"]),
]


@router.get("/roles", response_model=List[RoleInfo])
def get_available_roles():
    return AVAILABLE_ROLES


@router.post("/", response_model=SessionResponse)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    valid_roles = [r.name for r in AVAILABLE_ROLES]
    if payload.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {valid_roles}")
    session = InterviewSession(candidate_name=payload.candidate_name, candidate_email=payload.candidate_email, role=payload.role, status="pending")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/", response_model=List[SessionResponse])
def list_sessions(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).offset(skip).limit(limit).all()
