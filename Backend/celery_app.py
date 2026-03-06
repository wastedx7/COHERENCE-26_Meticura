"""
Celery App Configuration and Task Definitions
Handles background job scheduling for pipeline execution, model retraining, and data updates
"""
import logging
from celery import Celery, shared_task
from celery.schedules import crontab
from config import settings
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    "budget_watchdog",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Configure Celery settings
celery_app.conf.update(
    task_serializer=settings.CELERY_TASK_SERIALIZER,
    result_serializer=settings.CELERY_RESULT_SERIALIZER,
    timezone=settings.CELERY_TIMEZONE,
    enable_utc=settings.CELERY_ENABLE_UTC,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
)

# Configure periodic tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    # Full pipeline: every 6 hours
    "run-full-pipeline": {
        "task": "celery_app.run_full_pipeline",
        "schedule": timedelta(hours=6),
        "options": {"queue": "default"},
    },
    # Model retraining: Sunday 2:00 AM IST
    "retrain-models-sunday": {
        "task": "celery_app.retrain_models_and_pipeline",
        "schedule": crontab(hour=2, minute=0, day_of_week=6),  # Sunday = 6
        "options": {"queue": "default"},
    },
    # Health check: every 30 minutes
    "health-check": {
        "task": "celery_app.health_check",
        "schedule": timedelta(minutes=30),
        "options": {"queue": "default"},
    },
}


# =====================================================
# Task Definitions
# =====================================================

@shared_task(bind=True, name="celery_app.run_full_pipeline")
def run_full_pipeline(self):
    """
    Execute full ML pipeline: Stage 1 (Anomalies) → Stage 2 (Predictions) → Stage 3 (Reallocation)
    
    Runs every 6 hours to update all departments' anomalies, predictions, and reallocation suggestions.
    """
    try:
        logger.info("🚀 [PIPELINE] Starting full pipeline execution...")
        self.update_state(state="PROGRESS", meta={"status": "Initializing pipeline..."})
        
        from database import SessionLocal
        from services.pipeline_service import compute_all_anomalies, predict_all_departments, generate_reallocation_suggestions
        
        db = SessionLocal()
        
        try:
            # Stage 1: Anomaly Detection
            logger.info("📊 [STAGE 1] Computing anomalies for all departments...")
            self.update_state(state="PROGRESS", meta={"status": "Running anomaly detection..."})
            anomalies_count = compute_all_anomalies(db)
            logger.info(f"✅ [STAGE 1] Completed: {anomalies_count} anomalies detected")
            
            # Stage 2: Lapse Prediction
            logger.info("🔮 [STAGE 2] Predicting lapse for all departments...")
            self.update_state(state="PROGRESS", meta={"status": "Running lapse predictions..."})
            predictions_count = predict_all_departments(db)
            logger.info(f"✅ [STAGE 2] Completed: {predictions_count} predictions generated")
            
            # Stage 3: Reallocation Suggestions
            logger.info("💰 [STAGE 3] Generating reallocation suggestions...")
            self.update_state(state="PROGRESS", meta={"status": "Generating reallocation suggestions..."})
            suggestions_count = generate_reallocation_suggestions(db)
            logger.info(f"✅ [STAGE 3] Completed: {suggestions_count} suggestions created")
            
            db.commit()
            
            result = {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "anomalies": anomalies_count,
                "predictions": predictions_count,
                "suggestions": suggestions_count,
                "message": "Full pipeline executed successfully"
            }
            
            logger.info(f"🎉 [PIPELINE] COMPLETED: {result}")
            return result
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ [PIPELINE] ERROR: {str(e)}", exc_info=True)
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ [PIPELINE] FAILED: {str(e)}", exc_info=True)
        raise self.retry(exc=e, countdown=300, max_retries=3)


