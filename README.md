<p align="center">
  <img src="Frontend/ScreenShots/landng-page-header.png" alt="Meticura – Budget Watchdog" width="100%" />
</p>

<h1 align="center">Meticura — Budget Watchdog</h1>

<p align="center">
  <strong>AI-powered real-time budget monitoring &amp; anomaly detection platform for government departments</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ML_Accuracy-96.8%25-brightgreen?style=for-the-badge" alt="96.8% Accuracy" />
  <img src="https://img.shields.io/badge/Models-6_Ensemble-blue?style=for-the-badge" alt="6-Model Ensemble" />
  <img src="https://img.shields.io/badge/Departments-500+-orange?style=for-the-badge" alt="500+ Departments" />
  <img src="https://img.shields.io/badge/Transactions-90k+-purple?style=for-the-badge" alt="90k+ Transactions" />
</p>

<p align="center">
  <a href="#-problem-statement">Problem</a> •
  <a href="#-our-solution">Solution</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-ml-pipeline--968-accuracy">ML Pipeline</a> •
  <a href="#-database-schema">Database</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-pitch-deck">Pitch Deck</a>
</p>

---

## 🔍 Problem Statement

Government departments across India manage **thousands of crores** in annual budget allocations. Yet fiscal mismanagement remains rampant:

| Problem | Impact |
|---------|--------|
| **Budget Lapse** | ₹1,00,000+ crore returned unspent every fiscal year across central & state departments |
| **End-of-Year Dumping** | Departments rush to spend 40%+ of their budget in the final 30 days — waste and poor outcomes |
| **Anomalous Spending** | Micro-transaction fragmentation, ghost expenditures, and overspending go undetected until audit |
| **Zero Visibility** | Administrators lack real-time oversight into how departments are utilizing allocations |
| **Manual Auditing** | Periodic manual reviews — reactive, slow, and error-prone |

There is **no centralized, intelligent, real-time system** that can detect fiscal anomalies as they happen, predict which departments will lapse, and recommend corrective reallocation — until now.

---

## 💡 Our Solution

**Meticura** is a full-stack, AI-driven budget surveillance platform built around three intelligent engines:

<table>
<tr>
<td width="33%" valign="top">

### 🛡️ Anomaly Detection
A stacked ensemble of **6 unsupervised ML models** + **6 expert rules** trained on 90,000+ synthetic government transactions — detecting spending anomalies with **96.8% accuracy**.

</td>
<td width="33%" valign="top">

### 📉 Lapse Prediction
Weighted linear extrapolation forecasts which departments will **under-spend**, classifying risk (Low → Critical → Depleted) with **R² = 0.775** across 500 departments.

</td>
<td width="33%" valign="top">

### 🔄 Smart Reallocation
Rule-based optimization generates **donor → recipient** transfers — prioritizing same-district — redirecting surplus before the fiscal year ends.

</td>
</tr>
</table>

<table>
<tr>
<td width="50%" valign="top">

### 👥 Role-Based Dashboard
Four RBAC roles (Center Admin, District Admin, Department Admin, Citizen) each see a tailored dashboard with KPIs and alerts scoped to their jurisdiction.

</td>
<td width="50%" valign="top">

### ⚙️ Automated Pipeline
A three-stage pipeline (Anomaly → Lapse → Reallocation) runs via Celery — every 6 hours for live data, weekly for full model retraining.

</td>
</tr>
</table>

---

## 🏛️ System Architecture

<p align="center">
  <img src="Frontend/ScreenShots/System-Architecture.png" alt="System Architecture" width="100%" />
</p>

---



### 9 Engineered Features

