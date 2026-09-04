# 🛡️ AI-Powered SIF Precursor Detection Engine

> **Turning unstructured safety reports into explainable, actionable Serious Injury & Fatality (SIF) intelligence.**

An AI-powered safety intelligence platform designed to help industrial **Safety Officers identify Serious Injury and Fatality (SIF) precursors** from unstructured safety reports.

The system combines **LLM-based information extraction, deterministic risk scoring, semantic similarity search, causal safety graphs, emerging-pattern detection, and Human-in-the-Loop validation** to provide explainable and actionable safety intelligence.

---

## 🎯 Mission

Safety data is often buried inside thousands of unstructured reports.

Our mission is to transform this data into:

**Raw Safety Report → Structured Safety Intelligence → SIF Risk Score → Explainable Causal Chain → Actionable Safety Decision**

The system is designed to **assist safety professionals, not replace them**. Every AI-generated decision can be reviewed, edited, approved, and audited by a Safety Officer.

---

# 🚨 Problem

Industrial organizations collect large volumes of:

* Unsafe Acts (UA)
* Unsafe Conditions (UC)
* Near-Miss reports
* Incident reports
* Corrective-action information

However, safety teams face several challenges:

* Safety reports contain large amounts of **unstructured text**.
* Manual review is time-consuming.
* Potential SIF precursors can remain hidden inside seemingly ordinary observations.
* Traditional systems may rely heavily on manual classification.
* Keyword-based searches struggle to identify conceptually similar historical incidents.
* Repeated barrier failures can be difficult to identify across thousands of reports.
* AI predictions without explanations are difficult to trust in safety-critical environments.

The core challenge is therefore:

> **How can existing safety reports be transformed into reliable, explainable early intelligence about potential SIF events?**

---

# 💡 Our Solution

The **SIF Precursor Detection Engine** automatically processes safety reports and extracts the key elements of a potential incident:

```text
Safety Report
      ↓
Text Cleaning
      ↓
NLP Entity Extraction
      ↓
Activity
Hazard
Exposure
Barrier
Barrier Failure
Potential Consequence
      ↓
Deterministic SIF Risk Scoring
      ↓
SIF Classification
      ↓
Causal Safety Graph
      ↓
Similar Historical Incidents
      ↓
Emerging Pattern Detection
      ↓
Human Validation
      ↓
Actionable Safety Intelligence
```

The complete product flow is designed around a Safety Officer uploading historical reports or entering an individual free-text report, followed by AI extraction, risk classification, explanation and human validation.

---

# ⭐ Key Features

## 1. 📄 Report Intelligence Hub

Safety Officers can:

* Upload CSV/Excel files containing historical safety reports.
* Enter individual free-text reports.
* View processed reports in a centralized interface.
* Search and filter reports by risk level and other attributes.
* Track validation status.

**Bulk CSV upload is a core MVP requirement.**

---

# 2. 🧠 AI-Powered Safety Entity Extraction

The system converts unstructured safety text into structured safety information.

### Extracted entities

```text
Activity
   ↓
Hazard
   ↓
Exposure
   ↓
Barrier
   ↓
Barrier Failure
   ↓
Potential Consequence
```

For example:

### Input

> "Worker bypassed interlock on pump during maintenance."

### AI Extraction

```json
{
  "activity": "Maintenance",
  "hazard": "Live Energy",
  "exposure": "Line of Fire",
  "barrier": "Interlock",
  "barrier_failure": "Bypassed",
  "potential_consequence": "Electrocution"
}
```

The blueprint specifies using an LLM with **strict JSON output** rather than building a custom NER model during the hackathon. A rule-based fallback can be used if the API fails.

---

# 3. ⚠️ Deterministic SIF Risk Scoring

### Critical Design Principle

> **The LLM must NOT determine the final risk score.**

LLMs are used for **information extraction**, while the actual risk score is calculated by a deterministic backend algorithm.

This ensures:

* Consistency
* Reproducibility
* Explainability
* Auditability
* Safety-critical control over scoring

