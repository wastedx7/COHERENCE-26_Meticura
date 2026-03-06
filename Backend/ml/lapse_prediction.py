import json
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression


class LaspePredictor:
    """Predict when a department's budget will be depleted (lapse point)"""
    
    def __init__(self, predictions_file='lapse_predictions.json'):
        """
        Initialize lapse predictor with saved predictions
        
        Args:
            predictions_file: Path to lapse_predictions.json from training
        """
        artifacts_dir = Path(__file__).parent / "artifacts"
        predictions_path = artifacts_dir / predictions_file
        
        if not predictions_path.exists():
            raise FileNotFoundError(f"Predictions file not found: {predictions_path}")
        
        with open(predictions_path, 'r') as f:
            self.predictions = json.load(f)
        
        # Create lookup by department_id
        self.pred_lookup = {p['department_id']: p for p in self.predictions}
        
        print(f"Loaded lapse predictions for {len(self.predictions)} departments")
    
    
    def get_lapse_prediction(self, department_id):
        """
        Get lapse prediction for a specific department
        
        Args:
            department_id: Department identifier
            
        Returns:
            dict with prediction details or None if not found
        """
        return self.pred_lookup.get(department_id)
    
    
    def predict_lapse_date(self, department_id, fiscal_year_start=None):
        """
        Predict the date when department budget will be depleted
        
        Args:
            department_id: Department identifier
            fiscal_year_start: Start date of fiscal year (default: Jan 1 of current year)
            
        Returns:
            dict with predicted lapse date and days until lapse
        """
        if fiscal_year_start is None:
            fiscal_year_start = datetime(datetime.now().year, 1, 1)
        
        pred = self.get_lapse_prediction(department_id)
        if pred is None:
            return None
        
        lapse_day = pred['predicted_lapse_day']
        lapse_date = fiscal_year_start + timedelta(days=lapse_day - 1)
        days_until_lapse = (lapse_date - datetime.now()).days
        
        return {
            'department_id': department_id,
            'lapse_day_of_year': lapse_day,
            'predicted_lapse_date': lapse_date.isoformat(),
            'days_until_lapse': days_until_lapse,
            'status': 'depleted' if days_until_lapse < 0 else 'active',
            'confidence': 'high' if pred['r2_score'] > 0.8 else 'medium' if pred['r2_score'] > 0.5 else 'low',
            'r2_score': pred['r2_score'],
            'slope': pred['slope'],
        }
    
    
    def predict_spend_at_day(self, department_id, day_of_year):
        """
        Predict spending percentage at a specific day of year
        
        Args:
            department_id: Department identifier
            day_of_year: Day number in fiscal year (1-365)
            
        Returns:
            dict with predicted spend percentage
        """
        pred = self.get_lapse_prediction(department_id)
        if pred is None:
            return None
        
        # Linear regression: spend_pct = slope * day + intercept
        spend_pct = pred['slope'] * day_of_year + pred['intercept']
        spend_pct = min(100, max(0, spend_pct))  # Clip to [0, 100]
        
        return {
            'department_id': department_id,
            'day_of_year': day_of_year,
            'predicted_spend_pct': float(spend_pct),
            'confidence': 'high' if pred['r2_score'] > 0.8 else 'medium' if pred['r2_score'] > 0.5 else 'low',
        }
    
    
    def get_risk_level(self, department_id):
        """
        Calculate budget depletion risk level
        
        Args:
            department_id: Department identifier
            
        Returns:
            dict with risk assessment
        """
        pred = self.get_lapse_prediction(department_id)
        if pred is None:
            return None
        
        lapse_pred = self.predict_lapse_date(department_id)
        days_until_lapse = lapse_pred['days_until_lapse']
        
        # Risk levels
        if days_until_lapse < 0:
            risk = 'depleted'
            risk_score = 100
        elif days_until_lapse < 30:
            risk = 'critical'
            risk_score = 95
        elif days_until_lapse < 90:
            risk = 'high'
            risk_score = 70
        elif days_until_lapse < 180:
            risk = 'medium'
            risk_score = 40
        else:
            risk = 'low'
            risk_score = 10
        
        return {
            'department_id': department_id,
            'risk_level': risk,
            'risk_score': risk_score,
            'days_until_lapse': days_until_lapse,
            'spending_index': pred['spending_index'],
            'model_confidence': pred['r2_score'],
            'slope': pred['slope'],
        }
    
    
    def batch_predict_lapse_dates(self, department_ids=None, fiscal_year_start=None):
        
        if department_ids is None:
            department_ids = list(self.pred_lookup.keys())
        
        predictions = []
        for dept_id in department_ids:
            pred = self.predict_lapse_date(dept_id, fiscal_year_start)
            if pred:
                predictions.append(pred)
        
        return predictions
    
    
    def batch_risk_assessment(self, department_ids=None):
        
        if department_ids is None:
            department_ids = list(self.pred_lookup.keys())
        
        assessments = []
        for dept_id in department_ids:
            risk = self.get_risk_level(dept_id)
            if risk:
                assessments.append(risk)
        
        return assessments
    
    
    def summary_statistics(self):
        
        lapse_days = [p['predicted_lapse_day'] for p in self.predictions]
        r2_scores = [p['r2_score'] for p in self.predictions]
        slopes = [p['slope'] for p in self.predictions]
        spending_indices = [p['spending_index'] for p in self.predictions]
        
        return {
            'total_departments': len(self.predictions),
            'lapse_day_stats': {
                'mean': float(np.mean(lapse_days)),
                'median': float(np.median(lapse_days)),
                'min': int(np.min(lapse_days)),
                'max': int(np.max(lapse_days)),
                'std': float(np.std(lapse_days)),
            },
            'r2_score_stats': {
                'mean': float(np.mean(r2_scores)),
                'median': float(np.median(r2_scores)),
                'min': float(np.min(r2_scores)),
                'max': float(np.max(r2_scores)),
                'std': float(np.std(r2_scores)),
            },
            'slope_stats': {
                'mean': float(np.mean(slopes)),
                'median': float(np.median(slopes)),
                'min': float(np.min(slopes)),
                'max': float(np.max(slopes)),
                'std': float(np.std(slopes)),
            },
            'spending_index_stats': {
                'mean': float(np.mean(spending_indices)),
                'median': float(np.median(spending_indices)),
                'min': float(np.min(spending_indices)),
                'max': float(np.max(spending_indices)),
                'std': float(np.std(spending_indices)),
            },
        }


if __name__ == "__main__":
    # Example usage
    predictor = LaspePredictor()
    
    # Get summary stats
    print("\n Summary Statistics:")
    stats = predictor.summary_statistics()
    print(f"   Total departments: {stats['total_departments']}")
    print(f"   Average lapse day: {stats['lapse_day_stats']['mean']:.1f}")
    print(f"   Average R² score: {stats['r2_score_stats']['mean']:.4f}")
    
    # Get lapse prediction for first department
    sample_dept = int(list(predictor.pred_lookup.keys())[0])
    print(f"\n Sample Prediction (Department {sample_dept}):")
    lapse = predictor.predict_lapse_date(sample_dept)
    print(f"   Predicted lapse date: {lapse['predicted_lapse_date']}")
    print(f"   Days until lapse: {lapse['days_until_lapse']}")
    print(f"   Confidence: {lapse['confidence']}")
    
    # Get risk assessment
    print(f"\n Risk Assessment (Department {sample_dept}):")
    risk = predictor.get_risk_level(sample_dept)
    print(f"   Risk level: {risk['risk_level']}")
    print(f"   Risk score: {risk['risk_score']}")
    print(f"   Days until lapse: {risk['days_until_lapse']}")
