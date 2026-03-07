# 📊 COHERENCE-26 Meticura

**Real-Time Budget Monitoring & Anomaly Detection Platform**  
*Advanced financial intelligence for government organizations*

---

## 🎯 Overview

**COHERENCE-26 Meticura** is an enterprise-grade budget management and financial monitoring system designed to provide government departments with real-time insights into budget utilization, anomaly detection, and predictive forecasting. The platform leverages machine learning to identify irregular spending patterns and optimize budget allocation.

### Key Features

✨ **Real-Time Monitoring**
- Live budget tracking across departments
- Instant anomaly detection and alerts
- Dashboard with interactive visualizations

🤖 **Advanced Analytics**
- ML-powered anomaly detection (multiple ensemble models)
- Budget lapse prediction
- Anomaly scoring and risk assessment

📈 **Budget Intelligence**
- Department-wise budget analysis
- Budget allocation optimization
- Spending forecasts and trend analysis

🔐 **Enterprise Security**
- Role-based access control (RBAC)
- Integrated authentication
- Audit logging and compliance tracking

---

## 🏗️ Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL 15
- **Cache & Message Broker:** Redis 7
- **Task Queue:** Celery
- **ML Models:** Scikit-Learn, AutoEncoder, LOF, DBSCAN, Isolation Forest
- **Authentication:** Custom JWT-based + Clerk integration
- **Server:** Uvicorn

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4
- **UI Components:** Shadcn UI
- **Animations:** Framer Motion
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Routing:** React Router v7

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Python Version:** 3.9+
- **Node Version:** 18+

---

## 📋 Prerequisites

Ensure you have the following installed on your system:

- **Docker** (v20.10+) and **Docker Compose** (v1.29+)
- **Node.js** (v18+) and **npm** (v9+)
- **Python** (v3.9+) and **pip**
- **Git**

### Verify Installation

```bash
docker --version
docker-compose --version
node --version
npm --version
python --version
```

---

## ⚙️ Environment Configuration

### 1. Create `.env` file at root level

```bash
cp .env.example .env  # if available, or create new
```

### 2. Configure Backend Environment Variables

Create or edit the `.env` file in the root directory with the following configurations:

```env
# Database Configuration
DATABASE_URL=postgresql://budget_user:budget_password@postgres:5432/budget_watchdog

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# Celery Configuration
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
CELERY_TIMEZONE=Asia/Kolkata

# Security
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars

# Super Admin Configuration
SUPER_ADMIN_EMAIL=admin@meticura.gov
SUPER_ADMIN_PASSWORD=Admin@123!meticura
SUPER_ADMIN_NAME=System Administrator

# API Configuration
API_V1_PREFIX=/api
PROJECT_NAME=Budget Watchdog API
LOG_LEVEL=INFO

# Clerk Configuration (Optional - for advanced authentication)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_JWT_VERIFICATION_KEY=your_clerk_jwt_key

# Optional: Development Auth (for local testing without Clerk)
DEV_AUTH_ENABLED=true
DEV_AUTH_TOKEN=demo-token
DEV_AUTH_USER_ID=dev_local_user
DEV_AUTH_EMAIL=admin@meticura.gov
```

### 3. Frontend Environment (Optional)

The frontend will automatically connect to the backend API at `http://localhost:8000/api`.

If deploying to production, create a `.env.production` file:

```env
VITE_API_URL=https://your-api-domain.com/api
```

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

#### Build and Start All Services

```bash
# Navigate to project root
cd COHERENCE-26_Meticura

# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

#### Access Services

- **Backend API:** http://localhost:8000
- **API Documentation (Swagger):** http://localhost:8000/api/docs
- **API Documentation (ReDoc):** http://localhost:8000/api/redoc
- **Frontend:** http://localhost:5173
- **Database:** localhost:5432
- **Redis:** localhost:6379

#### Initialize Database

```bash
# Create tables and seed initial data
docker-compose exec backend python seed_admin.py
docker-compose exec backend python seed_db.py
```

#### Stop Services

```bash
docker-compose down

