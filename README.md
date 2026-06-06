# 🤖 AI-Powered Candidate Screening System
<img width="1906" height="996" alt="image" src="https://github.com/user-attachments/assets/8cf21df9-aa48-49a2-a1ca-e0a904be0513" />

An intelligent, full-stack interview platform that uses **Retrieval-Augmented Generation (RAG)** to conduct personalised technical interviews based on a candidate's resume and target role.

---

## 📐 Architecture

```
┌──────────────────────────────────────────────────────────┐
│              React Frontend (Vite + Framer Motion)        │
│                                                           │
│  LandingPage → SetupPage → InterviewPage → ReportPage     │
│  DashboardPage                                            │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTP / Axios
┌───────────────────────▼──────────────────────────────────┐
│                  FastAPI Backend (Python)                 │
│                                                           │
│  /api/sessions   — session lifecycle                      │
│  /api/resume     — PDF parsing & skill extraction         │
│  /api/interview  — RAG + question gen + answer eval       │
│  /api/reports    — scoring + hiring recommendation        │
└──────┬─────────────────┬─────────────────┬───────────────┘
       │                 │                 │
┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
│  SQLite DB  │  │  ChromaDB    │  │  LLM API    │
│  (sessions, │  │  (sentence-  │  │  (Anthropic │
│  questions, │  │  transformers│  │   or OpenAI)│
│  reports)   │  │  embeddings) │  │             │
└─────────────┘  └──────────────┘  └─────────────┘
                        ▲
              ┌─────────┴──────────┐
              │  data/books/*.pdf  │
              │  (ML textbooks)    │
              └────────────────────┘
```

---

## 🔄 System Flow

```
Candidate uploads resume (PDF/TXT)
         ↓
Resume Parser
  · pdfplumber / PyPDF2 text extraction
  · Keyword-based skill/technology extraction
  · Experience level detection (junior/mid/senior)
         ↓
Retrieval Query Builder
  · Constructs 5-6 diverse queries from role + skills
         ↓
ChromaDB RAG Retrieval  ←── sentence-transformers embeddings
  · Book PDFs chunked (500 tokens, 100 overlap)
  · Embedded ML textbook knowledge base (fallback)
  · Top-5 semantically relevant chunks returned
         ↓
LLM Question Generator (Claude / GPT)
  · Receives: role, experience level, skills, RAG chunks
  · Outputs: typed questions (conceptual/applied/behavioural)
  · Difficulty calibrated to candidate level
         ↓
Adaptive Interview Session
  · Candidate answers via React UI
  · Score ≥ 8.5 → next question difficulty increases
  · Score ≤ 3.5 → next question difficulty decreases
         ↓
Per-Answer Evaluation (LLM)
  · Score 1-10, feedback, strengths, gaps
  · Source context (RAG chunk) provided to LLM for grounding
         ↓
Final Report
  · Overall score, topic breakdown, hiring recommendation
  · Strong Hire / Hire / Maybe / No Hire
```

---

## 🔑 Key Design Decisions

### RAG Pipeline
| Decision | Choice | Reason |
|---|---|---|
| Chunking | 500 tokens, 100 overlap | Preserves context across boundary |
| Embeddings | `all-MiniLM-L6-v2` | Fast, high quality, runs on CPU |
| Vector DB | ChromaDB (persistent) | Zero-config, local, production-ready |
| Knowledge source | PDFs from `data/books/` + embedded fallback | Textbook-grounded, always functional |
| Query enrichment | Skills appended to query | More relevant retrieval |

### Resume Intelligence
- Extracts 30+ ML/backend/DevOps skills via pattern matching
- Detects experience level (junior/mid/senior) from years and title keywords
- **Directly influences**: question difficulty, topic selection, depth of questions

### Adaptive Interviews
- After each answer, score is checked:
  - Score ≥ 8.5 → next question bumped up one difficulty tier
  - Score ≤ 3.5 → next question dropped one difficulty tier
- UI shows adaptive change notification to candidate

### Traceability
Every question in the DB stores its `source_context` — the exact RAG chunk that inspired it — enabling full audit of the pipeline.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- An API key: Anthropic **or** OpenAI

### 1. Backend

