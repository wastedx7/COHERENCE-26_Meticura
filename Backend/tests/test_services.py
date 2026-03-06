"""
Unit Tests for backend services
Tests for anomaly detection, lapse prediction, and pipeline services
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from database.models import Base, Department, BudgetAllocation, Transaction, LaspePrediction, Anomaly
from services.anomaly_service import AnomalyService
from services.pipeline_service import (
    compute_all_anomalies,
    compute_anomalies_for_department,
    predict_all_departments,
    predict_department,
    generate_reallocation_suggestions
)


# =====================================================
# Database Setup for Testing
# =====================================================

@pytest.fixture
def test_db():
    """Create an in-memory SQLite database for testing"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_departments(test_db):
    """Create sample departments for testing"""
    departments = [
        Department(dept_id=1, name="Health Department", archetype="healthy"),
        Department(dept_id=2, name="Education Department", archetype="slow_spender"),
        Department(dept_id=3, name="Transport Department", archetype="year_end_dumper"),
        Department(dept_id=4, name="Housing Department", archetype="burst_spender"),
    ]
    
    for dept in departments:
        test_db.add(dept)
    
    test_db.commit()
    return departments


@pytest.fixture
def sample_budgets(test_db, sample_departments):
    """Create sample budget allocations for testing"""
    allocations = [
        BudgetAllocation(
            dept_id=1,
            fiscal_year=2026,
            total_amount=1000000.0,
        ),
        BudgetAllocation(
            dept_id=2,
            fiscal_year=2026,
            total_amount=2000000.0,
        ),
        BudgetAllocation(
            dept_id=3,
            fiscal_year=2026,
            total_amount=1500000.0,
        ),
        BudgetAllocation(
            dept_id=4,
            fiscal_year=2026,
            total_amount=800000.0,
        ),
    ]
    
    for alloc in allocations:
        test_db.add(alloc)
    
    test_db.commit()
    return allocations


@pytest.fixture
def sample_transactions(test_db, sample_departments):
    """Create sample transactions for testing"""
    transactions = [
        Transaction(dept_id=1, amount=5000.0, date=datetime.now() - timedelta(days=10)),
        Transaction(dept_id=1, amount=3000.0, date=datetime.now() - timedelta(days=5)),
        Transaction(dept_id=2, amount=10000.0, date=datetime.now() - timedelta(days=20)),
        Transaction(dept_id=3, amount=50000.0, date=datetime.now() - timedelta(days=2)),
    ]
    
    for txn in transactions:
        test_db.add(txn)
    
    test_db.commit()
    return transactions


# =====================================================
# Anomaly Service Tests
# =====================================================

class TestAnomalyService:
    """Test cases for AnomalyService"""
    
    def test_service_initialization(self):
        """Test AnomalyService initializes correctly"""
        service = AnomalyService()
        assert service is not None
        assert hasattr(service, 'rule_engine')
    
    def test_detect_anomalies_basic(self):
        """Test basic anomaly detection"""
        service = AnomalyService()
        # This will test with auto-loaded data
        result = service.detect_anomalies(1)
        
        assert result is not None
        assert hasattr(result, 'department_id')
        assert result.department_id == 1
        assert hasattr(result, 'combined_verdict')
    
    def test_batch_detect(self):
        """Test batch anomaly detection"""
        service = AnomalyService()
        # Mock with a small list of department IDs
        with patch('services.anomaly_service.Path') as mock_path:
            results = service.batch_detect(dept_ids=[1, 2, 3])
            assert isinstance(results, list)
    
    def test_get_critical_anomalies(self):
        """Test retrieving critical anomalies"""
        service = AnomalyService()
        critical = service.get_critical_anomalies(limit=10)
        
        assert isinstance(critical, list)
        assert len(critical) <= 10
    
    def test_get_summary_statistics(self):
        """Test getting summary statistics"""
        service = AnomalyService()
        summary = service.get_summary_statistics()
        
        assert summary is not None
        assert 'total_departments' in summary
        assert 'by_verdict' in summary
        assert 'critical_count' in summary


