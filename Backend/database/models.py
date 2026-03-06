"""
SQLAlchemy ORM Models for Budget Watchdog
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Department(Base):
    """Department entity"""
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True)
    dept_id = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    archetype = Column(String(50))  # healthy, slow_spender, year_end_dumper, burst_spender
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    allocations = relationship("BudgetAllocation", back_populates="department")
    transactions = relationship("Transaction", back_populates="department")
    lapse_predictions = relationship("LaspePrediction", back_populates="department", uselist=False)
    anomalies = relationship("Anomaly", back_populates="department")
    
    __table_args__ = (
        Index('idx_dept_id', 'dept_id'),
    )


class BudgetAllocation(Base):
    """Budget allocation for a department in a fiscal year"""
    __tablename__ = "budget_allocations"
    
    id = Column(Integer, primary_key=True)
    dept_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=False, index=True)
    fiscal_year = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="allocations")
    
    __table_args__ = (
        Index('idx_dept_fiscal', 'dept_id', 'fiscal_year'),
    )


class Transaction(Base):
    """Budget transaction"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    dept_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False, index=True)
    category = Column(String(100))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="transactions")
    
    __table_args__ = (
        Index('idx_dept_date', 'dept_id', 'date'),
    )


class LaspePrediction(Base):
    """Lapse prediction (budget depletion forecast) for a department"""
    __tablename__ = "lapse_predictions"
    
    id = Column(Integer, primary_key=True)
    dept_id = Column(Integer, ForeignKey("departments.dept_id"), unique=True, nullable=False, index=True)
    slope = Column(Float, nullable=False)  # Daily spend rate (% per day)
    intercept = Column(Float, nullable=False)
    r2_score = Column(Float, nullable=False)  # Model confidence (0-1)
    predicted_lapse_day = Column(Integer, nullable=False)  # Day of year when budget depletes
    historical_txns = Column(Integer)  # Number of transactions used for training
    total_spent = Column(Float)  # Amount already spent
    budget = Column(Float)  # Total allocated budget
    spending_index = Column(Float)  # Percentage of budget spent
    risk_level = Column(String(50))  # low, medium, high, critical, depleted
    risk_score = Column(Integer)  # 0-100 risk score
    days_until_lapse = Column(Integer)  # Days from today until budget depletes
    predicted_lapse_date = Column(DateTime)  # Predicted date of budget depletion
    model_version = Column(String(50), default="1.0")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="lapse_predictions")
    
    __table_args__ = (
        Index('idx_risk_level', 'risk_level'),
        Index('idx_risk_score', 'risk_score'),
    )


class Anomaly(Base):
    """Detected anomaly from Isolation Forest model"""
    __tablename__ = "anomalies"
    
    id = Column(Integer, primary_key=True)
    dept_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=False, index=True)
    anomaly_type = Column(String(50), nullable=False)  # ml, rule-based, combined
    anomaly_score = Column(Float)  # -1 to 1 (isolation forest score)
    is_anomaly = Column(Boolean, default=True)  # True if flagged as anomalous
    confidence = Column(Float)  # 0-1 confidence level
    reason = Column(Text)  # Human-readable description
    spend_velocity = Column(Float)  # Feature: ₹/day
    utilization_pct = Column(Float)  # Feature: % of budget used
    days_since_last_txn = Column(Integer)  # Feature: inactivity
    end_period_spike_ratio = Column(Float)  # Feature: year-end dumping
    status = Column(String(50), default="open")  # open, reviewed, resolved, false_positive
    reviewed_by = Column(String(255))  # User who reviewed
    reviewed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="anomalies")
    
    __table_args__ = (
        Index('idx_dept_anomaly', 'dept_id', 'created_at'),
        Index('idx_anomaly_status', 'status'),
    )


class Prediction(Base):
    """General prediction/recommendation for a department"""
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True)
    dept_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=False, index=True)
    prediction_type = Column(String(50), nullable=False)  # lapse, anomaly, reallocation
    prediction_value = Column(String(255))  # Predicted value (e.g., risk level)
    confidence = Column(Float)  # 0-1 confidence
    recommendation = Column(Text)  # Recommended action
    metadata_json = Column(Text)  # JSON metadata (renamed from metadata to avoid SQLAlchemy conflict)
    model_version = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_dept_prediction', 'dept_id', 'created_at'),
    )


class AllocationHistor(Base):
    """Historical audit trail for budget allocation changes"""
    __tablename__ = "allocation_history"
    
    id = Column(Integer, primary_key=True)
    dept_id = Column(Integer, ForeignKey("departments.dept_id"), nullable=False, index=True)
    fiscal_year = Column(Integer, nullable=False)
    old_amount = Column(Float)
    new_amount = Column(Float, nullable=False)
    change_reason = Column(String(255))
    changed_by = Column(String(255))  # User ID from Clerk
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_dept_history', 'dept_id', 'fiscal_year'),
    )