The blueprint explicitly separates AI extraction from mathematical risk scoring.

---

## Risk Score

The MVP scoring architecture is:

```text
Risk Score =
(Hazard Weight × Exposure Multiplier)
+ Barrier Failure Weight
+ Consequence Weight
```

Example weights include:

### Hazard

| Hazard         | Weight |
| -------------- | -----: |
| Suspended Load |     30 |
| Confined Space |     30 |
| Oil Spill      |     15 |
| Trip Hazard    |      5 |

### Exposure

| Exposure               | Multiplier |
| ---------------------- | ---------: |
| Worker isolated        |        0.5 |
| Worker in Line of Fire |        1.5 |

### Barrier Failure

| Failure        | Weight |
| -------------- | -----: |
| Missing Guard  |     20 |
| LOTO Violation |     30 |
| PPE Missing    |     10 |

### Consequence

| Consequence       | Weight |
| ----------------- | -----: |
| Fatality          |     30 |
| Medical Treatment |     10 |

These weights are defined in the MVP blueprint and can be expanded/calibrated later.

### Example

```text
Worker walks under suspended load

Hazard:
30

Exposure:
1.5

Barrier Failure:
20

Potential Consequence:
30

-----------------------------
Risk Score = (30 × 1.5) + 20 + 30
Risk Score = 95
```

### Classification

|  Score | SIF Level | Action                |
| -----: | --------- | --------------------- |
| 80–100 | 🔴 HIGH   | Immediate Review      |
|  40–79 | 🟡 MEDIUM | Routine Safety Review |
|   0–39 | 🟢 LOW    | Monitor               |

---

# 4. 🔗 Causal Safety Graph

One of the primary differentiating features of the platform is the **Causal Safety Graph**.

Instead of simply displaying:

> **Risk = 95**

the system visually explains the chain that produced the risk.

```text
Activity
   ↓
Hazard
   ↓
Barrier Failure
   ↓
Potential Consequence
```

### Example

```text
┌───────────────┐
│ Activity      │
│ Lifting       │
└───────┬───────┘
        ↓
┌───────────────┐
│ Hazard        │
│ Suspended     │
│ Load          │
└───────┬───────┘
        ↓
┌───────────────┐
│ Barrier       │
│ Failure       │
│ Exclusion     │
│ Zone Breach   │
└───────┬───────┘
        ↓
┌───────────────┐
│ Consequence   │
│ Crushing      │
└───────────────┘
```

The graph is implemented using **React Flow**, with the AI returning the nodes and edges as JSON.

### Why it matters

The Safety Officer can understand:

> **What happened → What hazard existed → Which barrier failed → What could happen.**

This makes the AI's decision transparent rather than a black-box prediction.

---

# 5. 🔍 Similar Incident Intelligence

The system uses **semantic vector search** to find historically similar incidents.

Instead of searching only for exact keywords, reports are converted into embeddings using:

```text
all-MiniLM-L6-v2
```

The resulting **384-dimensional vectors** are stored using PostgreSQL + pgvector.

### Example

Current report:

> "Worker bypassed interlock during pump maintenance."

The system may find:

```text
Historical Incident #421
Similarity: 88%

Historical Incident #187
Similarity: 84%

Historical Incident #092
Similarity: 79%
```

The MVP uses a **0.75 similarity threshold** and returns the top 3 matches, avoiding irrelevant low-similarity results.

### Why this is innovative

Traditional systems may rely on keyword matching.

Our system searches for **conceptual similarity**.

---

# 6. 📈 Emerging Precursor Detection

The system also detects when a hazard or barrier failure is becoming increasingly frequent.

Importantly, the MVP does **not** use complicated predictive ML for this.

Instead, it uses a transparent statistical approach.

### Two rolling windows

```text
Window A → Days 1–7
Window B → Days 8–14
```

Reports are grouped by:

* Hazard
* Barrier Failure

An emerging alert is triggered when:

```text
Count(B) ≥ 3

AND

Count(B) > Count(A) × 2
```

