"""
Rule Engine for Budget Anomaly Detection
Implements deterministic fraud/anomaly detection rules
"""
import pandas as pd
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Tuple
from pathlib import Path


@dataclass
class Rule:
    """Rule definition"""
    name: str
    description: str
    severity: str  # low, medium, high, critical
    enabled: bool = True
    

@dataclass
class RuleViolation:
    """Rule violation result"""
    department_id: int
    rule_name: str
    rule_description: str
    severity: str
    score: float  # 0-1
    reason: str
    details: dict


class RuleEngine:
    """Deterministic fraud detection rule engine"""
    
    def __init__(self):
        """Initialize rule engine"""
        self.rules = self._initialize_rules()
    
    
    def _initialize_rules(self) -> dict:
        """Define all fraud detection rules"""
        return {
            'year_end_dumping': Rule(
                name='Year-End Budget Dumping',
                description='Spending > 80% of budget in last 30 days (indicates rapid depletion)',
                severity='high'
            ),
            'lapse_risk': Rule(
                name='Budget Lapse Risk',
                description='Zero spending for 45+ days indicates potential budget lapse',
                severity='medium'
            ),
            'over_commitment': Rule(
                name='Over-Commitment',
                description='Total spending exceeds allocated budget by >5%',
                severity='high'
            ),
            'velocity_spike': Rule(
                name='Spending Velocity Spike',
                description='Daily spending rate increased >150% compared to historical average',
                severity='medium'
            ),
            'micro_transaction_abuse': Rule(
                name='Micro-Transaction Abuse',
                description='Average transaction < ₹10,000 (potential splitting to hide amounts)',
                severity='low'
            ),
            'single_large_transaction': Rule(
                name='Large Single Transaction',
                description='Single transaction > 30% of total budget allocated',
                severity='medium'
            ),
            'zero_allocation_spending': Rule(
                name='Zero Allocation Spending',
                description='Spending detected with zero or negative budget allocation',
                severity='critical'
            ),
            'category_anomaly': Rule(
                name='Category Concentration',
                description='>90% of spending in single category (potential misclassification)',
                severity='low'
            ),
        }
    
    
    def evaluate_all_rules(
        self,
        dept_id: int,
        transactions_df: pd.DataFrame,
        allocated_budget: float,
        fiscal_year_start: datetime = None
    ) -> List[RuleViolation]:
        """
        Evaluate all rules for a department
        
        Args:
            dept_id: Department ID
            transactions_df: DataFrame with 'date', 'amount', 'category' columns
            allocated_budget: Total budget for fiscal year
            fiscal_year_start: Start of fiscal year (default: Jan 1 current year)
            
        Returns:
            List of rule violations
        """
        if fiscal_year_start is None:
            fiscal_year_start = datetime(datetime.now().year, 1, 1)
        
        violations = []
        
        # Filter transactions for this department
        if len(transactions_df) == 0:
            return violations
        
        # Evaluate each rule
        violation = self._check_year_end_dumping(dept_id, transactions_df, allocated_budget, fiscal_year_start)
        if violation:
            violations.append(violation)
        
        violation = self._check_lapse_risk(dept_id, transactions_df)
        if violation:
            violations.append(violation)
        
        violation = self._check_over_commitment(dept_id, transactions_df, allocated_budget)
        if violation:
            violations.append(violation)
        
        violation = self._check_velocity_spike(dept_id, transactions_df)
        if violation:
            violations.append(violation)
        
        violation = self._check_micro_transaction_abuse(dept_id, transactions_df)
        if violation:
            violations.append(violation)
        
        violation = self._check_single_large_transaction(dept_id, transactions_df, allocated_budget)
        if violation:
            violations.append(violation)
        
        violation = self._check_zero_allocation_spending(dept_id, transactions_df, allocated_budget)
        if violation:
            violations.append(violation)
        
        violation = self._check_category_anomaly(dept_id, transactions_df)
        if violation:
            violations.append(violation)
        
        return violations
    
    
    def _check_year_end_dumping(
        self,
        dept_id: int,
        txns: pd.DataFrame,
        allocated_budget: float,
        fiscal_year_start: datetime
    ) -> RuleViolation:
        """Rule: Spending > 80% in last 30 days"""
        rule = self.rules['year_end_dumping']
        
        if len(txns) == 0:
            return None
        
        # Get last 30 days
        cutoff_date = datetime.now() - timedelta(days=30)
        last_30_days = txns[txns['date'] >= cutoff_date]
        
        if len(last_30_days) == 0:
            return None
        
        # Calculate spending in last 30 days
        spend_last_30 = last_30_days['amount'].sum()
        total_spend = txns['amount'].sum()
        
        # Percentage of total spending in last 30 days
        pct_last_30 = (spend_last_30 / total_spend * 100) if total_spend > 0 else 0
        
        # Threshold: > 80% spending in last 30 days
        if pct_last_30 > 80 and total_spend > allocated_budget * 0.1:  # At least 10% of budget
            score = min(1.0, pct_last_30 / 100)
            return RuleViolation(
                department_id=dept_id,
                rule_name=rule.name,
                rule_description=rule.description,
                severity=rule.severity,
                score=score,
                reason=f"Department spent {pct_last_30:.1f}% of budget in last 30 days (threshold: 80%)",
                details={
                    'spend_last_30_days': float(spend_last_30),
                    'total_spend': float(total_spend),
                    'pct_last_30': float(pct_last_30),
                    'txn_count_last_30': len(last_30_days),
                }
            )
        
        return None
    
    
    def _check_lapse_risk(self, dept_id: int, txns: pd.DataFrame) -> RuleViolation:
        """Rule: Zero spending for 45+ days"""
        rule = self.rules['lapse_risk']
        
        if len(txns) == 0:
            return None
        
        # Get latest transaction date
        latest_txn_date = txns['date'].max()
        days_since_txn = (datetime.now() - latest_txn_date).days
        
        # Threshold: 45 days without spending
        if days_since_txn > 45:
            score = min(1.0, days_since_txn / 365)  # Normalize to 365 days
            return RuleViolation(
                department_id=dept_id,
                rule_name=rule.name,
                rule_description=rule.description,
                severity=rule.severity,
                score=score,
                reason=f"No spending for {days_since_txn} days (threshold: 45 days)",
                details={
                    'days_since_txn': days_since_txn,
                    'latest_txn_date': latest_txn_date.isoformat(),
                }
            )
        
        return None
    
    
    def _check_over_commitment(
        self,
        dept_id: int,
        txns: pd.DataFrame,
        allocated_budget: float
    ) -> RuleViolation:
        """Rule: Spending > 105% of allocated budget"""
        rule = self.rules['over_commitment']
        
        if len(txns) == 0 or allocated_budget <= 0:
            return None
        
        total_spend = txns['amount'].sum()
        pct_of_budget = (total_spend / allocated_budget * 100) if allocated_budget > 0 else 0
        
        # Threshold: > 105% of budget
        if pct_of_budget > 105:
            score = min(1.0, (pct_of_budget - 100) / 100)  # Normalize excess over 100%
            return RuleViolation(
                department_id=dept_id,
                rule_name=rule.name,
                rule_description=rule.description,
                severity=rule.severity,
                score=score,
                reason=f"Department spent {pct_of_budget:.1f}% of allocated budget (threshold: 105%)",
                details={
                    'total_spent': float(total_spend),
                    'allocated_budget': float(allocated_budget),
                    'pct_of_budget': float(pct_of_budget),
                    'overage': float(total_spend - allocated_budget),
                }
            )
        
        return None
    
    
    def _check_velocity_spike(self, dept_id: int, txns: pd.DataFrame) -> RuleViolation:
        """Rule: Daily spending rate increased >150%"""
        rule = self.rules['velocity_spike']
        
        if len(txns) < 2:
            return None
        
        # Calculate daily spend velocities
        txns_sorted = txns.sort_values('date').copy()
        txns_sorted['date_diff'] = txns_sorted['date'].diff().dt.days.fillna(1)
        txns_sorted['daily_velocity'] = txns_sorted['amount'] / txns_sorted['date_diff'].replace(0, 1)
        
        # Compare recent velocity with historical
        mid_point = len(txns_sorted) // 2
        historical_velocity = txns_sorted.iloc[:mid_point]['daily_velocity'].mean()
        recent_velocity = txns_sorted.iloc[mid_point:]['daily_velocity'].mean()
        
        if historical_velocity <= 0:
            return None
        
        velocity_increase = ((recent_velocity - historical_velocity) / historical_velocity * 100)
        
        # Threshold: >150% increase
        if velocity_increase > 150:
            score = min(1.0, velocity_increase / 300)
            return RuleViolation(
                department_id=dept_id,
                rule_name=rule.name,
                rule_description=rule.description,
                severity=rule.severity,
                score=score,
                reason=f"Spending velocity increased {velocity_increase:.1f}% (threshold: 150%)",
                details={
                    'historical_daily_velocity': float(historical_velocity),
                    'recent_daily_velocity': float(recent_velocity),
                    'velocity_increase_pct': float(velocity_increase),
                }
            )
        
        return None
    
    
    def _check_micro_transaction_abuse(self, dept_id: int, txns: pd.DataFrame) -> RuleViolation:
        """Rule: Average transaction < ₹10,000 (transaction splitting)"""
        rule = self.rules['micro_transaction_abuse']
        
        if len(txns) < 5:  # Need enough transactions
            return None
        
        avg_transaction = txns['amount'].mean()
        min_threshold = 10000  # ₹10,000
        
        # Threshold: < ₹10,000 average
        if avg_transaction < min_threshold:
            score = min(1.0, (min_threshold - avg_transaction) / min_threshold)
            return RuleViolation(
                department_id=dept_id,
                rule_name=rule.name,
                rule_description=rule.description,
                severity=rule.severity,
                score=score,
                reason=f"Average transaction ₹{avg_transaction:,.0f} below threshold ₹{min_threshold:,}",
                details={
                    'avg_transaction': float(avg_transaction),
                    'min_threshold': float(min_threshold),
                    'txn_count': len(txns),
                    'total_amount': float(txns['amount'].sum()),
                }
            )
        
        return None
    
    
    def _check_single_large_transaction(
        self,
        dept_id: int,
        txns: pd.DataFrame,
        allocated_budget: float
    ) -> RuleViolation:
        """Rule: Single transaction > 30% of budget"""
        rule = self.rules['single_large_transaction']
        
        if len(txns) == 0 or allocated_budget <= 0:
            return None
        
        max_transaction = txns['amount'].max()
        pct_of_budget = (max_transaction / allocated_budget * 100)
        
        # Threshold: > 30% of budget in one transaction
        if pct_of_budget > 30:
            score = min(1.0, pct_of_budget / 100)
            return RuleViolation(
                department_id=dept_id,
                rule_name=rule.name,
                rule_description=rule.description,
                severity=rule.severity,
                score=score,
                reason=f"Single transaction ₹{max_transaction:,.0f} is {pct_of_budget:.1f}% of budget (threshold: 30%)",
                details={
                    'max_transaction': float(max_transaction),
                    'allocated_budget': float(allocated_budget),
                    'pct_of_budget': float(pct_of_budget),
                }
            )
        
        return None
    
    
    def _check_zero_allocation_spending(
        self,
        dept_id: int,
        txns: pd.DataFrame,
        allocated_budget: float
    ) -> RuleViolation:
        """Rule: Spending with zero or negative budget"""
        rule = self.rules['zero_allocation_spending']
        
        if len(txns) > 0 and allocated_budget <= 0:
            total_spend = txns['amount'].sum()
            score = 1.0  # Critical violation
            return RuleViolation(
                department_id=dept_id,
                rule_name=rule.name,
                rule_description=rule.description,
                severity=rule.severity,
                score=score,
                reason=f"Spending ₹{total_spend:,.0f} detected with zero/negative budget allocation",
                details={
                    'total_spent': float(total_spend),
                    'allocated_budget': float(allocated_budget),
                    'txn_count': len(txns),
                }
            )
        
        return None
    
    
    def _check_category_anomaly(self, dept_id: int, txns: pd.DataFrame) -> RuleViolation:
        """Rule: >90% of spending in single category"""
        rule = self.rules['category_anomaly']
        
        if len(txns) == 0 or 'category' not in txns.columns:
            return None
        
        # Get category distribution
        total_spend = txns['amount'].sum()
        if total_spend <= 0:
            return None
        
        category_spend = txns.groupby('category')['amount'].sum()
        max_category_spend = category_spend.max()
        max_category_pct = (max_category_spend / total_spend * 100)
        max_category_name = category_spend.idxmax()
        
        # Threshold: > 90% in one category
        if max_category_pct > 90:
            score = min(1.0, max_category_pct / 100)
            return RuleViolation(
                department_id=dept_id,
                rule_name=rule.name,
                rule_description=rule.description,
                severity=rule.severity,
                score=score,
                reason=f"{max_category_pct:.1f}% of spending in '{max_category_name}' category (threshold: 90%)",
                details={
                    'dominant_category': max_category_name,
                    'dominant_category_pct': float(max_category_pct),
                    'category_distribution': category_spend.to_dict(),
                }
            )
        
        return None
    
    
    def get_rule_statistics(self) -> dict:
        """Get statistics about rules"""
        return {
            'total_rules': len(self.rules),
            'enabled_rules': sum(1 for r in self.rules.values() if r.enabled),
            'rules': {
                name: {
                    'description': rule.description,
                    'severity': rule.severity,
                    'enabled': rule.enabled,
                }
                for name, rule in self.rules.items()
            }
        }


