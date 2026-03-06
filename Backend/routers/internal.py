from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, require_auth
from database import get_db
from services.pipeline_service import execute_full_pipeline
from seed_db import seed_database


router = APIRouter(prefix="/internal", tags=["Internal"])


def _require_admin(user: AuthenticatedUser) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


@router.post("/run-pipeline")
async def run_pipeline_now(
    user: AuthenticatedUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    _require_admin(user)
    result = execute_full_pipeline(db, trigger="manual")
    return {"success": True, "result": result}


@router.post("/retrain-model")
async def retrain_models(
    user: AuthenticatedUser = Depends(require_auth),
):
    _require_admin(user)

    try:
        from celery_app import retrain_models_and_pipeline

        task = retrain_models_and_pipeline.delay()
        return {
            "success": True,
            "mode": "queued",
            "task_id": task.id,
        }
    except Exception:
        from ml.train import train_anomaly_model
        from ml.train_ensemble import train_ensemble
        from ml.train_lapse_predictor import train_lapse_model

        ml_root = Path(__file__).resolve().parent.parent / "ml"
        lapse = train_lapse_model()
        anomaly = train_anomaly_model()
        ensemble = train_ensemble(
            features_file=ml_root / "output" / "features.csv",
            departments_file=ml_root / "output" / "departments.csv",
            artifacts_dir=ml_root / "artifacts",
            test_size=0.25,
            random_state=42,
        )
        return {
            "success": True,
            "mode": "inline",
            "lapse_r2": lapse.get("r2_score"),
            "anomaly_accuracy": anomaly.get("accuracy"),
            "ensemble_accuracy": ensemble.get("best_accuracy"),
        }


@router.post("/seed-data")
async def seed_data(user: AuthenticatedUser = Depends(require_auth)):
    _require_admin(user)
    ok = seed_database()
    if not ok:
        raise HTTPException(status_code=500, detail="Seeding failed")
    return {"success": True, "message": "Seed completed"}