This avoids false alerts caused by small numbers such as a change from 1 report to 2 reports.

### Example

```text
Previous 7 days:
Lifting Hazard → 1 report

Current 7 days:
Lifting Hazard → 4 reports

4 ≥ 3 ✓
4 > 1 × 2 ✓

→ EMERGING PRECURSOR ALERT
```

---

# 7. 🛡️ Barrier Failure Intelligence

The system tracks which safety barriers are failing repeatedly.

Examples:

* LOTO violations
* Missing guards
* Failed interlocks
* PPE non-compliance
* Exclusion-zone breaches

Rather than treating these as isolated observations, the platform calculates their frequency and displays recurring barrier failures.

This provides safety teams with insight into:

> **Which controls are failing most frequently?**

The blueprint identifies this as an essential analytics module.

---

# 8. 👤 Human-in-the-Loop Validation

AI does not make the final decision.

The Safety Officer can:

* Review extracted information.
* Edit incorrect entities.
* Approve the extraction.
* Reject/correct the result.

When an extraction is edited:

```text
Human Correction
       ↓
Update Database
       ↓
Recalculate Risk Score
       ↓
Set Status = VALIDATED
```

The system does **not dynamically retrain the LLM during the hackathon**.

This ensures that safety professionals remain in control.

---

# 📊 Command Center Dashboard

The main dashboard provides a high-level view of organizational SIF risk.

### KPI Cards

```text
Total Reports
      │
High SIF Precursors
      │
Emerging Pattern Flag
      │
Most Failed Barrier
```

### Analytics

* SIF trend over time
* Site risk comparison
* Recent HIGH SIF reports
* Emerging hazards
* Barrier failure trends

The dashboard specification calls for a SIF trend chart, site comparison chart and the five most recent HIGH-risk reports.

---

# 📋 Report Intelligence Table

Each report can be displayed with:

| ID   | Date  | Site   | Hazard         | Risk Level | Status    |
| ---- | ----- | ------ | -------------- | ---------- | --------- |
| #001 | 05/09 | Site A | Suspended Load | 🔴 HIGH    | Pending   |
| #002 | 05/09 | Site B | Trip Hazard    | 🟢 LOW     | Validated |

### Available actions

* Search
* Filter by risk
* Bulk upload
* Open report
* Review
* Validate

---

# 🔎 Report Intelligence Page

Each individual report contains two major sections.

### Left — Data

* Original report text
* Extracted entities
* Editable fields
* Risk score
* Risk classification
* Approve/Edit controls

### Right — Intelligence

* Interactive causal safety graph
* Similar historical incidents
* Similarity percentages
* Safety reasoning

This is the **hero page** of the application.

---

# 🏗️ System Architecture

```text
                  SAFETY REPORTS
                         │
             ┌───────────┴───────────┐
             │                       │
         CSV / Excel             Free Text
             │                       │
             └───────────┬───────────┘
                         ↓
                  FastAPI Backend
                         ↓
                  Text Processing
                         ↓
              ┌────────────────────┐
              │   LLM Extraction   │
              │                    │
              │ Activity           │
              │ Hazard             │
              │ Exposure           │
              │ Barrier            │
              │ Barrier Failure    │
              │ Consequence        │
              └─────────┬──────────┘
                        ↓
             ┌──────────┴───────────┐
             ↓                      ↓
      Risk Scoring Engine       Embedding Engine
      Deterministic Math        MiniLM-L6-v2
             ↓                      ↓
       SIF Classification      pgvector
             │                      │
             └──────────┬───────────┘
                        ↓
              Intelligence Layer
                        │
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
  Causal Graph    Similar Incidents   Emerging
  React Flow       Vector Search      Patterns
        │               │                │
        └───────────────┼────────────────┘
                        ↓
                 Safety Dashboard
                        ↓
                 Human Validation
                        ↓
                  Final Decision
```

---

# 🛠️ Technology Stack

