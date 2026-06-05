from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_name = Column(String, nullable=False)
    candidate_email = Column(String, nullable=True)
    role = Column(String, nullable=False)
    resume_text = Column(Text, nullable=True)
    resume_filename = Column(String, nullable=True)
    extracted_skills = Column(JSON, default=list)
    extracted_technologies = Column(JSON, default=list)
    extracted_experience = Column(JSON, default=list)
    status = Column(String, default="pending")
    current_question_index = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    questions = relationship(
        "InterviewQuestion",
        back_populates="session",
        order_by="InterviewQuestion.order_index",
    )
    report = relationship("InterviewReport", back_populates="session", uselist=False)


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="conceptual")
    difficulty = Column(String, default="medium")
    topic = Column(String, nullable=True)
    source_context = Column(Text, nullable=True)   # RAG traceability
    answer_text = Column(Text, nullable=True)
    answer_analysis = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    answered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="questions")


class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False, unique=True)
    overall_score = Column(Float, nullable=True)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    topic_scores = Column(JSON, default=dict)
    recommendation = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    detailed_feedback = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="report")