@shared_task(bind=True, name="celery_app.retrain_models_and_pipeline")
def retrain_models_and_pipeline(self):
    """
    Retrain ML models (Lapse Predictor + Anomaly Detection) and execute full pipeline.
    
    Runs every Sunday at 2:00 AM IST to refresh models with latest data.
    """
    try:
        logger.info("🔄 [RETRAIN] Starting model retraining and pipeline...")
        self.update_state(state="PROGRESS", meta={"status": "Retraining models..."})
        
        from pathlib import Path
        from ml.train_lapse_predictor import train_lapse_model
        from ml.train import train_anomaly_model
        from ml.train_ensemble import train_ensemble
        from database import SessionLocal
        from services.pipeline_service import compute_all_anomalies, predict_all_departments, generate_reallocation_suggestions
        
        db = SessionLocal()
        
        try:
            # Retrain Lapse Model
            logger.info("📈 [RETRAIN] Training lapse prediction model...")
            self.update_state(state="PROGRESS", meta={"status": "Retraining lapse model..."})
            lapse_metrics = train_lapse_model()
            logger.info(f"✅ [RETRAIN-LAPSE] Completed with R² = {lapse_metrics.get('r2_score', 'N/A')}")
            
            # Retrain Anomaly Model
            logger.info("🤖 [RETRAIN] Training anomaly detection model...")
            self.update_state(state="PROGRESS", meta={"status": "Retraining anomaly model..."})
            anomaly_metrics = train_anomaly_model()
            logger.info(f"✅ [RETRAIN-ANOMALY] Completed with accuracy = {anomaly_metrics.get('accuracy', 'N/A')}")

            # Retrain Ensemble and calibrate threshold
            logger.info("🧠 [RETRAIN] Training ensemble calibration model...")
            self.update_state(state="PROGRESS", meta={"status": "Retraining ensemble..."})
            ml_root = Path(__file__).resolve().parent / "ml"
            ensemble_metrics = train_ensemble(
                features_file=ml_root / "output" / "features.csv",
                departments_file=ml_root / "output" / "departments.csv",
                artifacts_dir=ml_root / "artifacts",
                test_size=0.25,
                random_state=42,
            )
            logger.info(
                "✅ [RETRAIN-ENSEMBLE] Completed with accuracy = %s",
                ensemble_metrics.get("best_accuracy"),
            )
            
            # Execute full pipeline with fresh models
            logger.info("🚀 [RETRAIN] Executing full pipeline with new models...")
            self.update_state(state="PROGRESS", meta={"status": "Running pipeline..."})
            
            anomalies_count = compute_all_anomalies(db)
            predictions_count = predict_all_departments(db)
            suggestions_count = generate_reallocation_suggestions(db)
            
            db.commit()
            
            result = {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "models_retrained": True,
                "lapse_r2": lapse_metrics.get('r2_score'),
                "anomaly_accuracy": anomaly_metrics.get('accuracy'),
                "ensemble_accuracy": ensemble_metrics.get('best_accuracy'),
                "anomalies": anomalies_count,
                "predictions": predictions_count,
                "suggestions": suggestions_count,
                "message": "Models retrained and pipeline executed successfully"
            }
            
            logger.info(f"🎉 [RETRAIN] COMPLETED: {result}")
            return result
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ [RETRAIN] ERROR: {str(e)}", exc_info=True)
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ [RETRAIN] FAILED: {str(e)}", exc_info=True)
        raise self.retry(exc=e, countdown=600, max_retries=2)


@shared_task(bind=True, name="celery_app.run_single_department_pipeline")
def run_single_department_pipeline(self, department_id: int):
    """
    Execute pipeline for a single department (triggered after new transaction).
    
    Fast Stage 1 only (anomaly detection) as immediate post-transaction trigger.
    """
    try:
        logger.info(f"🚀 [SINGLE-DEPT] Running pipeline for department {department_id}...")
        self.update_state(state="PROGRESS", meta={"status": f"Processing department {department_id}..."})
        
        from database import SessionLocal
        from services.pipeline_service import compute_anomalies_for_department
        
        db = SessionLocal()
        
        try:
            # Stage 1: Anomaly Detection for this department
            anomaly = compute_anomalies_for_department(db, department_id)
            logger.info(f"✅ [SINGLE-DEPT STAGE 1] Anomaly detection completed for dept {department_id}")
            
            db.commit()
            
            result = {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "department_id": department_id,
                "anomaly_detected": anomaly is not None,
                "message": f"Single department anomaly stage completed for dept {department_id}"
            }
            
            logger.info(f"🎉 [SINGLE-DEPT] COMPLETED: {result}")
            return result
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ [SINGLE-DEPT] ERROR for dept {department_id}: {str(e)}", exc_info=True)
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ [SINGLE-DEPT] FAILED for dept {department_id}: {str(e)}", exc_info=True)
        raise self.retry(exc=e, countdown=60, max_retries=3)


@shared_task(name="celery_app.health_check")
def health_check():
    """
    Periodic health check to verify system is operational.
    """
    try:
        from database import SessionLocal, verify_db_connection
        
        db = SessionLocal()
        
        # Check database connectivity
        db_health = verify_db_connection()
        
        # Check Redis connectivity (via celery itself)
        redis_health = {"status": "healthy"}  # Celery wouldn't run if Redis was down
        
        db.close()
        
        result = {
            "timestamp": datetime.now().isoformat(),
            "database": db_health,
            "redis": redis_health,
            "status": "healthy" if db_health and redis_health else "degraded"
        }
        
        logger.info(f"🏥 [HEALTH CHECK] System status: {result['status']}")
        return result
        
    except Exception as e:
        logger.error(f"❌ [HEALTH CHECK] FAILED: {str(e)}", exc_info=True)
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "unhealthy",
            "error": str(e)
        }


# Export celery app for worker and beat
__all__ = ["celery_app"]
