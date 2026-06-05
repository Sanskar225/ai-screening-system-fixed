"""
RAG Service
===========
Priority order for knowledge ingestion:
  1. PDFs in backend/data/books/  (provided textbooks)
  2. Embedded knowledge strings   (fallback, always available)

Retrieval always uses ChromaDB when available; otherwise keyword search.
"""
import hashlib
import io
import logging
import os
import re
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Embedded knowledge base (fallback / supplement)
# ─────────────────────────────────────────────────────────────────────────────
KNOWLEDGE_BASE: Dict[str, List[Dict]] = {
    "ai_ml": [
        {
            "topic": "Supervised Learning",
            "content": (
                "Supervised learning trains a model on labelled data to learn a mapping "
                "from inputs X to outputs Y.  Common algorithms: linear regression (continuous "
                "output), logistic regression and SVMs (classification), decision trees. "
                "Key concepts: training / validation / test split, overfitting, underfitting, "
                "bias-variance tradeoff.  Cross-validation (k-fold) gives a more robust "
                "performance estimate. Evaluation metrics: accuracy, precision, recall, F1 "
                "(classification); MSE, RMSE, MAE (regression). Regularisation (L1 Lasso, "
                "L2 Ridge) penalises model complexity to reduce overfitting."
            ),
        },
        {
            "topic": "Neural Networks and Deep Learning",
            "content": (
                "Neural networks consist of layers of neurons applying activation functions "
                "(ReLU, sigmoid, tanh) to weighted inputs.  Backpropagation computes gradients "
                "via the chain rule; weights are updated with gradient descent. Deep networks "
                "learn hierarchical representations. Key architectures: CNNs for images, "
                "RNNs/LSTMs for sequences, Transformers for NLP. Training: forward pass → "
                "loss → backprop → weight update (SGD, Adam, RMSprop). Regularisation: "
                "dropout, batch normalisation, weight decay, data augmentation. Vanishing "
                "gradients addressed by careful initialisation (Xavier/He), residual connections, "
                "and batch norm."
            ),
        },
        {
            "topic": "Decision Trees and Ensemble Methods",
            "content": (
                "Decision trees split data by feature values to minimise impurity (Gini, entropy). "
                "Random Forest builds many trees on bootstrap samples with random feature subsets "
                "(bagging) — reduces variance. Gradient Boosting builds trees sequentially, each "
                "correcting the previous residuals — reduces bias. XGBoost, LightGBM, CatBoost "
                "are efficient implementations with regularisation built in. Feature importance "
                "is naturally extracted from tree models."
            ),
        },
        {
            "topic": "Unsupervised Learning and Clustering",
            "content": (
                "K-Means minimises within-cluster variance; choose k with elbow method or "
                "silhouette score. DBSCAN finds clusters by density — handles noise and "
                "arbitrary shapes. Hierarchical clustering builds a dendrogram. PCA reduces "
                "dimensionality by finding orthogonal directions of maximum variance. t-SNE "
                "and UMAP are non-linear methods for 2-D/3-D visualisation. Autoencoders "
                "learn compressed representations."
            ),
        },
        {
            "topic": "Natural Language Processing",
            "content": (
                "NLP enables machines to understand and generate language. Word embeddings "
                "(Word2Vec, GloVe) capture semantic similarity. Transformer architecture uses "
                "multi-head self-attention to model long-range dependencies. BERT: bidirectional, "
                "trained on masked language modelling; good for understanding tasks. GPT: "
                "autoregressive, trained to predict next tokens; good for generation. Fine-tuning "
                "adapts pre-trained models with small labelled datasets. RAG (Retrieval-Augmented "
                "Generation) grounds LLM outputs with retrieved context, reducing hallucination "
                "and enabling up-to-date answers without retraining."
            ),
        },
        {
            "topic": "Model Evaluation and Validation",
            "content": (
                "Confusion matrix: TP, FP, TN, FN. Precision = TP/(TP+FP); "
                "Recall = TP/(TP+FN); F1 = 2PR/(P+R). ROC–AUC summarises discriminative "
                "ability. For imbalanced classes prefer precision-recall AUC or F1. "
                "k-fold cross-validation averages performance across k held-out folds. "
                "Nested CV for hyperparameter tuning + evaluation. Data leakage: any "
                "information from the test set bleeding into training — must be prevented "
                "by fitting transformers only on training folds."
            ),
        },
        {
            "topic": "Feature Engineering and Selection",
            "content": (
                "Numerical: min-max normalisation, z-score standardisation, log transform for "
                "skewed data. Categorical: one-hot encoding, target encoding, embeddings. "
                "Missing values: imputation (mean/median/mode/KNN/iterative) or indicator "
                "columns. Feature selection: filter (correlation, mutual information), wrapper "
                "(RFE), embedded (Lasso shrinks coefficients to 0). Feature interactions: "
                "polynomial features, explicit cross terms. Dimensionality reduction (PCA) "
                "helps with the curse of dimensionality."
            ),
        },
        {
            "topic": "Optimization and Gradient Descent",
            "content": (
                "Gradient descent moves parameters opposite to the gradient. SGD updates "
                "on single samples; mini-batch SGD on small batches — better GPU utilisation. "
                "Momentum accumulates gradients to accelerate and dampen oscillations. Adam "
                "combines momentum (first moment) and adaptive learning rates (second moment). "
                "Learning rate scheduling: step decay, cosine annealing, warm restarts, linear "
                "warmup. Vanishing gradients: solved by residual connections, batch norm, "
                "gradient clipping. Saddle points dominate in high-dimensional landscapes — "
                "adaptive optimisers generally escape them."
            ),
        },
        {
            "topic": "Reinforcement Learning",
            "content": (
                "Agent interacts with environment, receives reward; learns policy to maximise "
                "cumulative reward. MDP: states, actions, transition probabilities, rewards, "
                "discount γ. Q-learning: learn Q(s,a) via Bellman equation. DQN: neural "
                "network approximates Q; uses experience replay and target networks for "
                "stability. Policy gradient (REINFORCE, PPO, A3C) directly optimises policy. "
                "Exploration vs exploitation: ε-greedy, UCB, Thompson sampling. Applications: "
                "game playing, robotics, recommendation systems."
            ),
        },
        {
            "topic": "MLOps and Production ML",
            "content": (
                "MLOps applies DevOps practices to ML. Pipeline: data → features → training → "
                "evaluation → deployment → monitoring. Model versioning: MLflow, DVC. "
                "Containerisation: Docker for reproducibility. Serving: FastAPI/Flask REST, "
                "batch inference, streaming. Monitoring: data drift (KL divergence, PSI), "
                "model performance degradation, concept drift. A/B testing for model comparisons. "
                "Feature stores centralise feature computation and serving. CI/CD gates: "
                "automated tests, performance thresholds before promotion."
            ),
        },
        {
            "topic": "Statistical Learning Theory",
            "content": (
                "Empirical Risk Minimisation (ERM) minimises training error as a proxy for "
                "true risk. VC dimension measures hypothesis-class capacity. PAC learning "
                "gives sample-complexity bounds. Regularisation adds a penalty to the "
                "objective: L1 (Lasso) induces sparsity; L2 (Ridge) shrinks coefficients; "
                "ElasticNet combines both. Bayesian inference: posterior ∝ prior × likelihood; "
                "MLE finds parameters maximising data likelihood. Confidence intervals "
                "quantify estimation uncertainty."
            ),
        },
    ],
    "backend": [
        {
            "topic": "API Design and REST",
            "content": (
                "REST uses HTTP verbs: GET (read), POST (create), PUT/PATCH (update), "
                "DELETE. Resource-based URLs: /users/{id}, /posts/{id}/comments. Status codes: "
                "200 OK, 201 Created, 400 Bad Request, 401 Unauthorised, 404 Not Found, "
                "429 Rate Limited, 500 Server Error. Versioning: URL (/v1/), header, or query "
                "param. Authentication: JWT, OAuth2, API keys. FastAPI provides automatic "
                "OpenAPI docs and Pydantic validation. GraphQL for flexible queries; gRPC "
                "for high-performance internal services."
            ),
        },
        {
            "topic": "Database Design",
            "content": (
                "Relational DBs (PostgreSQL, MySQL): tables, FK relationships, ACID transactions. "
                "Normalisation (1NF–3NF) reduces redundancy; denormalisation improves read "
                "performance. B-tree indexes for range queries; hash indexes for equality. "
                "EXPLAIN/ANALYZE to inspect query plans. NoSQL: document (MongoDB), key-value "
                "( Redis), wide-column (Cassandra), graph (Neo4j). ORM (SQLAlchemy) abstracts "
                "SQL. Connection pooling manages DB connections. Read replicas for read-heavy "
                "workloads. Database sharding for horizontal partitioning."
            ),
        },
        {
            "topic": "System Design and Scalability",
            "content": (
                "Horizontal scaling adds servers; vertical scaling adds resources. Load balancers "
                "distribute traffic (round-robin, least connections, consistent hashing). Caching: "
                "in-process, Redis/Memcached, CDN for static assets. Message queues (Kafka, "
                "RabbitMQ) decouple services and handle async workloads. Microservices: "
                "independent deployability, bounded contexts, API gateway. CAP theorem: "
                "Consistency, Availability, Partition tolerance — choose two. Event sourcing "
                "and CQRS for audit trails and read/write optimisation."
            ),
        },
    ],
    "data_science": [
        {
            "topic": "Exploratory Data Analysis",
            "content": (
                "EDA summarises dataset characteristics before modelling. Univariate: "
                "histograms, box plots, descriptive statistics. Bivariate: scatter plots, "
                "correlation matrices, cross-tabulations. Outlier detection: IQR, Z-score, "
                "isolation forests. Data quality: missing values, duplicates, inconsistent "
                "formats. Correlation ≠ causation. Statistical tests: t-test (means), "
                "chi-squared (proportions), ANOVA (multiple groups), Mann-Whitney (non-parametric)."
            ),
        },
    ],
}