# =====================================================
# Pipeline Service Tests
# =====================================================

class TestPipelineService:
    """Test cases for pipeline services"""
    
    def test_compute_all_anomalies(self, test_db, sample_departments, sample_budgets, sample_transactions):
        """Test computing anomalies for all departments"""
        with patch('services.pipeline_service.AnomalyService'):
            result = compute_all_anomalies(test_db)
            assert isinstance(result, int)
            assert result >= 0
    
    def test_compute_anomalies_for_department(self, test_db, sample_departments):
        """Test computing anomalies for a specific department"""
        with patch('services.pipeline_service.AnomalyService'):
            result = compute_anomalies_for_department(test_db, 1)
            assert result is None or isinstance(result, dict)
    
    def test_predict_all_departments(self, test_db, sample_departments, sample_budgets):
        """Test predicting lapse for all departments"""
        with patch('services.pipeline_service.LaspePredictor'):
            result = predict_all_departments(test_db)
            assert isinstance(result, int)
            assert result >= 0
    
    def test_predict_department(self, test_db, sample_departments):
        """Test predicting lapse for a single department"""
        with patch('services.pipeline_service.LaspePredictor'):
            result = predict_department(test_db, 1)
            assert result is None or isinstance(result, dict)
    
    def test_generate_reallocation_suggestions(self, test_db, sample_departments, sample_budgets):
        """Test generating reallocation suggestions"""
        # First create some lapse predictions
        predictions = [
            LaspePrediction(
                dept_id=1,
                r2_score=0.85,
                predicted_lapse_day=200,
                predicted_lapse_date=datetime.now() + timedelta(days=200),
                risk_level='high',
                risk_score=75,
                days_until_lapse=200,
                model_version='1.0'
            ),
        ]
        
        for pred in predictions:
            test_db.add(pred)
        
        test_db.commit()
        
        result = generate_reallocation_suggestions(test_db)
        assert isinstance(result, int)


# =====================================================
# Integration Tests
# =====================================================

class TestIntegration:
    """Integration tests combining multiple services"""
    
    def test_full_pipeline_flow(self, test_db, sample_departments, sample_budgets, sample_transactions):
        """Test complete pipeline execution"""
        with patch('services.pipeline_service.AnomalyService'), \
             patch('services.pipeline_service.LaspePredictor'):
            
            # Stage 1: Anomalies
            anomaly_count = compute_all_anomalies(test_db)
            assert anomaly_count >= 0
            
            # Stage 2: Predictions
            pred_count = predict_all_departments(test_db)
            assert pred_count >= 0
            
            # Stage 3: Reallocation
            sugg_count = generate_reallocation_suggestions(test_db)
            assert sugg_count >= 0
    
    def test_error_handling_invalid_department(self, test_db):
        """Test error handling for invalid department"""
        # This should handle gracefully
        result = compute_anomalies_for_department(test_db, 9999)
        # Should return None or handle gracefully
        assert result is None or isinstance(result, dict)


# =====================================================
# Smoke Tests
# =====================================================

class TestSmokeTests:
    """Quick smoke tests to verify basic functionality"""
    
    def test_anomaly_service_exists(self):
        """Smoke test: AnomalyService can be instantiated"""
        service = AnomalyService()
        assert service is not None
    
    def test_pipeline_functions_importable(self):
        """Smoke test: Pipeline functions can be imported"""
        from services.pipeline_service import (
            compute_all_anomalies,
            compute_anomalies_for_department,
            predict_all_departments,
            predict_department,
            generate_reallocation_suggestions
        )
        
        assert compute_all_anomalies is not None
        assert compute_anomalies_for_department is not None
        assert predict_all_departments is not None
        assert predict_department is not None
        assert generate_reallocation_suggestions is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
