<div align="center">

<img src="https://img.shields.io/badge/SIH-2026-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Problem_Statement-SIH26165-red?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Active_Development-brightgreen?style=for-the-badge" />

# 🛡️ OIL Sentinel
### AI-Powered Serious Injury & Fatality Precursor Intelligence System

*Transforming unstructured safety observations into explainable, actionable SIF intelligence — before a fatality occurs.*

</div>

---

## 📌 Problem Statement

Oil and gas operations generate thousands of **Unsafe Act**, **Unsafe Condition**, and **Near-Miss** reports every month. Safety teams cannot treat every report with equal urgency — yet critical warning signals remain buried inside routine safety observations written in free-form natural language.

> **The gap:** Existing safety management systems collect reports effectively, but there is no automated system to transform unstructured safety observations into explainable SIF intelligence and detect emerging precursor patterns *before* a serious incident occurs.

---

## 💡 Our Solution

**OIL Sentinel** is an AI-powered safety intelligence layer that:

```
📝 Reads safety reports
        ↓
🧠 Understands the actual hazard situation
        ↓
🔴 Identifies Serious Injury / Fatality potential
        ↓
⚠️  Extracts hazard, exposure, and failed barrier
        ↓
📜 Maps relevant critical safety rules
        ↓
🔎 Finds similar historical incidents
        ↓
📈 Detects emerging risk clusters
        ↓
🚨 Enables earlier intervention
```

---

## ✨ Key Innovations

| Innovation | Description |
|-----------|-------------|
| 🧠 **Causal SIF Graph** | Visual DAG linking Activity → Hazard → Barrier Failure → Consequence. Not just *what* happened — but *why* it's dangerous. |
| 🔢 **Deterministic Risk Engine** | Risk score calculated via weighted formula, never by LLM guesswork. Auditable and consistent. |
| 🔍 **Semantic Similarity Search** | pgvector-powered vector search finds conceptually similar past incidents, not just keyword matches. |
| 🛡️ **Barrier Failure Intelligence** | Tracks which safety controls fail most frequently — enabling proactive systemic fixes. |
| 📈 **Emerging Precursor Detection** | Rolling-window statistical algorithm flags clusters before they become fatalities. |
| 👷 **Human-in-the-Loop AI** | Safety officers approve, reject, or correct every AI decision. AI assists; it never replaces. |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                  │
│   Dashboard │ Report Table │ Causal Graph │ Upload UI   │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────┐
│                   BACKEND (FastAPI)                     │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │ NLP Service │   │ Risk Engine  │   │ Graph Svc   │  │
│  │  (Groq LLM) │──▶│(Deterministic│──▶│ (DAG JSON)  │  │
│  │  + Fallback │   │   Formula)   │   │             │  │
│  └─────────────┘   └──────────────┘   └─────────────┘  │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │ Vector Svc  │   │ Pattern Svc  │   │ Barrier Svc │  │
│  │ (pgvector)  │   │  (Rolling    │   │ (Failure    │  │
│  │             │   │   Window)    │   │  Analytics) │  │
│  └─────────────┘   └──────────────┘   └─────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              DATABASE (PostgreSQL + pgvector)            │
│         reports table │ analyses table │ embeddings      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔬 AI/NLP Pipeline (Dev 4)

The NLP pipeline is strictly separated into **extraction** (LLM) and **scoring** (deterministic math):

