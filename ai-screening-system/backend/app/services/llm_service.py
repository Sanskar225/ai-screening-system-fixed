import json
import logging
import re
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        from app.core.config import settings
        self.provider = settings.LLM_PROVIDER
        self.model = settings.LLM_MODEL
        self._client = None

    def _get_client(self):
        if self._client:
            return self._client

        from app.core.config import settings

        if self.provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            try:
                import anthropic

                self._client = anthropic.Anthropic(
                    api_key=settings.ANTHROPIC_API_KEY
                )

                logger.info("Anthropic client initialised")
                return self._client

            except Exception as e:
                logger.warning(f"Anthropic init failed: {e}")

        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI

                print("OPENROUTER KEY FOUND:", settings.OPENAI_API_KEY[:15])
                print("MODEL:", self.model)

                self._client = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url="https://openrouter.ai/api/v1"
                )

                self.provider = "openai"

                logger.info("OpenAI/OpenRouter client initialised")
                return self._client

            except Exception as e:
                logger.warning(f"OpenAI init failed: {e}")

        logger.warning("No LLM client available — using rule-based fallback")
        return None

    def _call_llm(self, prompt: str, system: str = "", max_tokens: int = 1500) -> str:
        """Call LLM with clean error handling."""
        client = self._get_client()
        if client is None:
            return ""

        try:
            if self.provider == "anthropic":
                message = client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    system=system,
                    messages=[{"role": "user", "content": prompt}],
                )
                return message.content[0].text

            elif self.provider == "openai":
                messages = []
                if system:
                    messages.append({"role": "system", "content": system})
                messages.append({"role": "user", "content": prompt})
                response = client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=max_tokens,
                )
                return response.choices[0].message.content

        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            return ""

    # ------------------------------------------------------------------ #
    #  Question generation                                                  #
    # ------------------------------------------------------------------ #
    def generate_questions(
        self,
        role: str,
        context_chunks: List[Dict],
        skills: List[str],
        technologies: List[str],
        experience_level: Dict,
        previous_questions: List[str] = None,
        num_questions: int = 8,
    ) -> List[Dict]:
        context_text = "\n\n".join(
            f"[Topic: {c['topic']}]\n{c['content']}" for c in context_chunks[:5]
        )
        skills_str = ", ".join(skills[:10]) if skills else "general programming"
        tech_str = ", ".join(technologies[:8]) if technologies else "standard tools"
        level = experience_level.get("level", "mid")
        years = experience_level.get("years", 2)

        prev_q_str = ""
        if previous_questions:
            prev_q_str = f"\nAlready asked: {', '.join(previous_questions[:3])}\nDo NOT repeat these."

        difficulty_hint = {
            "junior": "foundational concepts and basic understanding",
            "mid": "deeper understanding, trade-offs, and practical application",
            "senior": "architectural decisions, advanced topics, and system design",
        }.get(level, "practical understanding")

        system = (
            "You are an expert technical interviewer. Generate insightful, specific interview "
            "questions grounded in the provided knowledge-base context. Return ONLY valid JSON."
        )
        prompt = f"""Generate {num_questions} interview questions for a **{role}** candidate.

## Candidate Profile
- Experience: {years} years ({level} level)
- Key Skills: {skills_str}
- Technologies: {tech_str}
{prev_q_str}

## Knowledge-Base Context (ground your questions in this material)
{context_text[:3500]}

## Requirements
- Mix: 40% conceptual, 40% applied/practical, 20% scenario/behavioural
- Difficulty: {difficulty_hint}
- Reference candidate's actual skills where relevant
- Questions must be SPECIFIC, not generic

Return ONLY a JSON array:
[
  {{
    "question_text": "...",
    "question_type": "conceptual|applied|behavioral",
    "difficulty": "easy|medium|hard",
    "topic": "topic name",
    "source_hint": "brief phrase from context that inspired this question"
  }}
]"""

        response = self._call_llm(prompt, system, max_tokens=2000)
        if response:
            try:
                json_match = re.search(r"\[.*\]", response, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group())
                    if isinstance(questions, list) and questions:
                        return questions[:num_questions]
            except Exception as e:
                logger.error(f"Failed to parse question JSON: {e}\nRaw: {response[:300]}")

        return self._generate_fallback_questions(
            role, context_chunks, skills, technologies, experience_level
        )

    def _generate_fallback_questions(
        self,
        role: str,
        context_chunks: List[Dict],
        skills: List[str],
        technologies: List[str],
        experience_level: Dict,
    ) -> List[Dict]:
        """Template-based fallback when LLM is unavailable."""
        level = experience_level.get("level", "mid")
        questions: List[Dict] = []

        templates = {
            "Supervised Learning": [
                {"q": "Explain the bias-variance tradeoff and how you address it.", "type": "conceptual", "diff": "medium"},
                {"q": "When would you choose gradient boosting over a neural network for classification?", "type": "applied", "diff": "medium"},
                {"q": "Walk me through handling a highly imbalanced dataset.", "type": "applied", "diff": "medium"},
            ],
            "Neural Networks and Deep Learning": [
                {"q": "Explain backpropagation and why vanishing gradients occur.", "type": "conceptual", "diff": "medium"},
                {"q": "Compare batch normalisation vs layer normalisation.", "type": "applied", "diff": "hard"},
                {"q": "How does Transformer attention differ from RNN-based sequence modelling?", "type": "conceptual", "diff": "hard"},
            ],
            "Model Evaluation and Validation": [
                {"q": "Why is accuracy a poor metric for imbalanced classification?", "type": "conceptual", "diff": "easy"},
                {"q": "Explain k-fold cross-validation and its limitations.", "type": "conceptual", "diff": "easy"},
                {"q": "How would you detect and handle data leakage in your ML pipeline?", "type": "applied", "diff": "hard"},
            ],
            "Natural Language Processing": [
                {"q": "Explain how BERT differs from GPT in architecture and training objective.", "type": "conceptual", "diff": "medium"},
                {"q": "What is RAG and when would you use it over fine-tuning an LLM?", "type": "applied", "diff": "medium"},
            ],
            "Feature Engineering and Selection": [
                {"q": "How do you decide between L1 and L2 regularisation?", "type": "conceptual", "diff": "medium"},
                {"q": "Describe your approach to handling missing values in production.", "type": "applied", "diff": "medium"},
            ],
            "MLOps and Production ML": [
                {"q": "How would you monitor a deployed ML model for performance degradation?", "type": "applied", "diff": "hard"},
                {"q": "Describe a strategy for rolling out a new model version with minimal risk.", "type": "applied", "diff": "hard"},
            ],
            "System Design and Scalability": [
                {"q": "How would you design a URL shortener that handles 10,000 requests per second?", "type": "applied", "diff": "hard"},
                {"q": "Explain the CAP theorem and a real-world scenario where you had to choose between consistency and availability.", "type": "conceptual", "diff": "hard"},
                {"q": "Describe how you would implement distributed caching to reduce database load.", "type": "applied", "diff": "medium"},
            ],
            "API Design and REST": [
                {"q": "What makes a good REST API design? Give examples of common mistakes.", "type": "conceptual", "diff": "medium"},
                {"q": "How would you design rate limiting for a public API?", "type": "applied", "diff": "medium"},
            ],
            "Database Design": [
                {"q": "When would you choose a NoSQL database over a relational one?", "type": "applied", "diff": "medium"},
                {"q": "Explain indexing strategies and when indexes hurt rather than help.", "type": "conceptual", "diff": "medium"},
            ],
        }

        used_topics: set = set()
        for chunk in context_chunks:
            topic = chunk.get("topic", "General")
            if topic in templates and topic not in used_topics:
                for t in templates[topic][:2]:
                    questions.append({
                        "question_text": t["q"],
                        "question_type": t["type"],
                        "difficulty": t["diff"],
                        "topic": topic,
                        "source_hint": f"From {topic} section of knowledge base",
                    })
                    used_topics.add(topic)
                    if len(questions) >= 8:
                        break

        # Skill-specific add-ons
        skills_lower = [s.lower() for s in skills]
        if "pytorch" in skills_lower and len(questions) < 8:
            questions.append({
                "question_text": "Explain how autograd works in PyTorch and when you'd use .detach().",
                "question_type": "applied", "difficulty": "hard",
                "topic": "Neural Networks and Deep Learning",
                "source_hint": "Candidate has PyTorch experience",
            })
        if "kafka" in skills_lower and len(questions) < 8:
            questions.append({
                "question_text": "How does Kafka guarantee message durability and at-least-once delivery?",
                "question_type": "conceptual", "difficulty": "medium",
                "topic": "System Design and Scalability",
                "source_hint": "Candidate has Kafka experience",
            })

        # Generic behavioural fill
        if len(questions) < 5:
            questions += [
                {"question_text": f"What drew you to the {role} field?", "question_type": "behavioral", "difficulty": "easy", "topic": "General", "source_hint": ""},
                {"question_text": "Describe the most challenging technical problem you've solved.", "question_type": "behavioral", "difficulty": "medium", "topic": "Experience", "source_hint": ""},
                {"question_text": "How do you stay updated with the latest developments in your field?", "question_type": "behavioral", "difficulty": "easy", "topic": "General", "source_hint": ""},
            ]

        return questions[:8]

    # ------------------------------------------------------------------ #
    #  Answer evaluation                                                    #
    # ------------------------------------------------------------------ #
    def evaluate_answer(
        self,
        question: str,
        answer: str,
        topic: str,
        context: str = "",
        role: str = "",
    ) -> Dict:
        if not answer or len(answer.strip()) < 20:
            return {
                "score": 1.0,
                "feedback": "Answer was too brief. A more detailed response would better demonstrate your knowledge.",
                "strengths": [],
                "gaps": ["Insufficient detail provided"],
            }

        system = (
            "You are an expert technical interviewer evaluating candidate responses. "
            "Be fair, constructive, and specific. Return valid JSON only."
        )
        prompt = f"""Evaluate this interview response:

Question: {question}
Topic: {topic}
Role: {role}

Candidate's Answer:
{answer[:1500]}

Reference Context (from knowledge base):
{context[:800] if context else "Use your expertise to evaluate."}

Score 1-10 and provide brief, constructive feedback.

Return ONLY JSON:
{{
  "score": <1-10 float>,
  "feedback": "2-3 sentence constructive feedback",
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1"],
  "key_concepts_covered": ["concept1"]
}}"""

        response = self._call_llm(prompt, system, max_tokens=600)
        if response:
            try:
                json_match = re.search(r"\{.*\}", response, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                    # Clamp score
                    result["score"] = float(max(1, min(10, result.get("score", 5))))
                    return result
            except Exception as e:
                logger.error(f"Evaluation parse failed: {e}")

        return self._simple_evaluate(answer, question)

    def _simple_evaluate(self, answer: str, question: str) -> Dict:
        length = len(answer.split())
        score = min(10.0, max(1.0, float(length // 15)))
        if length < 30:
            feedback = "The answer was quite brief. Consider expanding with specifics and examples."
        elif length < 80:
            feedback = "Decent answer. Adding technical depth or concrete examples would strengthen it."
        else:
            feedback = "Good detailed response demonstrating knowledge of the topic."
        return {
            "score": score,
            "feedback": feedback,
            "strengths": ["Addressed the question"] if length > 30 else [],
            "gaps": ["Could provide more detail"] if length < 80 else [],
            "key_concepts_covered": [],
        }

    # ------------------------------------------------------------------ #
    #  Report generation                                                    #
    # ------------------------------------------------------------------ #
    def generate_report(
        self,
        role: str,
        candidate_name: str,
        questions_and_answers: List[Dict],
        skills: List[str],
        evaluations: List[Dict],
    ) -> Dict:
        if not evaluations:
            return self._generate_simple_report(role, questions_and_answers)

        scores = [float(e.get("score", 5)) for e in evaluations if e.get("score") is not None]
        avg_score = sum(scores) / len(scores) if scores else 5.0

        topic_scores: Dict[str, list] = {}
        for i, qa in enumerate(questions_and_answers):
            if i < len(evaluations):
                t = qa.get("topic", "General")
                topic_scores.setdefault(t, []).append(evaluations[i].get("score", 5))
        topic_avg = {t: round(sum(s) / len(s), 2) for t, s in topic_scores.items()}

        all_strengths = [s for e in evaluations for s in e.get("strengths", [])]
        all_gaps = [g for e in evaluations for g in e.get("gaps", [])]

        if avg_score >= 7.5:
            recommendation = "strong_hire"
        elif avg_score >= 6.0:
            recommendation = "hire"
        elif avg_score >= 4.5:
            recommendation = "maybe"
        else:
            recommendation = "no_hire"

        rec_labels = {
            "strong_hire": "Strong Hire",
            "hire": "Hire",
            "maybe": "Consider with Reservations",
            "no_hire": "Not Recommended at This Time",
        }

        system = "You are writing a hiring manager report. Be concise and professional. Return JSON only."
        prompt = f"""Write a brief interview summary report for {candidate_name} applying for {role}.

Overall Score: {avg_score:.1f}/10
Topic Performance: {json.dumps(topic_avg)}
Key Skills: {', '.join(skills[:8])}
Recommendation: {rec_labels[recommendation]}
Topics covered: {[qa.get('topic', '') for qa in questions_and_answers[:8]]}

Return JSON:
{{
  "summary": "2-3 sentence executive summary",
  "detailed_feedback": {{
    "technical_depth": "brief assessment",
    "communication": "brief assessment",
    "problem_solving": "brief assessment"
  }}
}}"""

        report_extra: Dict = {}
        resp = self._call_llm(prompt, system, max_tokens=600)
        if resp:
            try:
                m = re.search(r"\{.*\}", resp, re.DOTALL)
                if m:
                    report_extra = json.loads(m.group())
            except Exception:
                pass

        summary = report_extra.get(
            "summary",
            f"{candidate_name} completed the {role} interview with an average score of {avg_score:.1f}/10.",
        )
        return {
            "overall_score": round(avg_score, 2),
            "recommendation": recommendation,
            "summary": summary,
            "strengths": list(set(all_strengths))[:5],
            "weaknesses": list(set(all_gaps))[:5],
            "topic_scores": topic_avg,
            "detailed_feedback": report_extra.get("detailed_feedback", {}),
        }

    def _generate_simple_report(self, role: str, questions_and_answers: List[Dict]) -> Dict:
        return {
            "overall_score": 5.0,
            "recommendation": "maybe",
            "summary": f"Interview completed for {role} role. Manual review recommended.",
            "strengths": ["Completed the interview"],
            "weaknesses": [],
            "topic_scores": {},
            "detailed_feedback": {},
        }


llm_service = LLMService()