"""
Anomaly Service
Merges Isolation Forest ML model with Rule Engine for comprehensive anomaly detection
"""
import sys
from pathlib import Path
import pandas as pd
from datetime import datetime
from typing import List, Dict, Tuple
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.rules import RuleEngine, RuleViolation


class AnomalyResult:
    """Combined anomaly detection result"""
    
    def __init__(self, dept_id: int):
        self.department_id = dept_id
        self.ml_flagged = False
        self.ml_score = 0.0
        self.ml_confidence = 0.0
        
        self.rule_violations: List[RuleViolation] = []
        self.rule_flagged = False
        
        self.combined_score = 0.0
        self.combined_verdict = 'normal'  # normal, warning, alert, critical
        
        self.timestamp = datetime.utcnow().isoformat()
    
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'department_id': self.department_id,
            'timestamp': self.timestamp,
            'ml_detection': {
                'flagged': self.ml_flagged,
                'score': self.ml_score,
                'confidence': self.ml_confidence,
            },
            'rule_detection': {
                'flagged': self.rule_flagged,
                'violation_count': len(self.rule_violations),
                'violations': [
                    {
                        'rule_name': v.rule_name,
                        'severity': v.severity,
                        'score': v.score,
                        'reason': v.reason,
                    }
                    for v in self.rule_violations
                ]
            },
            'combined': {
                'score': self.combined_score,
                'verdict': self.combined_verdict,
            }
        }


class AnomalyService:
    """Combined ML + Rule-based anomaly detection"""
    
    def __init__(self):
        """Initialize service"""
        self.rule_engine = RuleEngine()
    
    
    def detect_anomalies(
        self,
        dept_id: int,
        transactions_df: pd.DataFrame = None,
        allocated_budget: float = None,
        isolation_forest_score: float = None,
        fiscal_year_start: datetime = None
    ) -> AnomalyResult:
        """
        Detect anomalies using both ML and rules
        
        Args:
            dept_id: Department ID
            transactions_df: Transaction data (auto-loaded if None)
            allocated_budget: Total budget (auto-loaded if None)
            isolation_forest_score: Pre-computed ML score (auto-computed if None)
            fiscal_year_start: Fiscal year start date
            
        Returns:
            Combined anomaly detection result
        """
        if fiscal_year_start is None:
            fiscal_year_start = datetime(datetime.now().year, 1, 1)
        
        result = AnomalyResult(dept_id)
        
        # Load data if not provided
        if transactions_df is None or allocated_budget is None:
            transactions_df, allocated_budget = self._load_department_data(dept_id)
        
        if len(transactions_df) == 0:
            return result  # No transactions = no anomaly
        
        # 1. ML Detection (Isolation Forest)
        if isolation_forest_score is not None:
            result.ml_score = isolation_forest_score
            result.ml_flagged = isolation_forest_score < -0.5  # Tune this threshold
            result.ml_confidence = min(1.0, abs(isolation_forest_score))
        else:
            # Would call model.predict() here
            # For now, return placeholder
            result.ml_score = 0.0
            result.ml_confidence = 0.0
        
        # 2. Rule-Based Detection
        violations = self.rule_engine.evaluate_all_rules(
            dept_id,
            transactions_df,
            allocated_budget,
            fiscal_year_start
        )
        
        result.rule_violations = violations
        result.rule_flagged = len(violations) > 0
        
        # 3. Combine results
        self._combine_detections(result)
        
        return result
    
    
    def _load_department_data(self, dept_id: int) -> Tuple[pd.DataFrame, float]:
        """Load transactions and budget for a department"""
        # Path to ml directory (parent of services)
        base_dir = Path(__file__).parent.parent
        ml_dir = base_dir / "ml"
        
        # Load transactions
        txn_path = ml_dir / "output" / "transactions.csv"
        if not txn_path.exists():
            return pd.DataFrame(), 0.0
        
        txns = pd.read_csv(txn_path)
        txns = txns[txns['dept_id'] == dept_id].copy()
        txns['date'] = pd.to_datetime(txns['date'])
        
        # Load budget
        alloc_path = ml_dir / "output" / "budget_allocations.csv"
        if not alloc_path.exists():
            return txns, 0.0
        
        allocs = pd.read_csv(alloc_path)
        dept_alloc = allocs[allocs['dept_id'] == dept_id].sort_values('fiscal_year')
        
        budget = dept_alloc['total_amount'].iloc[-1] if len(dept_alloc) > 0 else 0.0
        
        return txns, budget
    
    
    def _combine_detections(self, result: AnomalyResult) -> None:
        """Combine ML and rule results into single verdict"""
        
        # Calculate combined score (0-1)
        # Weighted combination: 60% ML, 40% Rules
        ml_weight = 0.60
        rule_weight = 0.40
        
        ml_contribution = result.ml_score if result.ml_flagged else 0.0
        
        # Rule contribution: average severity of violations
        if result.rule_violations:
            severity_scores = {
                'low': 0.25,
                'medium': 0.5,
                'high': 0.75,
                'critical': 1.0,
            }
            rule_scores = [
                severity_scores.get(v.severity, 0.5) * v.score
                for v in result.rule_violations
            ]
            rule_contribution = sum(rule_scores) / len(rule_scores) if rule_scores else 0.0
        else:
            rule_contribution = 0.0
        
        result.combined_score = (
            ml_weight * ml_contribution +
            rule_weight * rule_contribution
        )
        
        # Determine verdict based on combined score and flags
        if result.rule_flagged and any(v.severity == 'critical' for v in result.rule_violations):
            result.combined_verdict = 'critical'
        elif result.rule_flagged and any(v.severity == 'high' for v in result.rule_violations):
            result.combined_verdict = 'alert'
        elif result.ml_flagged and result.combined_score > 0.6:
            result.combined_verdict = 'alert'
        elif result.rule_flagged:
            result.combined_verdict = 'warning'
        else:
            result.combined_verdict = 'normal'
    
    
    def batch_detect(
        self,
        dept_ids: List[int] = None,
        min_severity: str = None
    ) -> List[AnomalyResult]:
        """
        Detect anomalies for multiple departments
        
        Args:
            dept_ids: List of departments (auto-detect all if None)
            min_severity: Minimum severity to report (low, medium, high, critical)
            
        Returns:
            List of anomaly results
        """
        # Auto-detect all departments
        if dept_ids is None:
            base_dir = Path(__file__).parent.parent
            ml_dir = base_dir / "ml"
            txn_path = ml_dir / "output" / "transactions.csv"
            if txn_path.exists():
                txns = pd.read_csv(txn_path)
                dept_ids = sorted(txns['dept_id'].unique().tolist())
            else:
                return []
        
        results = []
        severity_order = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
        min_sev_value = severity_order.get(min_severity, -1) if min_severity else -1
        
        for dept_id in dept_ids:
            result = self.detect_anomalies(dept_id)
            
            # Filter by severity if specified
            if min_severity and result.rule_violations:
                filtered = [
                    v for v in result.rule_violations
                    if severity_order.get(v.severity, 0) >= min_sev_value
                ]
                if filtered or result.ml_flagged:
                    results.append(result)
            elif result.ml_flagged or result.rule_flagged:
                results.append(result)
        
        return results
    
    
    def get_critical_anomalies(self, limit: int = 20) -> List[Dict]:
        """Get top N critical anomalies"""
        results = self.batch_detect(min_severity='high')
        
        # Sort by combined score
        results = sorted(results, key=lambda r: r.combined_score, reverse=True)
        
        return [r.to_dict() for r in results[:limit]]
    
    
    def get_summary_statistics(self) -> dict:
        """Get summary stats across all anomalies"""
        results = self.batch_detect()
        
        total = len(results)
        by_verdict = {}
        by_severity = {}
        
        for result in results:
            # Count by verdict
            verdict = result.combined_verdict
            by_verdict[verdict] = by_verdict.get(verdict, 0) + 1
            
            # Count by rule severity
            for violation in result.rule_violations:
                sev = violation.severity
                by_severity[sev] = by_severity.get(sev, 0) + 1
        
        return {
            'total_departments': total,
            'by_verdict': by_verdict,
            'by_severity': by_severity,
            'critical_count': by_verdict.get('critical', 0),
            'alert_count': by_verdict.get('alert', 0),
            'timestamp': datetime.utcnow().isoformat(),
        }


