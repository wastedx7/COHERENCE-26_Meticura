"""
Service layer for lapse predictions
Handles loading from JSON files and saving to database
"""
import json
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import delete

from database.models import LaspePrediction, Department
from ml.lapse_prediction import LaspePredictor


class LaspePredictionService:
    """Service for lapse prediction operations"""
    
    @staticmethod
    def load_predictions_from_json(filepath: Path = None) -> list[dict]:
        """
        Load lapse predictions from JSON file
        
        Args:
            filepath: Path to lapse_predictions.json (auto-detected if None)
            
        Returns:
            List of prediction dictionaries
        """
        if filepath is None:
            filepath = Path(__file__).parent.parent / "ml" / "artifacts" / "lapse_predictions.json"
        
        if not filepath.exists():
            raise FileNotFoundError(f"Predictions file not found: {filepath}")
        
        with open(filepath, 'r') as f:
            predictions = json.load(f)
        
        return predictions
    
    
    @staticmethod
    def save_predictions_to_db(db: Session, fiscal_year_start: datetime = None) -> int:
        """
        Load lapse predictions from JSON and save to database
        
        Args:
            db: SQLAlchemy session
            fiscal_year_start: Start of fiscal year for risk calculations
            
        Returns:
            Number of predictions saved
        """
        if fiscal_year_start is None:
            fiscal_year_start = datetime(datetime.now().year, 1, 1)
        
        # Load predictions from JSON
        predictions = LaspePredictionService.load_predictions_from_json()
        predictor = LaspePredictor()
        
        # Clear existing predictions
        db.execute(delete(LaspePrediction))
        db.commit()
        print(f"Cleared {len(predictions)} existing predictions from database")
        
        # Save each prediction
        saved_count = 0
        for pred in predictions:
            dept_id = pred['department_id']
            
            # Check if department exists
            dept = db.query(Department).filter(Department.dept_id == dept_id).first()
            if not dept:
                # Create department if it doesn't exist
                dept = Department(
                    dept_id=dept_id,
                    name=f"Department {dept_id:03d}",
                    archetype="unknown"
                )
                db.add(dept)
                db.flush()
            
            # Get risk assessment
            risk = predictor.get_risk_level(dept_id)
            
            # Create lapse prediction record
            lapse_pred = LaspePrediction(
                dept_id=dept_id,
                slope=pred['slope'],
                intercept=pred['intercept'],
                r2_score=pred['r2_score'],
                predicted_lapse_day=pred['predicted_lapse_day'],
                historical_txns=pred.get('historical_txns'),
                total_spent=pred.get('total_spent'),
                budget=pred.get('budget'),
                spending_index=pred.get('spending_index'),
                risk_level=risk['risk_level'],
                risk_score=risk['risk_score'],
                days_until_lapse=risk['days_until_lapse'],
                predicted_lapse_date=fiscal_year_start + timedelta(days=pred['predicted_lapse_day'] - 1),
                model_version="1.0",
            )
            
            db.add(lapse_pred)
            saved_count += 1
            
            if saved_count % 100 == 0:
                print(f"   Saved {saved_count}/{len(predictions)} predictions...")
        
        db.commit()
        print(f"✅ Successfully saved {saved_count} lapse predictions to database")
        
        return saved_count
    
    
    @staticmethod
    def get_lapse_prediction(db: Session, dept_id: int) -> dict:
        """Retrieve lapse prediction from database"""
        pred = db.query(LaspePrediction).filter(LaspePrediction.dept_id == dept_id).first()
        
        if not pred:
            return None
        
        return {
            'dept_id': pred.dept_id,
            'slope': pred.slope,
            'intercept': pred.intercept,
            'r2_score': pred.r2_score,
            'predicted_lapse_day': pred.predicted_lapse_day,
            'predicted_lapse_date': pred.predicted_lapse_date.isoformat() if pred.predicted_lapse_date else None,
            'days_until_lapse': pred.days_until_lapse,
            'risk_level': pred.risk_level,
            'risk_score': pred.risk_score,
            'spending_index': pred.spending_index,
            'total_spent': pred.total_spent,
            'budget': pred.budget,
        }
    
    
    @staticmethod
    def get_all_lapse_predictions(db: Session, risk_level: str = None) -> list[dict]:
        """
        Retrieve all lapse predictions, optionally filtered by risk level
        
        Args:
            db: SQLAlchemy session
            risk_level: Optional filter (e.g., 'critical', 'high')
            
        Returns:
            List of prediction dictionaries
        """
        query = db.query(LaspePrediction)
        
        if risk_level:
            query = query.filter(LaspePrediction.risk_level == risk_level)
        
        predictions = query.all()
        
        return [
            {
                'dept_id': pred.dept_id,
                'risk_level': pred.risk_level,
                'risk_score': pred.risk_score,
                'days_until_lapse': pred.days_until_lapse,
                'predicted_lapse_date': pred.predicted_lapse_date.isoformat() if pred.predicted_lapse_date else None,
                'r2_score': pred.r2_score,
                'spending_index': pred.spending_index,
            }
            for pred in predictions
        ]
    
    
    @staticmethod
    def get_critical_budgets(db: Session, limit: int = 10) -> list[dict]:
        """
        Get departments with critical or high risk budgets
        
        Args:
            db: SQLAlchemy session
            limit: Maximum number to return
            
        Returns:
            List of critical budget predictions
        """
        predictions = db.query(LaspePrediction).filter(
            LaspePrediction.risk_level.in_(['critical', 'high'])
        ).order_by(
            LaspePrediction.risk_score.desc()
        ).limit(limit).all()
        
        return [
            {
                'dept_id': pred.dept_id,
                'risk_level': pred.risk_level,
                'risk_score': pred.risk_score,
                'days_until_lapse': pred.days_until_lapse,
                'predicted_lapse_date': pred.predicted_lapse_date.isoformat() if pred.predicted_lapse_date else None,
            }
            for pred in predictions
        ]
    
    
    @staticmethod
    def get_lapse_summary(db: Session) -> dict:
        """Get summary statistics of all lapse predictions"""
        preds = db.query(LaspePrediction).all()
        
        if not preds:
            return {'total': 0, 'by_risk_level': {}}
        
        risk_counts = {}
        for pred in preds:
            risk_level = pred.risk_level
            risk_counts[risk_level] = risk_counts.get(risk_level, 0) + 1
        
        avg_days = sum(p.days_until_lapse for p in preds if p.days_until_lapse) / len([p for p in preds if p.days_until_lapse])
        
        return {
            'total': len(preds),
            'by_risk_level': risk_counts,
            'avg_days_until_lapse': avg_days,
            'timestamp': datetime.utcnow().isoformat(),
        }


if __name__ == "__main__":
    # Test service
    from database import get_db_context
    
    print("Testing LaspePredictionService...")
    
    # Test loading from JSON
    preds = LaspePredictionService.load_predictions_from_json()
    print(f"✅ Loaded {len(preds)} predictions from JSON")
    
    # Test saving to DB
    with get_db_context() as db:
        count = LaspePredictionService.save_predictions_to_db(db)
        print(f"✅ Saved {count} predictions to database")
        
        # Test retrieval
        summary = LaspePredictionService.get_lapse_summary(db)
        print(f"\n📊 Lapse Prediction Summary:")
        print(f"   Total predictions: {summary['total']}")
        print(f"   By risk level: {summary['by_risk_level']}")
        print(f"   Avg days until lapse: {summary['avg_days_until_lapse']:.1f}")
        
        # Test critical budgets
        critical = LaspePredictionService.get_critical_budgets(db, limit=5)
        print(f"\n⚠️  Critical budgets (top 5):")
        for pred in critical:
            print(f"   Dept {pred['dept_id']}: {pred['risk_level']} ({pred['days_until_lapse']} days)")
