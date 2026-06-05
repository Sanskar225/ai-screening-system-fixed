import re
import io
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

TECH_SKILLS = [
    "python","javascript","typescript","java","c++","c#","golang","rust","scala",
    "r","matlab","swift","kotlin","ruby","php","bash","sql",
    "machine learning","deep learning","neural network","nlp","computer vision",
    "reinforcement learning","transformers","bert","gpt","llm","rag",
    "scikit-learn","sklearn","tensorflow","keras","pytorch","huggingface",
    "xgboost","lightgbm","catboost","random forest","svm","gradient boosting",
    "pandas","numpy","matplotlib","seaborn","plotly","scipy",
    "spark","hadoop","kafka","airflow","dbt","databricks",
    "fastapi","flask","django","express","spring","fastify",
    "rest","graphql","grpc","microservices","docker","kubernetes",
    "aws","gcp","azure","lambda","s3","ec2","sagemaker","vertex ai",
    "postgresql","mysql","mongodb","redis","elasticsearch","cassandra",
    "sqlite","dynamodb","neo4j","chroma","pinecone","weaviate",
    "react","nextjs","vue","angular","tailwind","css","html",
    "git","github","gitlab","ci/cd","jenkins","terraform","ansible",
    "mlflow","wandb","dvc","jupyter","vscode",
    "statistics","probability","linear algebra","calculus","optimisation",
    "bayesian","regression","classification","clustering","dimensionality reduction",
]

EXPERIENCE_PATTERNS = [
    r"(\d+)\+?\s*years?\s+(?:of\s+)?experience",
    r"(\d+)\+?\s*yrs?\s+(?:of\s+)?experience",
    r"experience\s+(?:of\s+)?(\d+)\+?\s*years?",
]

EDUCATION_KEYWORDS = [
    "b.tech","b.e.","bachelor","b.sc","m.tech","m.sc","master","phd","ph.d",
    "mba","diploma","degree","university","college","institute","iit","nit",
    "computer science","information technology","electrical engineering","data science",
]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except ImportError:
        pass
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        return "\n".join(p.extract_text() or "" for p in reader.pages)
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return ""


def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for skill in TECH_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b" if len(skill) <= 3 else re.escape(skill)
        if re.search(pattern, text_lower):
            found.append(skill)
    found = list(set(found))
    found.sort(key=len, reverse=True)
    return found[:30]


def extract_technologies(text: str) -> List[str]:
    tech_specific = [
        "docker","kubernetes","terraform","ansible","jenkins","github actions",
        "aws","gcp","azure","postgresql","mongodb","redis","elasticsearch",
        "react","nextjs","fastapi","flask","django","pytorch","tensorflow",
        "spark","kafka","airflow","mlflow","wandb","jupyter","git",
        "ci/cd","rest api","graphql","microservices",
    ]
    text_lower = text.lower()
    return list(set(t for t in tech_specific if t in text_lower))


def extract_experience_level(text: str) -> Dict:
    text_lower = text.lower()
    years = 0
    for pattern in EXPERIENCE_PATTERNS:
        matches = re.findall(pattern, text_lower)
        if matches:
            years = max(years, max(int(m) for m in matches))
    if years == 0:
        if any(w in text_lower for w in ["senior","lead","principal","staff","architect"]):
            years = 5
        elif any(w in text_lower for w in ["junior","fresher","intern","entry"]):
            years = 1
        else:
            years = 2
    level = "junior" if years < 2 else "mid" if years < 5 else "senior"
    return {"years": years, "level": level}


def extract_education(text: str) -> List[str]:
    lines = text.split("\n")
    edu_lines = []
    for line in lines:
        if any(kw in line.lower() for kw in EDUCATION_KEYWORDS):
            clean = line.strip()
            if len(clean) > 5:
                edu_lines.append(clean[:150])
    return edu_lines[:3]


def parse_resume(file_bytes: bytes, filename: str, role: str) -> Dict:
    if filename.lower().endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    else:
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1", errors="replace")

    if not text or len(text.strip()) < 50:
        return {"text":"Could not extract text from resume.","skills":[],"technologies":[],"experience":[],"education":[],"domains":[],"experience_level":{"years":0,"level":"junior"}}

    skills = extract_skills(text)
    technologies = extract_technologies(text)
    experience_level = extract_experience_level(text)
    education = extract_education(text)

    experience = []
    if experience_level["years"] > 0:
        experience.append(f"{experience_level['years']} years experience ({experience_level['level']} level)")
    experience.extend(education[:2])

    return {
        "text": text[:5000],
        "skills": skills,
        "technologies": technologies,
        "experience": experience,
        "education": education,
        "domains": [],
        "experience_level": experience_level,
        "preview": text[:500],
    }
