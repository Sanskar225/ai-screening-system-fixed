from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class SessionCreate(BaseModel):
    candidate_name: str
    candidate_email: Optional[str] = None
    role: str


class SessionResponse(BaseModel):
    id: str
    candidate_name: str
    candidate_email: Optional[str]
    role: str
    status: str
    current_question_index: int
    total_questions: int
    extracted_skills: List[str]
    extracted_technologies: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeUploadResponse(BaseModel):
    session_id: str
    extracted_skills: List[str]
    extracted_technologies: List[str]
    extracted_experience: List[str]
    resume_preview: str


class QuestionResponse(BaseModel):
    id: str
    order_index: int
    question_text: str
    question_type: str
    difficulty: str
    topic: Optional[str]
    session_id: str

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    answer_text: str


class AnswerResponse(BaseModel):
    question_id: str
    answer_received: bool
    next_question: Optional[QuestionResponse]
    is_last_question: bool
    feedback: Optional[str] = None


class ReportResponse(BaseModel):
    id: str
    session_id: str
    candidate_name: str
    role: str
    overall_score: Optional[float]
    strengths: List[str]
    weaknesses: List[str]
    topic_scores: Dict[str, Any]
    recommendation: Optional[str]
    summary: Optional[str]
    detailed_feedback: Dict[str, Any]
    questions_and_answers: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class RoleInfo(BaseModel):
    id: str
    name: str
    description: str
    key_topics: List[str]