| Layer               | Technology           |
| ------------------- | -------------------- |
| Frontend            | Next.js + TypeScript |
| Styling             | Tailwind CSS         |
| Charts              | Recharts             |
| Graph Visualization | React Flow           |
| Backend             | FastAPI              |
| Database            | PostgreSQL           |
| Vector Search       | pgvector             |
| Embeddings          | SentenceTransformers |
| LLM Extraction      | OpenAI / Llama-3     |
| Validation          | Pydantic             |
| Deployment          | Docker / Cloud       |

The blueprint specifies Next.js App Router + TypeScript + Tailwind, FastAPI, PostgreSQL + pgvector, Recharts, React Flow, SentenceTransformers and an LLM API for structured extraction.

---

# 🗄️ Database Design

## `reports`

```text
id
created_at
raw_text
metadata
embedding
```

The embedding is stored as a:

```text
Vector(384)
```

using pgvector.

---

## `analyses`

```text
report_id
extracted_data
risk_score
sif_level
status
```

The extracted information is stored as **JSONB**, allowing the extraction schema to evolve during development without requiring repeated database migrations.

---

# 🔌 API

## Analyze Report

```http
POST /api/v1/reports/analyze
```

### Request

```json
{
  "site": "Rig 4",
  "text": "Worker bypassed interlock on pump."
}
```

### Response

```json
{
  "report_id": "uuid-123",
  "risk_score": 85,
  "risk_level": "HIGH",
  "confidence": 0.92,
  "extraction": {
    "activity": "Maintenance",
    "hazard": "Live Energy",
    "exposure": "Line of Fire",
    "barrier": "Interlock",
    "barrier_failure": "Bypassed",
    "potential_consequence": "Electrocution"
  }
}
```

---

## Similar Reports

```http
GET /api/v1/reports/{id}/similar
```

Returns the top semantically similar historical reports.

```json
{
  "similar_reports": [
    {
      "report_id": "uuid-456",
      "similarity": 0.88,
      "text": "...",
      "hazard": "Live Energy"
    }
  ]
}
```

The API contracts and example responses follow the system blueprint.

---

# 📦 Dataset Strategy

The prototype does **not use internal OIL data**.

For the hackathon, we use a carefully constructed **synthetic dataset seeded from public OSHA/OISD reports**.

The MVP targets approximately:

> **150–300 realistic safety reports**

Each report contains information such as:

```text
report_id
date
site
department
report_text
is_synthetic
extracted_entities
risk_score
sif_level
confidence
status
```

This approach allows the team to demonstrate the complete pipeline without claiming access to confidential organizational data.

---

# 🔐 Human + AI Safety Architecture

The system follows three important principles:

### 1. Explainable

Every risk classification should have understandable contributing factors.

### 2. Deterministic

The LLM extracts information, but the final risk score is calculated mathematically.

### 3. Auditable

Human corrections are recorded and the validated result is stored.

Therefore:

```text
AI → Assists
Human → Validates
System → Records
```

---

# 🧪 Edge Cases

The MVP handles important failure scenarios.

### Empty / Invalid Upload

Returns:

```http
400 Bad Request
```

### Multiple Hazards

The extraction can return:

```json
{
  "hazards": [
    "Spill",
    "Fire"
  ]
}
```

The scoring engine uses the highest applicable hazard score.

### Missing Date/Site

Defaults to:

```text
Unknown
```

while still processing the report.

### LLM Timeout

Returns:

```http
503 Service Unavailable
```

and displays an appropriate UI notification.

### Duplicate Reports

Reports are hashed and duplicate uploads are rejected.

---

# ⚡ Performance & Security

### Performance Targets

* Vector search: **<100 ms**
* LLM extraction: approximately **1–3 seconds**
* Frontend loading states for AI processing

### Security

* API keys stored in `.env`
* Secrets excluded from Git
* Pydantic validation for structured LLM responses
* Strict JSON schema enforcement

---

# 🚀 MVP Scope

The hackathon MVP focuses on six core capabilities:

* ✅ CSV Upload
* ✅ 150–300 Synthetic Safety Reports
* ✅ LLM-based Structured Extraction
* ✅ Deterministic SIF Risk Score
* ✅ Interactive Causal Safety Graph
* ✅ Semantic Similar Incident Search
* ✅ Human-in-the-Loop Validation

