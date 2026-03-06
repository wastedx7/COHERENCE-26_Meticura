"""
Pipeline Orchestration Service
Coordinates execution of anomaly detection, predictions, and reallocation stages
Used by both Celery background tasks and on-demand API triggers
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


def compute_all_anomalies(db: Session) -> int:
    """
    Stage 1: Compute anomalies for all departments
    
    Args:
        db: SQLAlchemy session
        
    Returns:
        Number of anomalies detected/updated
    """
    try:
        from database.models import Department, Anomaly
        from services.anomaly_service import AnomalyService
        from datetime import datetime
        
        logger.info("🔍 [STAGE 1] Starting anomaly detection for all departments...")
        
        service = AnomalyService()
        
        # Get all departments
        departments = db.query(Department).all()
        
        anomaly_count = 0
        
        for dept in departments:
            try:
                # Detect anomalies using service
                result = service.detect_anomalies(dept.dept_id)
                
                if result.rule_flagged or result.ml_flagged:
                    # Create/update anomaly record
                    existing = db.query(Anomaly).filter(
                        Anomaly.dept_id == dept.dept_id,
                        Anomaly.resolved_at.is_(None)
                    ).first()
                    
                    if existing:
                        # Update existing unresolved anomaly
                        existing.severity = result.combined_verdict
                        existing.rule_violations = result.rule_violations
                        existing.ml_flagged = result.ml_flagged
                        existing.ml_score = result.ml_score
                        existing.updated_at = datetime.utcnow()
                    else:
                        # Create new anomaly
                        anomaly = Anomaly(
                            dept_id=dept.dept_id,
                            severity=result.combined_verdict,
                            detection_type="ml_and_rules",
                            rule_violations=result.rule_violations,
                            ml_flagged=result.ml_flagged,
                            ml_score=result.ml_score,
                            created_at=datetime.utcnow(),
                        )
                        db.add(anomaly)
                    
                    anomaly_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Error processing department {dept.dept_id}: {str(e)}")
                continue
        
        db.commit()
        logger.info(f"✅ Anomaly detection complete: {anomaly_count} anomalies")
        return anomaly_count
        
    except Exception as e:
        logger.error(f"❌ Anomaly detection failed: {str(e)}")
        db.rollback()
        raise


def compute_anomalies_for_department(db: Session, department_id: int) -> Optional[Dict]:
    """
    Compute anomalies for a single department (triggered by new transaction)
    
    Args:
        db: SQLAlchemy session
        department_id: Department ID
        
    Returns:
        Anomaly result dictionary or None
    """
    try:
        from database.models import Anomaly
        from services.anomaly_service import AnomalyService
        from datetime import datetime
        
        logger.info(f"🔍 [STAGE 1] Computing anomalies for department {department_id}...")
        
        service = AnomalyService()
        result = service.detect_anomalies(department_id)
        
        if result.rule_flagged or result.ml_flagged:
            # Create/update anomaly record
            existing = db.query(Anomaly).filter(
                Anomaly.dept_id == department_id,
                Anomaly.resolved_at.is_(None)
            ).first()
            
            if existing:
                existing.severity = result.combined_verdict
                existing.ml_flagged = result.ml_flagged
                existing.ml_score = result.ml_score
                existing.updated_at = datetime.utcnow()
            else:
                anomaly = Anomaly(
                    dept_id=department_id,
                    severity=result.combined_verdict,
                    detection_type="ml_and_rules",
                    ml_flagged=result.ml_flagged,
                    ml_score=result.ml_score,
                    created_at=datetime.utcnow(),
                )
                db.add(anomaly)
            
            db.commit()
            logger.info(f"✅ Anomaly detection for dept {department_id}: {result.combined_verdict}")
            return result.to_dict()
        else:
            logger.info(f"✅ No anomalies for dept {department_id}")
            return None
            
    except Exception as e:
        logger.error(f"❌ Anomaly detection failed for dept {department_id}: {str(e)}")
        db.rollback()
        raise


def predict_all_departments(db: Session) -> int:
    """
    Stage 2: Generate lapse predictions for all departments
    
    Args:
        db: SQLAlchemy session
        
    Returns:
        Number of predictions generated
    """
    try:
        from database.models import Department, LaspePrediction
        from ml.lapse_prediction import LaspePredictor
        from datetime import datetime, timedelta
        
        logger.info("🔮 [STAGE 2] Starting lapse predictions for all departments...")
        
        predictor = LaspePredictor()
        fiscal_year_start = datetime(datetime.now().year, 1, 1)
        
        departments = db.query(Department).all()
        prediction_count = 0
        
        for dept in departments:
            try:
                # Get prediction
                pred = predictor.predict(dept.dept_id)
                risk = predictor.get_risk_level(dept.dept_id)
                
                # Check if exists
                existing = db.query(LaspePrediction).filter(
                    LaspePrediction.dept_id == dept.dept_id
                ).first()
                
                predicted_date = fiscal_year_start + timedelta(
                    days=int(pred.get('predicted_lapse_day', 365))
                )
                
                if existing:
                    # Update
                    existing.r2_score = pred.get('r2_score', 0.0)
                    existing.predicted_lapse_day = pred.get('predicted_lapse_day', 365)
                    existing.predicted_lapse_date = predicted_date
                    existing.risk_level = risk['risk_level']
                    existing.risk_score = risk['risk_score']
                    existing.days_until_lapse = risk['days_until_lapse']
                    existing.updated_at = datetime.utcnow()
                else:
                    # Create new
                    lapse_pred = LaspePrediction(
                        dept_id=dept.dept_id,
                        r2_score=pred.get('r2_score', 0.0),
                        predicted_lapse_day=pred.get('predicted_lapse_day', 365),
                        predicted_lapse_date=predicted_date,
                        risk_level=risk['risk_level'],
                        risk_score=risk['risk_score'],
                        days_until_lapse=risk['days_until_lapse'],
                        model_version="1.0",
                        created_at=datetime.utcnow(),
                    )
                    db.add(lapse_pred)
                
                prediction_count += 1
                
            except Exception as e:
                logger.error(f"⚠️ Prediction failed for dept {dept.dept_id}: {str(e)}")
                continue
        
        db.commit()
        logger.info(f"✅ Predictions complete: {prediction_count} departments")
        return prediction_count
        
    except Exception as e:
        logger.error(f"❌ Prediction stage failed: {str(e)}")
        db.rollback()
        raise


def predict_department(db: Session, department_id: int) -> Optional[Dict]:
    """
    Generate lapse prediction for a single department
    
    Args:
        db: SQLAlchemy session
        department_id: Department ID
        
    Returns:
        Prediction result dictionary or None
    """
    try:
        from database.models import LaspePrediction
        from ml.lapse_prediction import LaspePredictor
        from datetime import datetime, timedelta
        
        logger.info(f"🔮 [STAGE 2] Predicting for department {department_id}...")
        
        predictor = LaspePredictor()
        fiscal_year_start = datetime(datetime.now().year, 1, 1)
        
        # Get prediction
        pred = predictor.predict(department_id)
        risk = predictor.get_risk_level(department_id)
        
        predicted_date = fiscal_year_start + timedelta(
            days=int(pred.get('predicted_lapse_day', 365))
        )
        
        # Update or create
        existing = db.query(LaspePrediction).filter(
            LaspePrediction.dept_id == department_id
        ).first()
        
        if existing:
            existing.r2_score = pred.get('r2_score', 0.0)
            existing.predicted_lapse_day = pred.get('predicted_lapse_day', 365)
            existing.predicted_lapse_date = predicted_date
            existing.risk_level = risk['risk_level']
            existing.risk_score = risk['risk_score']
            existing.days_until_lapse = risk['days_until_lapse']
            existing.updated_at = datetime.utcnow()
        else:
            lapse_pred = LaspePrediction(
                dept_id=department_id,
                r2_score=pred.get('r2_score', 0.0),
                predicted_lapse_day=pred.get('predicted_lapse_day', 365),
                predicted_lapse_date=predicted_date,
                risk_level=risk['risk_level'],
                risk_score=risk['risk_score'],
                days_until_lapse=risk['days_until_lapse'],
                model_version="1.0",
                created_at=datetime.utcnow(),
            )
            db.add(lapse_pred)
        
        db.commit()
        logger.info(f"✅ Prediction for dept {department_id}: {risk['risk_level']}")
        
        return {
            "dept_id": department_id,
            "risk_level": risk['risk_level'],
            "days_until_lapse": risk['days_until_lapse'],
            "r2_score": pred.get('r2_score'),
        }
        
    except Exception as e:
        logger.error(f"❌ Prediction failed for dept {department_id}: {str(e)}")
        db.rollback()
        raise


def generate_reallocation_suggestions(db: Session) -> int:
    """
    Stage 3: Generate budget reallocation suggestions
    
    Args:
        db: SQLAlchemy session
        
    Returns:
        Number of suggestions generated
    """
    try:
        from database.models import LaspePrediction, ReallocaitonSuggestion, Department, Transaction
        from datetime import datetime, timedelta
        from sqlalchemy import func
        
        logger.info("💰 [STAGE 3] Generating reallocation suggestions...")
        
        # Clear old pending suggestions (keep approved/rejected)
        db.query(ReallocaitonSuggestion).filter(
            ReallocaitonSuggestion.status == "pending"
        ).delete()
        db.commit()
        
        # Get all high-risk predictions
        predictions = db.query(LaspePrediction).filter(
            LaspePrediction.risk_level.in_(['high', 'critical'])
        ).all()
        
        suggestion_count = 0
        
        for pred in predictions:
            try:
                # Get department info
                dept = db.query(Department).filter(
                    Department.dept_id == pred.dept_id
                ).first()
                
                if not dept:
                    continue
                
                # Calculate potential reallocatable amount
                reallocatable = max(0, (pred.budget * 0.20)) if pred.budget else 0  # 20% of budget
                
                if reallocatable > 0:
                    # Find potential recipient departments in same district
                    recipients = db.query(Department).filter(
                        Department.dept_id != dept.dept_id,
                    ).limit(3).all()
                    
                    for recipient in recipients:
                        # Create suggestion
                        sugg = ReallocaitonSuggestion(
                            donor_dept_id=dept.dept_id,
                            recipient_dept_id=recipient.dept_id,
                            suggested_amount=reallocatable / len(recipients) if recipients else reallocatable,
                            reason=f"Transfer from {dept.name} (lapse risk: {pred.risk_level})",
                            status="pending",
                            priority="high",
                            created_at=datetime.utcnow(),
                        )
                        db.add(sugg)
                        suggestion_count += 1
                
            except Exception as e:
                logger.error(f"⚠️ Error creating suggestion for dept {pred.dept_id}: {str(e)}")
                continue
        
        db.commit()
        logger.info(f"✅ Reallocation suggestions complete: {suggestion_count} suggestions")
        return suggestion_count
        
    except Exception as e:
        logger.error(f"❌ Reallocation stage failed: {str(e)}")
        db.rollback()
        raise


# Export functions
__all__ = [
    "compute_all_anomalies",
    "compute_anomalies_for_department",
    "predict_all_departments",
    "predict_department",
    "generate_reallocation_suggestions",
]