```bash
cd backend

# Virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies (includes ChromaDB + sentence-transformers)
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env and add:  ANTHROPIC_API_KEY=sk-ant-...
# or:                 OPENAI_API_KEY=sk-...

# (Optional but recommended) Add ML textbooks
mkdir -p data/books
# Copy the provided PDFs into data/books/
# e.g. data/books/machine_learning_tom_mitchell.pdf
source venv/Scripts/activate
# Start
uvicorn app.main:app --reload --port 8000
```

Backend: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`  
Health (shows RAG backend): `http://localhost:8000/health`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`

### One-command start
```bash
# Linux/macOS
chmod +x start.sh && ./start.sh

# Windows
start.bat
```

---

## 🐳 Docker Compose

```bash
# Add API key to environment first
export ANTHROPIC_API_KEY=sk-ant-...

docker-compose up --build
```

---

## ⚙️ Configuration

| Variable | Description | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | – |
| `OPENAI_API_KEY` | OpenAI API key | – |
| `LLM_PROVIDER` | `anthropic` or `openai` | `anthropic` |
| `LLM_MODEL` | Model name | `claude-3-haiku-20240307` |
| `DATABASE_URL` | DB connection string | `sqlite:///./screening.db` |
| `MAX_QUESTIONS` | Questions per interview | `8` |
| `TOP_K_RETRIEVAL` | RAG chunks to retrieve | `5` |
| `CHUNK_SIZE` | Tokens per chunk | `800` |
| `CHUNK_OVERLAP` | Overlap between chunks | `150` |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health + RAG backend status |
| GET | `/api/sessions/roles` | Available roles |
| POST | `/api/sessions/` | Create session |
| POST | `/api/resume/upload/{id}` | Upload + parse resume |
| POST | `/api/interview/start/{id}` | Start (triggers RAG + question gen) |
| GET | `/api/interview/{id}/status` | Progress |
| POST | `/api/interview/{id}/answer/{qid}` | Submit answer |
| POST | `/api/reports/generate/{id}` | Generate report |
| GET | `/api/reports/` | List all reports |

---

## 🗂️ Project Structure

```
ai-screening-system/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sessions.py       # Session lifecycle
│   │   │   ├── resume.py         # File upload & parsing
│   │   │   ├── interview.py      # Question & answer handling
│   │   │   └── reports.py        # Report generation
│   │   ├── core/
│   │   │   ├── config.py         # Settings (env vars)
│   │   │   └── database.py       # SQLAlchemy engine
│   │   ├── models/
│   │   │   ├── db_models.py      # ORM models
│   │   │   └── schemas.py        # Pydantic schemas
│   │   └── services/
│   │       ├── rag_service.py    # ChromaDB RAG pipeline
│   │       ├── llm_service.py    # LLM interface (Anthropic/OpenAI)
│   │       ├── resume_service.py # PDF parsing & NER
│   │       └── interview_service.py  # Orchestration + adaptive logic
│   ├── data/
│   │   └── books/                # Place ML textbook PDFs here
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── pages/                # React pages
│       ├── services/api.js       # Axios API layer
│       └── styles/globals.css
├── docker-compose.yml
├── start.sh
├── start.bat
└── README.md
```

---

## 📚 Knowledge Base Setup

The system works without PDFs (embedded fallback), but textbook-grounded RAG is significantly better.

Place PDF files in `backend/data/books/`. On next startup, they are automatically:
1. Extracted with pdfplumber
2. Split into overlapping chunks
3. Embedded with sentence-transformers
4. Stored in ChromaDB

Recommended books (from assignment):
- `machine_learning_tom_mitchell.pdf`
- `hundred_page_ml_book_burkov.pdf`
- `ml_absolute_beginners.pdf`
- `intro_ml_python.pdf`

---

## 💡 Extending the System

- **New role**: Add to `AVAILABLE_ROLES` in `sessions.py` and `ROLE_KNOWLEDGE_MAP` in `rag_service.py`
- **New books**: Drop PDFs in `data/books/` and restart (or delete `chroma_db/` to force re-ingestion)
- **New LLM**: Implement `_call_llm` branch in `llm_service.py`
- **PostgreSQL**: Set `DATABASE_URL=postgresql://...` in `.env`

---

## 📄 License

MIT