| # | Feature | Formula | Signal |
|:-:|---------|---------|--------|
| 1 | `spend_velocity` | total_spent ÷ days_into_fy | Daily burn rate |
| 2 | `utilization_pct` | total_spent ÷ allocation × 100 | % budget consumed |
| 3 | `days_since_last_txn` | today − max(txn_date) | Inactivity |
| 4 | `daily_variance` | std(daily_spend) | Spending consistency |
| 5 | `end_period_spike_ratio` | last_30d_spend ÷ total_spend | Year-end dumping |
| 6 | `transaction_count` | count(transactions) | Volume |
| 7 | `avg_transaction_size` | total_spent ÷ txn_count | Fragmentation |
| 8 | `budget_remaining_ratio` | remaining ÷ allocation | Lapse indicator |
| 9 | `days_into_fiscal_year` | today − fiscal_start | Temporal context |

### Model Performance

| Model | Precision | Recall | F1 Score | AUC-ROC | Weight |
|-------|:---------:|:------:|:--------:|:-------:|:------:|
| **Isolation Forest** | **0.943** | **0.917** | **0.930** | **0.887** | 30% |
| One-Class SVM | 0.500 | 0.200 | 0.286 | 0.820 | 15% |
| Autoencoder | 0.500 | 0.200 | 0.286 | 0.735 | 20% |
| Local Outlier Factor | — | — | — | 0.725 | 20% |
| DBSCAN | — | — | — | 0.500 | 10% |
| Elliptic Envelope | 1.000 | 0.200 | 0.333 | — | 5% |

### Ensemble — Final Metrics

<table>
<tr>
<td>

| Metric | Value |
|--------|:-----:|
| **Accuracy** | **96.8%** |
| **AUC-ROC** | **0.90** |
| **Precision** | **1.00** |
| **Threshold** | 0.585 |

</td>
<td>

**Confusion Matrix (Primary — Isolation Forest):**

|  | Predicted Healthy | Predicted Anomalous |
|--|:-:|:-:|
| **Actually Healthy** (356) | 348 ✅ | 8 |
| **Actually Anomalous** (144) | 12 | 132 ✅ |

</td>
</tr>
</table>

### Six Deterministic Rules

| Rule | Condition | Severity |
|:----:|-----------|:--------:|
| R001 | Zero transactions after 60+ days | 🔴 HIGH |
| R002 | Inactive 90+ days with < 50% utilization | 🔴 HIGH |
| R003 | 40%+ of budget spent in final 30 days | 🟡 MEDIUM |
| R004 | 85%+ consumed within first 90 days | 🟡 MEDIUM |
| R005 | High-volume micro-transactions (fragmentation) | 🟢 LOW |
| R006 | Spending exceeds allocation | 🔴 CRITICAL |

### Lapse Prediction Engine

| Metric | Value |
|--------|-------|
| Method | Weighted linear extrapolation (70% recent · 30% historical) |
| Average R² | **0.775** |
| Coverage | 500 departments |
| High confidence | 307 depts |
| Medium confidence | 113 depts |
| Low confidence | 80 depts |

---


---

## 🏗️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 · TypeScript · Tailwind CSS v4 |
| **Charting** | Recharts · React Flow · Framer Motion |
| **Icons** | Lucide React |
| **Backend** | FastAPI · Python 3.11 · SQLAlchemy · Pydantic |
| **Auth** | Custom JWT + RBAC (4 roles) |

</td>
<td width="50%" valign="top">

| Layer | Technology |
|-------|------------|
| **Database** | Supabase (PostgreSQL) — hosted |
| **Cache / Broker** | Redis 7 |
| **Task Queue** | Celery (worker + beat) |
| **ML** | scikit-learn · NumPy · Pandas · Joblib |
| **Infra** | Docker · Docker Compose · Flower |

</td>
</tr>
</table>

---

## 📸 Screenshots

<p align="center"><strong>Landing Page</strong></p>
<p align="center">
  <img src="Frontend/ScreenShots/Full-Landing-page.png" alt="Full Landing Page" width="100%" />
</p>