```
Raw Report Text
      │
      ▼
┌─────────────────────────────────┐
│         NLP Service             │
│  Groq API (llama-3.1-8b)       │
│  Strict JSON schema output      │
│  Fallback: Rule-based extractor │
└──────────────┬──────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │   Extracted Entities  │
    │  • Activity           │
    │  • Hazard             │
    │  • Exposure           │
    │  • Barrier            │
    │  • Barrier Failure    │
    │  • Consequence        │
    └──────────┬───────────┘
               │
               ▼
┌─────────────────────────────────┐
│       SIF Risk Engine           │
│                                 │
│  Score = (W_hazard × W_exposure)│
│        + W_barrier_failure      │
│        + W_consequence          │
│                                 │
│  🔴 HIGH   80–100               │
│  🟠 MEDIUM 40–79                │
│  🟢 LOW    0–39                 │
└─────────────────────────────────┘
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| **Visualizations** | Recharts · React Flow |
| **Backend** | FastAPI · Python 3.11 · Uvicorn |
| **AI / NLP** | Groq API · Llama 3.1 8B · SentenceTransformers |
| **Database** | PostgreSQL · pgvector · SQLAlchemy |
| **Embeddings** | `all-MiniLM-L6-v2` (384-dimensional vectors) |
| **Validation** | Pydantic v2 |
| **Containerization** | Docker · Docker Compose |

</div>

---

## 📁 Project Structure

```
SIH26165-SIF-Intelligence/
│
├── frontend/                   # Next.js application
│   └── src/
│       ├── app/                # App Router pages
│       └── components/         # UI components
│
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/v1/
│   │   │   └── reports.py      # All API endpoints
│   │   ├── core/
│   │   │   └── config.py       # Environment settings
│   │   ├── db/
│   │   │   └── database.py     # DB connection + Base
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/
│   │       ├── nlp_service.py          # ← Dev 4: Groq LLM extractor
│   │       ├── mock_nlp_service.py     # ← Dev 4: Rule-based fallback
│   │       ├── risk_service.py         # ← Dev 4: Deterministic scorer
│   │       ├── analysis_service.py     # ← Dev 4: Pipeline entry point
│   │       ├── vector_service.py       # Dev 5: pgvector similarity
│   │       ├── pattern_service.py      # Dev 5: Emerging patterns
│   │       ├── graph_service.py        # Causal graph builder
│   │       ├── barrier_service.py      # Barrier failure analytics
│   │       └── dashboard_service.py    # Dashboard aggregations
│   ├── test_dev4.py            # Dev 4 pipeline verification
│   └── docker-compose.yml
│
├── data/                       # Synthetic datasets & seed scripts
└── notebooks/                  # Prompt testing, vector sandbox
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Groq API key → [console.groq.com](https://console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/your-org/SIH26165-SIF-Intelligence.git
cd SIH26165-SIF-Intelligence
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment variables
Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sif_db
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Start the database
```bash
docker-compose up -d
```

### 5. Run the backend
```bash
uvicorn app.main:app --reload
```
API docs available at `http://localhost:8000/docs`

### 6. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
App available at `http://localhost:3000`

### 7. Verify Dev 4 pipeline
```bash
cd backend
python test_dev4.py
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/reports/analyze` | Analyze a single free-text report |
| `POST` | `/api/v1/reports/upload` | Bulk upload via CSV |
| `GET` | `/api/v1/reports` | List all reports |
| `GET` | `/api/v1/reports/{id}` | Get single report |
| `GET` | `/api/v1/reports/{id}/similar` | Find similar historical incidents |
| `GET` | `/api/v1/reports/{id}/graph` | Get causal graph JSON |
| `PUT` | `/api/v1/reports/{id}/feedback` | Submit human correction (HITL) |
| `GET` | `/api/v1/reports/barrier-intelligence` | Barrier failure analytics |
| `GET` | `/api/v1/reports/emerging-patterns` | Emerging precursor clusters |
| `GET` | `/api/v1/reports/dashboard-summary` | Dashboard KPIs |
| `GET` | `/api/v1/health` | Health check |

### Example: Analyze a report
```bash
curl -X POST http://localhost:8000/api/v1/reports/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "site": "Rig 4",
    "text": "Worker bypassed interlock on pump during maintenance."
  }'
```

```json
{
  "report_id": "uuid-123",
  "risk_score": 85,
  "risk_level": "HIGH",
  "confidence": 0.92,
  "extraction": {
    "activity": "Maintenance",
    "hazard": "Electrical energy",
    "exposure": "Worker exposed to energized equipment",
    "barrier": "LOTO",
    "barrier_failure": "LOTO not applied",
    "potential_consequence": "Fatality"
  }
}
```

---

## 👥 Team & Work Division

| Developer | Role | Deliverables |
|-----------|------|-------------|
| **Dev 1** | UI Lead | Dashboard, layout, Recharts visualizations |
| **Dev 2** | UX / Graph | Report detail page, React Flow causal graph, CSV upload UI |
| **Dev 3** | Backend | FastAPI, PostgreSQL, CRUD endpoints, Docker |
| **Dev 4** | NLP Lead | Groq LLM extractor, deterministic risk engine, confidence scoring |
| **Dev 5** | ML / DB | pgvector embeddings, similar incident API, emerging patterns |
| **Dev 6** | Integrator | 150+ synthetic reports, E2E testing, demo script |

---

## 🔐 Security Notes

- All API keys stored in `.env` — never committed to GitHub
- `.env` is listed in `.gitignore`
- LLM outputs validated through Pydantic before any DB write
- Risk scores calculated deterministically — LLM cannot influence final classification

---

## 📄 License

Built for **Smart India Hackathon 2026** — Problem Statement **SIH26165**

*OIL India Limited — AI/NLP Engine to Detect SIF Precursors in Unsafe-Act / Unsafe-Condition and Near-Miss Reports*

---

<div align="center">
  <sub>Built with ❤️ for SIH 2026 · AI must assist safety professionals, not replace them.</sub>
</div>