def load_and_evaluate_rules(dept_id: int) -> List[RuleViolation]:
    """
    Convenience function: Load transactions and evaluate all rules for a department
    
    Args:
        dept_id: Department ID
        
    Returns:
        List of rule violations
    """
    from pathlib import Path
    
    # Load transactions
    txn_path = Path(__file__).parent / "output" / "transactions.csv"
    alloc_path = Path(__file__).parent / "output" / "budget_allocations.csv"
    
    if not txn_path.exists():
        raise FileNotFoundError(f"Transactions CSV not found: {txn_path}")
    
    txns_df = pd.read_csv(txn_path)
    allocs_df = pd.read_csv(alloc_path)
    
    # Filter to this department
    dept_txns = txns_df[txns_df['dept_id'] == dept_id].copy()
    dept_txns['date'] = pd.to_datetime(dept_txns['date'])
    
    # Get budget
    latest_alloc = allocs_df[allocs_df['dept_id'] == dept_id].sort_values('fiscal_year').iloc[-1]
    budget = latest_alloc['total_amount']
    
    # Evaluate
    engine = RuleEngine()
    violations = engine.evaluate_all_rules(dept_id, dept_txns, budget)
    
    return violations


if __name__ == "__main__":
    # Test rule engine
    import sys
    
    engine = RuleEngine()
    print("🎯 Rule Engine Initialized")
    print()
    print("Available Rules:")
    for name, rule in engine.rules.items():
        print(f"  - {rule.name} ({rule.severity})")
        print(f"    {rule.description}")
    
    # Test with a sample department
    print("\n" + "=" * 60)
    print("Testing with Department 1...")
    print("=" * 60)
    
    try:
        violations = load_and_evaluate_rules(dept_id=1)
        
        if violations:
            print(f"\n🚨 Found {len(violations)} rule violations:")
            for v in violations:
                print(f"\n  Rule: {v.rule_name} ({v.severity})")
                print(f"  Score: {v.score:.2f}")
                print(f"  Reason: {v.reason}")
        else:
            print("\n✅ No rule violations detected")
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)