if __name__ == "__main__":
    print("🔍 Anomaly Service Test")
    print("=" * 60)
    
    service = AnomalyService()
    
    # Test single department
    print("\nTesting Department 1...")
    result = service.detect_anomalies(dept_id=1)
    print(f"  ML Flagged: {result.ml_flagged}")
    print(f"  Rule Flagged: {result.rule_flagged}")
    print(f"  Combined Verdict: {result.combined_verdict}")
    print(f"  Combined Score: {result.combined_score:.2f}")
    
    if result.rule_violations:
        print(f"  Violations ({len(result.rule_violations)}):")
        for v in result.rule_violations:
            print(f"    - {v.rule_name} ({v.severity}): {v.reason}")
    
    # Test batch
    print("\n" + "=" * 60)
    print("Testing batch detection (top 10 alert/critical)...")
    critical = service.get_critical_anomalies(limit=10)
    print(f"Found {len(critical)} critical/alert anomalies")
    
    for result_dict in critical[:3]:
        print(f"\n  Dept {result_dict['department_id']}: {result_dict['combined']['verdict']}")
        print(f"    Score: {result_dict['combined']['score']:.2f}")
        print(f"    Violations: {result_dict['rule_detection']['violation_count']}")
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary Statistics:")
    stats = service.get_summary_statistics()
    print(f"  Total departments: {stats['total_departments']}")
    print(f"  By verdict: {stats['by_verdict']}")
    print(f"  By severity: {stats['by_severity']}")