# To also remove volumes and data:
docker-compose down -v
```

---

### Option 2: Local Development (Manual Setup)

#### Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Ensure PostgreSQL and Redis are running
# Then run migrations and seed data
python seed_admin.py
python seed_db.py

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, start Celery worker:
celery -A celery_app worker --loglevel=info
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev

# The frontend will be available at http://localhost:5173
```

---

## 🏗️ Building for Production

### Backend Build

```bash
cd Backend

# Build Docker image
docker build -t coherence-meticura-backend:latest .

# Or use docker-compose:
docker-compose build backend
```

### Frontend Build

```bash
cd Frontend

# Build for production
npm run build

# Output will be in dist/ directory
```

### Full Stack Production Build

```bash
# From root directory
docker-compose build

# Start with production settings
docker-compose -f docker-compose.yml up -d
```

---

## 📂 Project Structure

```
COHERENCE-26_Meticura/
├── Backend/                          # FastAPI Backend
│   ├── main.py                       # Application entry point
│   ├── config.py                     # Configuration management
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile                    # Backend container config
│   ├── celery_app.py                 # Celery task configuration
│   │
│   ├── auth/                         # Authentication module
│   │   ├── clerk.py                  # Clerk integration
│   │   ├── models.py                 # Auth models
│   │   ├── dependencies.py           # Auth dependencies
│   │   └── roles.py                  # RBAC definitions
│   │
│   ├── database/                     # Database layer
│   │   ├── models.py                 # SQLAlchemy models
│   │   └── __init__.py               # DB initialization
│   │
│   ├── routers/                      # API route handlers
│   │   ├── auth.py                   # Authentication endpoints
│   │   ├── budget.py                 # Budget endpoints
│   │   ├── anomalies.py              # Anomaly detection endpoints
│   │   ├── lapse.py                  # Lapse prediction endpoints
│   │   ├── predictions.py            # Predictions endpoints
│   │   ├── users.py                  # User management
│   │   ├── internal.py               # Internal endpoints
│   │   └── export.py                 # Data export endpoints
│   │
│   ├── services/                     # Business logic layer
│   │   ├── anomaly_service.py        # Anomaly detection logic
│   │   ├── lapse_service.py          # Lapse prediction logic
│   │   ├── budget_service.py         # Budget management
│   │   ├── pipeline_service.py       # ML pipeline orchestration
│   │   ├── cache.py                  # Caching utilities
│   │   └── export_service.py         # Export functionality
│   │
│   ├── ml/                           # Machine learning module
│   │   ├── models/                   # ML models
│   │   │   ├── autoencoder_model.py
│   │   │   ├── dbscan_model.py
│   │   │   ├── lof_model.py
│   │   │   └── ensemble.py
│   │   │
│   │   ├── artifacts/                # Trained models and metrics
│   │   ├── data_prep/                # Data preparation
│   │   ├── output/                   # ML pipeline outputs
│   │   ├── train.py                  # Model training
│   │   └── predict.py                # Prediction pipeline
│   │
│   ├── tests/                        # Test suites
│   │   └── test_services.py
│   │
│   └── logs/                         # Application logs
│
├── Frontend/                         # React Frontend
│   ├── src/
│   │   ├── main.tsx                  # Entry point
│   │   ├── App.tsx                   # Root component
│   │   │
│   │   ├── components/               # React components
│   │   │   ├── layout/               # Layout components
│   │   │   └── auth/                 # Auth components
│   │   │
│   │   ├── pages/                    # Page components
│   │   ├── context/                  # React Context states
│   │   │   ├── AuthContext.tsx
│   │   │   ├── BudgetContext.tsx
│   │   │   └── ...
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── lib/                      # Utilities and helpers
│   │   ├── i18n/                     # Internationalization
│   │   └── assets/                   # Static assets
│   │
│   ├── index.html                    # HTML template
│   ├── package.json                  # npm dependencies
│   ├── vite.config.ts                # Vite configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   └── Dockerfile                    # Frontend container config
│
├── docker-compose.yml                # Multi-container orchestration
├── .env                              # Environment variables (create this)
└── README.md                         # This file
```

---

## 🔌 API Documentation

Once the backend is running, access detailed API documentation:

### Interactive API Docs (Swagger UI)
```
http://localhost:8000/api/docs
```

### Alternative API Docs (ReDoc)
```
http://localhost:8000/api/redoc
```

### Key API Endpoints

**Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

**Budget Management**
- `GET /api/budget/departments` - List all departments
- `GET /api/budget/{dept_id}` - Department budget details
- `POST /api/budget/allocate` - Allocate budget
- `GET /api/budget/analysis` - Budget analysis dashboard

**Anomalies**
- `GET /api/anomalies/` - List detected anomalies
- `GET /api/anomalies/{id}` - Anomaly details
- `POST /api/anomalies/detect` - Trigger anomaly detection

**Predictions**
- `GET /api/predictions/lapse` - Budget lapse predictions
- `GET /api/predictions/forecast` - Budget forecasts

**Health Check**
- `GET /health` - Service health status

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd Backend
pytest test_auth.py -v

# Frontend linting
cd ../Frontend
npm run lint
```

### Manual API Testing

```bash
# Using curl
curl http://localhost:8000/api/docs

# Using Postman
# Import API collection from: http://localhost:8000/api/openapi.json
```

---

## 📊 Database Initialization

### Automatic Initialization (Docker)

Seed scripts run automatically when PostgreSQL initializes.

### Manual Initialization (Local Development)

```bash
cd Backend

# Create super admin
python seed_admin.py

# Seed sample data
python seed_db.py

# Fix any password issues
python migrate_fix_passwords.py
```

---

## 📝 Logs and Monitoring

### View Logs

```bash
# Docker logs
docker-compose logs -f backend      # Backend logs
docker-compose logs -f frontend     # Frontend logs
docker-compose logs -f celery_worker # Worker logs

# Local development
# Logs are written to: Backend/logs/budget_watchdog.log
tail -f Backend/logs/budget_watchdog.log
```

### Log Configuration

Edit `Backend/logging_config.py` to customize logging:
- Log level (DEBUG, INFO, WARNING, ERROR)
- Log format (JSON or text)
- Output destinations

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait for health check, then initialize
```

### Frontend Not Connecting to Backend

1. Verify backend is running: `http://localhost:8000/health`
2. Check CORS configuration in `Backend/config.py`
3. Clear browser cache and try again

### Memory Issues with ML Models

If experiencing high memory usage:
- Reduce batch size in ML configuration
- Increase Redis/PostgreSQL container limits in `docker-compose.yml`
- Monitor with: `docker stats`

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build production images
docker-compose build

# Push to registry (if applicable)
docker tag coherence-meticura-backend:latest your-registry/backend:latest
docker push your-registry/backend:latest

# Deploy
docker-compose up -d
```

### Environment-Specific Configuration

Create deployment-specific `.env` files:

```bash
.env                     # Default/local
.env.production         # Production
.env.staging           # Staging
```

Load specific environment:

```bash
docker-compose --env-file .env.production up -d
```

---

## 📚 Documentation

- **[Phase 7 Final Delivery](PHASE7_FINAL_DELIVERY.txt)** - Complete feature list and deliverables
- **API Documentation** - Available at `/api/docs` when service is running
- **Architecture** - See `Backend/` and `Frontend/` for detailed structure

---

## 🤝 Development Guidelines

### Code Style
- **Backend:** Follow PEP 8 conventions
- **Frontend:** Use ESLint configuration (run `npm run lint`)

### Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make your changes
# ...

# Run tests
cd Backend && pytest
cd ../Frontend && npm run lint

# Commit and push
git commit -m "feat: description"
git push origin feature/your-feature
```

### Common Development Tasks

```bash
# Run type checking (Frontend)
cd Frontend
tsc --noEmit

# Format code (Backend)
cd Backend
black .

# Run specific test
pytest test_auth.py::test_login -v
```

---

## 📞 Support & Contribution

For issues, questions, or contributions, please contact the development team.

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

## 📊 Project Status

✅ **Status:** Production Ready  
📅 **Last Updated:** March 2026  
🔧 **Maintained By:** Team Meticura  

---

**Made with ❤️ for financial excellence**
