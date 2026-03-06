# Budget Watchdog Planning

This folder contains implementation plans for each major component of the Budget Watchdog Platform.

## Files

- `backend-plan.md` - FastAPI, DB models, services, pipeline orchestration, scheduler integration
- `api-plan.md` - Endpoint-by-endpoint implementation, contracts, validation, and testing
- `ai-ml-plan.md` - Feature engineering, Isolation Forest, rule engine, forecasting, reallocation logic
- `frontend-plan.md` - React application architecture and all five pages with live data

## Recommended Build Sequence

1. Backend foundation (`backend-plan.md` Phase 1-2)
2. AI/ML and analytics services (`ai-ml-plan.md`)
3. API integration and contract hardening (`api-plan.md`)
4. Frontend development and wiring (`frontend-plan.md`)
5. End-to-end validation and Docker compose demo

## Definition of Done

- All endpoints return data from PostgreSQL with runtime-derived fields
- Transaction insert triggers immediate Stage 1 anomaly detection for that department
- Scheduled jobs run `Stage 1 -> Stage 2 -> Stage 3` every 6 hours
- Sunday 2am retrain updates model artifact with backup
- Frontend reflects live status with 30s auto-refresh
- Reallocation approve/reject updates statuses and budget state correctly
# COHERENCE-26_Meticura
