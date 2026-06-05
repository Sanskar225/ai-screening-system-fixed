import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db_models import InterviewQuestion, InterviewReport, InterviewSession
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)


class InterviewService:
    # ── Question generation ──────────────────────────────────────────────── #

    def generate_interview_questions(
        self,
        db: Session,
        session: InterviewSession,
    ) -> List[InterviewQuestion]:
        role = session.role
        skills = session.extracted_skills or []
        technologies = session.extracted_technologies or []
        experience_level = self._parse_experience_level(session)

        # ── Step 1: Build diverse retrieval queries ──
        queries = self._build_retrieval_queries(role, skills, technologies, session.resume_text or "")

        # ── Step 2: Retrieve context chunks via RAG ──
        all_context: List[Dict] = []
        seen_topics: set = set()
        for query in queries[:5]:
            chunks = rag_service.retrieve(query, role, skills, top_k=3)
            for chunk in chunks:
                if chunk["topic"] not in seen_topics:
                    seen_topics.add(chunk["topic"])
                    all_context.append(chunk)

        logger.info(
            f"[session={session.id}] RAG retrieved {len(all_context)} unique chunks "
            f"(vector_db={rag_service.using_vector_db})"
        )

        # ── Step 3: Generate questions via LLM ──
        num_q = min(settings.MAX_QUESTIONS, max(settings.MIN_QUESTIONS, 6))
        raw_questions = llm_service.generate_questions(
            role=role,
            context_chunks=all_context,
            skills=skills,
            technologies=technologies,
            experience_level=experience_level,
            num_questions=num_q,
        )

        # ── Step 4: Persist with traceability ──
        db_questions: List[InterviewQuestion] = []
        for idx, q in enumerate(raw_questions):
            # find matching context chunk for this topic
            matching_ctx = next(
                (c for c in all_context if c.get("topic") == q.get("topic")),
                all_context[0] if all_context else None,
            )
            source_info = ""
            if matching_ctx:
                source_info = (
                    f"[Source: {matching_ctx.get('source', 'knowledge base')} | "
                    f"Topic: {matching_ctx.get('topic', '')}]\n"
                    f"{matching_ctx['content'][:400]}"
                )

            db_q = InterviewQuestion(
                session_id=session.id,
                order_index=idx,
                question_text=q.get("question_text", ""),
                question_type=q.get("question_type", "conceptual"),
                difficulty=q.get("difficulty", "medium"),
                topic=q.get("topic", "General"),
                source_context=source_info,
            )
            db.add(db_q)
            db_questions.append(db_q)

        session.total_questions = len(db_questions)
        session.status = "active"
        db.commit()

        logger.info(f"[session={session.id}] {len(db_questions)} questions generated")
        return db_questions

    # ── Answer submission ────────────────────────────────────────────────── #

    def submit_answer(
        self,
        db: Session,
        session: InterviewSession,
        question: InterviewQuestion,
        answer_text: str,
    ) -> Tuple[Optional[Dict], bool]:
        # Evaluate answer
        evaluation = llm_service.evaluate_answer(
            question=question.question_text,
            answer=answer_text,
            topic=question.topic or "General",
            context=question.source_context or "",
            role=session.role,
        )

        question.answer_text = answer_text
        question.answer_analysis = evaluation.get("feedback", "")
        question.score = float(evaluation.get("score", 5.0))
        question.answered_at = datetime.utcnow()

        # ── Adaptive difficulty: adjust next question if possible ──
        session.current_question_index += 1
        is_last = session.current_question_index >= session.total_questions

        if not is_last:
            self._maybe_adapt_next_question(db, session, evaluation)

        if is_last:
            session.status = "completed"
            session.completed_at = datetime.utcnow()

        db.commit()
        return evaluation, is_last

    def _maybe_adapt_next_question(
        self,
        db: Session,
        session: InterviewSession,
        last_evaluation: Dict,
    ) -> None:
        """
        Simple adaptive logic: if candidate scored very high/low, nudge the
        difficulty of the next question.
        """
        score = float(last_evaluation.get("score", 5))
        next_q = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.session_id == session.id,
                InterviewQuestion.order_index == session.current_question_index,
                InterviewQuestion.answer_text.is_(None),
            )
            .first()
        )
        if not next_q:
            return

        difficulty_ladder = ["easy", "medium", "hard"]
        current_idx = difficulty_ladder.index(next_q.difficulty) if next_q.difficulty in difficulty_ladder else 1

        if score >= 8.5 and current_idx < 2:
            next_q.difficulty = difficulty_ladder[current_idx + 1]
            logger.info(f"Adaptive: difficulty ↑ → {next_q.difficulty}")
        elif score <= 3.5 and current_idx > 0:
            next_q.difficulty = difficulty_ladder[current_idx - 1]
            logger.info(f"Adaptive: difficulty ↓ → {next_q.difficulty}")
        db.commit()

    # ── Report generation ────────────────────────────────────────────────── #

    def generate_report(self, db: Session, session: InterviewSession) -> InterviewReport:
        questions = (
            db.query(InterviewQuestion)
            .filter(InterviewQuestion.session_id == session.id)
            .order_by(InterviewQuestion.order_index)
            .all()
        )

        qna = [
            {
                "question": q.question_text,
                "answer": q.answer_text or "",
                "topic": q.topic,
                "type": q.question_type,
                "score": q.score,
            }
            for q in questions
        ]

        evaluations = [
            {
                "score": q.score or 5.0,
                "feedback": q.answer_analysis or "",
                "strengths": [],
                "gaps": [],
            }
            for q in questions
            if q.answer_text
        ]

        report_data = llm_service.generate_report(
            role=session.role,
            candidate_name=session.candidate_name,
            questions_and_answers=qna,
            skills=session.extracted_skills or [],
            evaluations=evaluations,
        )

        existing = (
            db.query(InterviewReport)
            .filter(InterviewReport.session_id == session.id)
            .first()
        )

        if existing:
            for k, v in report_data.items():
                setattr(existing, k, v)
            db.commit()
            return existing

        report = InterviewReport(session_id=session.id, **report_data)
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    # ── Helpers ──────────────────────────────────────────────────────────── #

    def _parse_experience_level(self, session: InterviewSession) -> Dict:
        level, years = "mid", 2
        for exp in session.extracted_experience or []:
            exp_lower = exp.lower()
            if "senior" in exp_lower or "lead" in exp_lower:
                level, years = "senior", 6
            elif "junior" in exp_lower or "fresher" in exp_lower or "intern" in exp_lower:
                level, years = "junior", 1
        return {"level": level, "years": years}

    def _build_retrieval_queries(
        self,
        role: str,
        skills: List[str],
        technologies: List[str],
        resume_text: str,
    ) -> List[str]:
        queries = [
            f"{role} core concepts and fundamentals",
            "machine learning algorithms evaluation techniques",
        ]

        ml_skills = [s for s in skills if any(
            kw in s.lower()
            for kw in ["learning", "neural", "nlp", "deep", "model", "sklearn", "pytorch", "tensorflow", "transformer"]
        )]
        if ml_skills:
            queries.append(f"{' '.join(ml_skills[:3])} technical interview questions")

        tech_skills = [t for t in technologies if t in {"pytorch", "tensorflow", "sklearn", "spark", "kafka", "docker", "kubernetes"}]
        if tech_skills:
            queries.append(f"production deployment {' '.join(tech_skills[:2])}")

        role_lower = role.lower()
        if "ml" in role_lower or "ai" in role_lower:
            queries += [
                "feature engineering optimisation regularisation",
                "neural network training deep learning practical",
                "model evaluation metrics cross validation",
                "MLOps production deployment monitoring",
            ]
        elif "backend" in role_lower:
            queries += [
                "API design REST scalability microservices",
                "database indexing optimisation transactions",
            ]
        elif "data" in role_lower:
            queries += [
                "statistical analysis exploratory data analysis",
                "data pipeline feature engineering preprocessing",
            ]
        elif "research" in role_lower:
            queries += [
                "deep learning optimisation advanced architectures",
                "statistical learning theory generalisation bounds",
            ]

        return queries[:6]


interview_service = InterviewService()