<table>
<tr>
<td width="50%">
<p align="center"><strong>Dashboard Overview</strong></p>
<img src="Frontend/ScreenShots/Dashboard-Overview.png" alt="Dashboard Overview" width="100%" />
</td>
<td width="50%">
<p align="center"><strong>Budget Overview</strong></p>
<img src="Frontend/ScreenShots/Budget-Overview.png" alt="Budget Overview" width="100%" />
</td>
</tr>
<tr>
<td width="50%">
<p align="center"><strong>AI Model Section</strong></p>
<img src="Frontend/ScreenShots/AI-Model-Section.png" alt="AI Model Section" width="100%" />
</td>
<td width="50%">
<p align="center"><strong>Lapse Prediction</strong></p>
<img src="Frontend/ScreenShots/lapseprediction.png" alt="Lapse Prediction" width="100%" />
</td>
</tr>
<tr>
<td width="50%">
<p align="center"><strong>Reallocation Engine</strong></p>
<img src="Frontend/ScreenShots/Reallocation-Section.png" alt="Reallocation Section" width="100%" />
</td>
<td width="50%">
<p align="center"><strong>Organization Tree</strong></p>
<img src="Frontend/ScreenShots/Orginazation-Tree.png" alt="Organization Tree" width="100%" />
</td>
</tr>
<tr>
<td width="50%">
<p align="center"><strong>Engine Status</strong></p>
<img src="Frontend/ScreenShots/Engine.png" alt="Engine Status" width="100%" />
</td>
<td width="50%">
</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- A [Supabase](https://supabase.com) project (free tier works)
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/meticura.git
cd meticura
cp .env.example .env
```

Edit `.env` and set your **Supabase `DATABASE_URL`** (Supabase Dashboard → Settings → Database → Connection Pooler):

```env
DATABASE_URL=postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (Vite dev) | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| Flower (Celery UI) | http://localhost:5555 |

### 3. Run Locally (without Docker)

<table>
<tr>
<td width="50%" valign="top">

**Backend:**
```bash
cd Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

</td>
<td width="50%" valign="top">

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

</td>
</tr>
</table>

### 4. Train ML Models

```bash
cd Backend
python -m ml.synthetic_data        # Generate 90k synthetic transactions
python -m ml.train                 # Train Isolation Forest (primary)
python -m ml.train_ensemble        # Train 6-model stacked ensemble
python -m ml.train_lapse_predictor # Train lapse prediction models
```

### 5. Seed the Database

```bash
cd Backend
python seed_db.py    # Seed departments, allocations, transactions
python seed_admin.py # Create the super admin user
```

---

## 📁 Project Structure

```
meticura/
├── Backend/
│   ├── main.py                    # FastAPI entry point
│   ├── config.py                  # Pydantic settings
│   ├── celery_app.py              # Celery worker + beat
│   ├── seed_db.py                 # Database seeder
│   ├── seed_admin.py              # Admin user seeder
│   ├── logging_config.py          # Logging setup
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── clerk.py               # Clerk integration
│   │   ├── dependencies.py        # Auth dependencies
│   │   ├── models.py              # Auth models
│   │   ├── roles.py               # RBAC role definitions
│   │   └── utils.py               # Auth utilities
│   ├── database/
│   │   ├── __init__.py            # DB connection & session
│   │   └── models.py              # SQLAlchemy ORM models
│   ├── routers/
│   │   ├── auth.py                # Auth routes
│   │   ├── budget.py              # Budget routes
│   │   ├── anomalies.py           # Anomaly routes
│   │   ├── lapse.py               # Lapse prediction routes
│   │   ├── predictions.py         # ML prediction routes
│   │   ├── reallocation.py        # Reallocation routes
│   │   ├── users.py               # User management routes
│   │   ├── export.py              # CSV/PDF export routes
│   │   └── internal.py            # Internal pipeline routes
│   ├── services/
│   │   ├── anomaly_service.py     # Anomaly detection logic
│   │   ├── forecast_service.py    # Forecasting logic
│   │   ├── lapse_service.py       # Lapse prediction logic
│   │   ├── predictions_service.py # ML predictions logic
│   │   ├── reallocation_service.py# Reallocation logic
│   │   ├── pipeline_service.py    # Pipeline orchestration
│   │   ├── export_service.py      # Export logic
│   │   └── cache.py               # Redis cache layer
│   ├── ml/
│   │   ├── feature_engineering.py # 9 derived features
│   │   ├── rules.py               # 6 deterministic rules
│   │   ├── train.py               # Isolation Forest training
│   │   ├── ensemble.py            # 6-model stacked ensemble
│   │   ├── train_ensemble.py      # Ensemble training script
│   │   ├── train_lapse_predictor.py # Lapse model training
│   │   ├── train_with_eval.py     # Training with evaluation
│   │   ├── predict.py             # Inference
│   │   ├── lapse_prediction.py    # Lapse forecasting
│   │   ├── synthetic_data.py      # 90k record generator
│   │   ├── build_features_from_csv.py
│   │   ├── inspect_metrics.py     # Metrics inspection
│   │   ├── artifacts/             # Trained models & metrics
│   │   ├── models/                # Saved model files
│   │   ├── data_prep/             # Data preparation utils
│   │   └── output/                # Training output
│   └── tests/
│       └── test_services.py
├── Frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── public/
│   ├── ScreenShots/               # App screenshots
│   └── src/
│       ├── App.tsx                # Root component
│       ├── main.tsx               # Entry point
│       ├── pages/
│       │   ├── dashboard/         # Main dashboard
│       │   ├── budget/            # Budget management
│       │   ├── anomalies/         # Anomaly detection UI
│       │   ├── lapse/             # Lapse prediction UI
│       │   ├── reallocation/      # Reallocation UI
│       │   ├── engine/            # ML engine status
│       │   ├── my-models/         # Model management
│       │   ├── transactions/      # Transaction viewer
│       │   ├── tree/              # Organization tree
│       │   ├── reports/           # Reports
│       │   ├── users/             # User management
│       │   ├── auth/              # Auth pages
│       │   └── citizen/           # Citizen portal
│       ├── components/
│       │   ├── auth/              # Auth components
│       │   └── layout/            # Layout components
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   ├── DashboardContext.tsx
│       │   ├── BudgetContext.tsx
│       │   ├── AnomalyContext.tsx
│       │   ├── LapseContext.tsx
│       │   ├── ReallocationContext.tsx
│       │   ├── EngineContext.tsx
│       │   ├── UsersContext.tsx
│       │   └── LanguageContext.tsx
│       ├── hooks/
│       │   └── useClerkSync.ts    # Clerk sync hook
│       ├── lib/
│       │   ├── api.ts             # API client
│       │   ├── apiConfig.ts       # API configuration
│       │   ├── permissions.ts     # Permission helpers
│       │   └── utils.ts           # Utility functions
│       ├── landing/               # Landing page
│       │   ├── page.tsx
│       │   └── components/
│       ├── i18n/                  # Internationalization
│       └── assets/
├── docker-compose.yml
├── BudgetWatchdog_PitchDeck.pdf
├── README.md
└── .env.example
```

---


## 📄 Pitch Deck

<p align="center">
  <a href="BudgetWatchdog_PitchDeck.pdf">
    <img src="https://img.shields.io/badge/📄_View_Pitch_Deck-PDF-red?style=for-the-badge" alt="View Pitch Deck" />
  </a>
</p>

<p align="center">
  <object data="BudgetWatchdog_PitchDeck.pdf" type="application/pdf" width="100%" height="800">
    <embed src="BudgetWatchdog_PitchDeck.pdf" type="application/pdf" width="100%" height="800" />
    <p align="center">
      Your browser does not support embedded PDFs.
      <a href="BudgetWatchdog_PitchDeck.pdf"><strong>Download the Pitch Deck here</strong></a>.
    </p>
  </object>
</p>

---

## COHERENCE-26

Built for the **/ Coherence 26 by MLSC VCET** initiative.

---

<p align="center"><sub>Made with ❤️ by Team Meticura</sub></p>