The blueprint deliberately excludes features that would increase scope without improving the core demonstration, including generic safety chatbots, real-time streaming integration and complex predictive forecasting requiring much larger datasets.

---

# 🌟 What Makes Us Different?

## Existing EHS Approach

```text
Safety Report
      ↓
Manual Review
      ↓
Classification
      ↓
Static Report
```

## Our Approach

```text
Safety Report
      ↓
AI Entity Extraction
      ↓
Deterministic SIF Scoring
      ↓
Causal Safety Graph
      ↓
Semantic Historical Search
      ↓
Emerging Pattern Detection
      ↓
Human Validation
      ↓
Actionable Intelligence
```

### Our three strongest differentiators

**1. Explainability**

The causal graph visually explains the failure chain.

**2. Deterministic Risk**

The LLM cannot arbitrarily decide the risk score.

**3. Semantic Incident Intelligence**

Vector search finds conceptually similar incidents rather than relying only on keywords.

These are identified in the blueprint as the core competitive edge of the architecture.

---

# 📁 Repository Structure

```text
sif-precursor-engine/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── dashboard/
│   ├── reports/
│   └── report-detail/
│
├── backend/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── scoring/
│   ├── embeddings/
│   └── main.py
│
├── data/
│   ├── synthetic_reports.csv
│   └── seed.py
│
├── notebooks/
│   ├── prompt_testing/
│   └── vector_testing/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 🔄 End-to-End Example

### Input

```text
Worker walks under a suspended load
during lifting operation.
The exclusion zone was breached.
```

### Step 1 — Extraction

```text
Activity:
Lifting

Hazard:
Suspended Load

Exposure:
Line of Fire

Barrier:
Exclusion Zone

Barrier Failure:
Exclusion Zone Breach

Consequence:
Crushing / Fatality
```

### Step 2 — Risk Calculation

```text
(30 × 1.5) + 20 + 30
= 95
```

### Step 3 — Classification

```text
95 → HIGH SIF
```

### Step 4 — Causal Graph

```text
Lifting
   ↓
Suspended Load
   ↓
Exclusion Zone Breach
   ↓
Crushing
```

### Step 5 — Similar Incidents

```text
Incident A → 88%
Incident B → 84%
Incident C → 79%
```

### Step 6 — Human Validation

Safety Officer reviews:

```text
[ Edit ] [ Approve ]
```

### Final Outcome

The Safety Officer receives **explainable, evidence-backed SIF intelligence** instead of simply receiving another incident record.

---

# 🎬 Demo Story

The four-minute demonstration follows this flow:

### 1. Hook

> **"Safety data is buried in text. We turn it into proactive intelligence."**

### 2. Dashboard

Show:

* SIF trends
* High-risk reports
* Emerging hazard clusters
* Failed barriers

### 3. Upload

Upload a raw safety report.

### 4. AI Processing

Show:

```text
Raw Text
 ↓
Extraction
 ↓
Risk Score
```

### 5. Hero Reveal

Open the report and show:

**HIGH SIF → Causal Safety Graph**

### 6. Differentiator

Show:

**3 similar historical incidents**

### 7. Close

> **"AI assisting humans. Actionable, explainable safety."**

---

# 🏆 Vision

Our vision is to help organizations move from:

> **Reactive Incident Management**

to:

> **Proactive SIF Prevention**

By transforming existing safety observations into **explainable precursor intelligence**, the system enables Safety Officers to identify high-potential risks, understand why they are dangerous, discover historical patterns, and prioritize intervention.

---

## 🔑 One-Line USP

> **An explainable AI system that transforms unstructured safety reports into deterministic SIF risk scores, causal failure chains, similar-incident intelligence, and emerging precursor alerts—while keeping the Safety Officer in control.**

---

### Built for SIH26165

**AI-Powered SIF Precursor Detection Engine**

**AI assists. Humans validate. Safety improves.**