ROLE_KNOWLEDGE_MAP = {
    "AI/ML Engineer": ["ai_ml"],
    "Data Scientist": ["ai_ml", "data_science"],
    "Backend Engineer": ["backend"],
    "Full Stack Engineer": ["backend"],
    "ML Research Engineer": ["ai_ml", "data_science"],
}


# ─────────────────────────────────────────────────────────────────────────────
# RAG Service
# ─────────────────────────────────────────────────────────────────────────────
class RAGService:
    def __init__(self):
        self._use_vector_db = False
        self._chroma_collections: Dict = {}
        self._in_memory: Dict[str, List[Dict]] = {}
        self._init()

    # ── initialisation ────────────────────────────────────────────────────── #

    def _init(self):
        # Always build in-memory index so keyword fallback has data regardless of vector DB status
        self._build_in_memory()
        try:
            import chromadb
            from sentence_transformers import SentenceTransformer
            from app.core.config import settings

            self._embed_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            self._chroma = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            self._use_vector_db = True
            self._ingest_all()
            logger.info("RAG: ChromaDB + sentence-transformers ready")
        except Exception as exc:
            logger.warning(f"RAG: vector DB unavailable ({exc}) — using keyword search")

    # ── ingestion ─────────────────────────────────────────────────────────── #

    def _chunk_text(self, text: str, chunk_size: int = 400, overlap: int = 80) -> List[str]:
        words = text.split()
        chunks = []
        step = max(1, chunk_size - overlap)
        for i in range(0, len(words), step):
            chunk = " ".join(words[i : i + chunk_size])
            if len(chunk.strip()) > 50:
                chunks.append(chunk)
        return chunks

    def _extract_pdf_text(self, path: str) -> str:
        """Extract text from a PDF file."""
        try:
            import pdfplumber
            with pdfplumber.open(path) as pdf:
                pages = [p.extract_text() or "" for p in pdf.pages]
            text = "\n".join(pages)
            logger.info(f"PDF extracted: {path} ({len(text)} chars)")
            return text
        except ImportError:
            pass
        try:
            import PyPDF2
            with open(path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                text = "\n".join(p.extract_text() or "" for p in reader.pages)
            logger.info(f"PDF extracted (PyPDF2): {path}")
            return text
        except Exception as e:
            logger.warning(f"PDF extraction failed for {path}: {e}")
            return ""

    def _load_books(self) -> List[Dict]:
        """Load PDFs from data/books/ and produce topic-tagged chunks."""
        books_dir = Path(__file__).parent.parent.parent / "data" / "books"
        if not books_dir.exists():
            return []

        entries: List[Dict] = []
        for pdf_path in books_dir.glob("*.pdf"):
            raw_text = self._extract_pdf_text(str(pdf_path))
            if not raw_text.strip():
                continue
            book_name = pdf_path.stem.replace("_", " ").replace("-", " ").title()
            chunks = self._chunk_text(raw_text, chunk_size=500, overlap=100)
            for chunk in chunks:
                entries.append({"topic": f"Book: {book_name}", "content": chunk, "source": pdf_path.name})
            logger.info(f"Book ingested: {pdf_path.name} → {len(chunks)} chunks")

        return entries

    def _ingest_all(self):
        """Populate ChromaDB from books + embedded knowledge base."""
        book_entries = self._load_books()

        for domain, entries in KNOWLEDGE_BASE.items():
            # FIX 1: attach PDF books to every domain, not just ai_ml
            all_entries = entries + book_entries
            coll_name = f"knowledge_{domain}"

            try:
                coll = self._chroma.get_collection(coll_name)
                self._chroma_collections[domain] = coll
                logger.info(f"ChromaDB collection '{coll_name}' already exists, reusing")
                continue
            except Exception:
                pass

            coll = self._chroma.create_collection(coll_name)
            docs, metas, ids = [], [], []
            for entry in all_entries:
                for i, chunk in enumerate(self._chunk_text(entry["content"])):
                    uid = hashlib.md5(f"{domain}_{entry['topic']}_{i}_{chunk[:40]}".encode()).hexdigest()
                    docs.append(chunk)
                    metas.append({"topic": entry["topic"], "domain": domain, "source": entry.get("source", "embedded")})
                    ids.append(uid)

            if docs:
                embeddings = self._embed_model.encode(docs, show_progress_bar=False).tolist()
                coll.add(documents=docs, metadatas=metas, ids=ids, embeddings=embeddings)
                logger.info(f"ChromaDB '{coll_name}': {len(docs)} chunks ingested")

            self._chroma_collections[domain] = coll

    def _build_in_memory(self):
        for domain, entries in KNOWLEDGE_BASE.items():
            self._in_memory[domain] = entries

    # ── retrieval ─────────────────────────────────────────────────────────── #

    def _keyword_search(self, query: str, domain: str, top_k: int) -> List[Dict]:
        entries = self._in_memory.get(domain, [])
        query_words = set(re.sub(r"[^\w\s]", "", query.lower()).split())
        scored = []
        for entry in entries:
            content_words = set(entry["content"].lower().split())
            topic_words = set(entry["topic"].lower().split())
            score = len(query_words & content_words) + 2 * len(query_words & topic_words)
            scored.append((score, entry))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {"content": e["content"], "topic": e["topic"], "score": s, "source": e.get("source", "embedded")}
            for s, e in scored[:top_k]
            if s > 0
        ] or [
            {"content": e["content"], "topic": e["topic"], "score": 0, "source": "embedded"}
            for _, e in scored[:top_k]
        ]

    def retrieve(
        self,
        query: str,
        role: str,
        skills: Optional[List[str]] = None,
        top_k: int = 5,
    ) -> List[Dict]:
        """Retrieve relevant knowledge chunks for a query."""
        domains = ROLE_KNOWLEDGE_MAP.get(role, ["ai_ml"])
        enriched = query + (" " + " ".join(skills[:5]) if skills else "")

        all_results: List[Dict] = []
        for domain in domains:
            if self._use_vector_db:
                try:
                    coll = self._chroma_collections.get(domain)
                    if coll:
                        emb = self._embed_model.encode([enriched], show_progress_bar=False).tolist()
                        res = coll.query(query_embeddings=emb, n_results=min(top_k, 4))
                        for i, doc in enumerate(res["documents"][0]):
                            all_results.append({
                                "content": doc,
                                "topic": res["metadatas"][0][i].get("topic", "General"),
                                "source": res["metadatas"][0][i].get("source", "embedded"),
                                "score": float(res["distances"][0][i]) if res.get("distances") else 0.5,
                            })
                        # FIX 2: only skip keyword fallback when vector search actually ran
                        continue
                except Exception as e:
                    logger.error(f"ChromaDB query failed: {e}")
            # fallback — reached when: vector DB off, collection missing, or query exception
            all_results.extend(self._keyword_search(enriched, domain, top_k))

        # Deduplicate by topic, sort by score (ascending = more relevant for chroma distances)
        seen: set = set()
        unique: List[Dict] = []
        for r in sorted(all_results, key=lambda x: x.get("score", 99)):
            key = r["topic"]
            if key not in seen:
                seen.add(key)
                unique.append(r)

        return unique[:top_k]

    def get_role_topics(self, role: str) -> List[str]:
        domains = ROLE_KNOWLEDGE_MAP.get(role, ["ai_ml"])
        return [e["topic"] for d in domains for e in KNOWLEDGE_BASE.get(d, [])]

    @property
    def using_vector_db(self) -> bool:
        return self._use_vector_db


rag_service = RAGService()
