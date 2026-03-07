"""
Budget Router
API endpoints for budget overview, analysis, and comparisons
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from auth import require_auth, AuthenticatedUser
from database import get_db
from database.models import Department, BudgetAllocation, Transaction, LaspePrediction
from services.cache import ttl_cache, invalidate as cache_invalidate

router = APIRouter(prefix="/budget", tags=["budget"])


# ============================================================================
# Data Models
# ============================================================================

class BudgetSummary:
    """Budget summary for a department"""
    def __init__(self, dept_id: int, dept_name: str, allocated: float, spent: float, 
                 remaining: float, utilization_pct: float, status: str):
        self.department_id = dept_id
        self.department_name = dept_name
        self.allocated_budget = allocated
        self.spent_amount = spent
        self.remaining_budget = remaining
        self.utilization_percentage = utilization_pct
        self.status = status  # on-track, at-risk, exceeded
        
    def to_dict(self):
        return {
            'department_id': self.department_id,
            'department_name': self.department_name,
            'allocated_budget': self.allocated_budget,
            'spent_amount': self.spent_amount,
            'remaining_budget': self.remaining_budget,
            'utilization_percentage': round(self.utilization_percentage, 2),
            'status': self.status,
        }


class TransactionCreateRequest(BaseModel):
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    transaction_date: Optional[datetime] = None


# ============================================================================
# Helper Functions
# ============================================================================

def get_department_budget_summary(db: Session, dept_id: int) -> Optional[BudgetSummary]:
    """Get budget summary for a single department"""
    # Get department
    dept = db.query(Department).filter(Department.dept_id == dept_id).first()
    if not dept:
        return None
    
    # Get latest budget allocation
    alloc = db.query(BudgetAllocation).filter(
        BudgetAllocation.dept_id == dept_id
    ).order_by(desc(BudgetAllocation.fiscal_year)).first()
    
    allocated = alloc.total_amount if alloc else 0.0
    
    # Calculate spending
    spent = db.query(func.sum(Transaction.amount)).filter(
        Transaction.dept_id == dept_id
    ).scalar() or 0.0
    
    remaining = allocated - spent
    utilization_pct = (spent / allocated * 100) if allocated > 0 else 0
    
    # Determine status
    if utilization_pct > 100:
        status = 'exceeded'
    elif utilization_pct > 90:
        status = 'at-risk'
    else:
        status = 'on-track'
    
    return BudgetSummary(
        dept_id=dept_id,
        dept_name=dept.name,
        allocated=allocated,
        spent=spent,
        remaining=remaining,
        utilization_pct=utilization_pct,
        status=status
    )


def get_all_budget_summaries(db: Session) -> List[BudgetSummary]:
    """
    Get budget summaries for ALL departments in a single efficient query.
    Uses subquery JOINs instead of N+1 per-department queries.
    """
    # Subquery: latest fiscal year per department
    latest_year_sq = db.query(
        BudgetAllocation.dept_id.label("dept_id"),
        func.max(BudgetAllocation.fiscal_year).label("max_year")
    ).group_by(BudgetAllocation.dept_id).subquery()

    # Subquery: latest allocation amount per department
    latest_alloc_sq = db.query(
        BudgetAllocation.dept_id.label("dept_id"),
        BudgetAllocation.total_amount.label("allocated")
    ).join(
        latest_year_sq,
        and_(
            BudgetAllocation.dept_id == latest_year_sq.c.dept_id,
            BudgetAllocation.fiscal_year == latest_year_sq.c.max_year,
        )
    ).subquery()

    # Subquery: total spending per department
    spent_sq = db.query(
        Transaction.dept_id.label("dept_id"),
        func.sum(Transaction.amount).label("spent")
    ).group_by(Transaction.dept_id).subquery()

    # Main query: departments LEFT JOIN allocations LEFT JOIN spending
    rows = db.query(
        Department.dept_id,
        Department.name,
        func.coalesce(latest_alloc_sq.c.allocated, 0.0).label("allocated"),
        func.coalesce(spent_sq.c.spent, 0.0).label("spent"),
    ).outerjoin(
        latest_alloc_sq,
        latest_alloc_sq.c.dept_id == Department.dept_id,
    ).outerjoin(
        spent_sq,
        spent_sq.c.dept_id == Department.dept_id,
    ).all()

    summaries = []
    for row in rows:
        allocated = float(row.allocated or 0)
        spent = float(row.spent or 0)
        remaining = allocated - spent
        utilization_pct = (spent / allocated * 100) if allocated > 0 else 0

        if utilization_pct > 100:
            status = 'exceeded'
        elif utilization_pct > 90:
            status = 'at-risk'
        else:
            status = 'on-track'

        summaries.append(BudgetSummary(
            dept_id=row.dept_id,
            dept_name=row.name,
            allocated=allocated,
            spent=spent,
            remaining=remaining,
            utilization_pct=utilization_pct,
            status=status,
        ))

    return summaries


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/health")
def budget_health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "budget",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/overview")
def get_budget_overview(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """
    Get overview of all department budgets
    
    Response includes:
    - Total budget allocated
    - Total spending
    - Departments by status (on-track, at-risk, exceeded)
    - Average utilization
    """
    try:
        latest_alloc_year_sq = db.query(
            BudgetAllocation.dept_id.label("dept_id"),
            func.max(BudgetAllocation.fiscal_year).label("max_year")
        ).group_by(BudgetAllocation.dept_id).subquery()

        latest_alloc_sq = db.query(
            BudgetAllocation.dept_id.label("dept_id"),
            BudgetAllocation.total_amount.label("allocated")
        ).join(
            latest_alloc_year_sq,
            and_(
                BudgetAllocation.dept_id == latest_alloc_year_sq.c.dept_id,
                BudgetAllocation.fiscal_year == latest_alloc_year_sq.c.max_year,
            )
        ).subquery()

        spent_sq = db.query(
            Transaction.dept_id.label("dept_id"),
            func.sum(Transaction.amount).label("spent")
        ).group_by(Transaction.dept_id).subquery()

        dept_budget_rows = db.query(
            Department.dept_id,
            func.coalesce(latest_alloc_sq.c.allocated, 0.0).label("allocated"),
            func.coalesce(spent_sq.c.spent, 0.0).label("spent"),
        ).outerjoin(
            latest_alloc_sq,
            latest_alloc_sq.c.dept_id == Department.dept_id,
        ).outerjoin(
            spent_sq,
            spent_sq.c.dept_id == Department.dept_id,
        ).all()

        total_allocated = 0.0
        total_spent = 0.0
        by_status = {
            'on-track': 0,
            'at-risk': 0,
            'exceeded': 0
        }

        for row in dept_budget_rows:
            allocated = float(row.allocated or 0.0)
            spent = float(row.spent or 0.0)
            total_allocated += allocated
            total_spent += spent

            utilization_pct = (spent / allocated * 100) if allocated > 0 else 0
            if utilization_pct > 100:
                by_status['exceeded'] += 1
            elif utilization_pct > 90:
                by_status['at-risk'] += 1
            else:
                by_status['on-track'] += 1
        
        avg_utilization = (total_spent / total_allocated * 100) if total_allocated > 0 else 0

        response = {
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_allocated_budget": round(total_allocated, 2),
                "total_spent": round(total_spent, 2),
                "total_remaining": round(total_allocated - total_spent, 2),
                "average_utilization_percentage": round(avg_utilization, 2),
            },
            "departments_by_status": by_status,
            "total_departments": len(dept_budget_rows),
        }

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/department/{dept_id}")
def get_department_budget(
    dept_id: int,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """
    Get detailed budget info for a specific department
    
    Returns:
    - Allocated budget
    - Spent amount
    - Remaining budget
    - Utilization percentage
    - Status (on-track/at-risk/exceeded)
    - Transaction breakdown by category
    """
    try:
        summary = get_department_budget_summary(db, dept_id)
        if not summary:
            raise HTTPException(status_code=404, detail=f"Department {dept_id} not found")
        
        # Category breakdown
        category_spending = db.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total'),
            func.count(Transaction.id).label('count')
        ).filter(Transaction.dept_id == dept_id).group_by(Transaction.category).all()
        
        category_breakdown = [
            {
                'category': cat,
                'amount': round(total, 2),
                'transaction_count': count,
                'percentage': round(total / summary.spent_amount * 100, 2) if summary.spent_amount > 0 else 0
            }
            for cat, total, count in category_spending
        ]
        
        return {
            **summary.to_dict(),
            'category_breakdown': category_breakdown,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-status/{status}")
def get_departments_by_status(
    status: str = Path(..., description="Status: on-track, at-risk, or exceeded"),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """
    Get all departments with a specific budget status
    
    Status options:
    - on-track: utilization < 90%
    - at-risk: utilization 90-100%
    - exceeded: utilization > 100%
    """
    try:
        valid_statuses = ['on-track', 'at-risk', 'exceeded']
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        all_summaries = get_all_budget_summaries(db)
        result = [s.to_dict() for s in all_summaries if s.status == status]
        
        # Sort by utilization (descending)
        result = sorted(result, key=lambda x: x['utilization_percentage'], reverse=True)
        
        return {
            'status': status,
            'total_count': len(result),
            'departments': result[:limit]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-utilization")
def get_top_utilization(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """
    Get departments with highest budget utilization
    
    Useful for identifying departments approaching or exceeding budget
    """
    try:
        summaries = get_all_budget_summaries(db)
        
        # Sort by utilization (highest first)
        summaries = sorted(summaries, key=lambda x: x.utilization_percentage, reverse=True)
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'total_departments': len(summaries),
            'top_utilization': [s.to_dict() for s in summaries[:limit]]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/comparison")
def compare_departments(
    dept_ids: List[int] = Query(..., description="Comma-separated list of department IDs"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """
    Compare budgets across multiple departments
    
    Useful for benchmarking and identifying outliers
    
    Query param example: ?dept_ids=1&dept_ids=2&dept_ids=3
    """
    try:
        if not dept_ids:
            raise HTTPException(status_code=400, detail="At least one dept_id is required")
        
        if len(dept_ids) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 departments for comparison")
        
        # Batch-fetch all summaries and filter by requested IDs
        all_summaries = get_all_budget_summaries(db)
        summary_map = {s.department_id: s for s in all_summaries}
        comparison = [
            summary_map[did].to_dict()
            for did in dept_ids if did in summary_map
        ]
        
        # Calculate statistics
        if comparison:
            utilization_values = [d['utilization_percentage'] for d in comparison]
            allocated_values = [d['allocated_budget'] for d in comparison]
            
            stats = {
                'average_utilization': round(sum(utilization_values) / len(utilization_values), 2),
                'max_utilization': round(max(utilization_values), 2),
                'min_utilization': round(min(utilization_values), 2),
                'average_budget': round(sum(allocated_values) / len(allocated_values), 2),
                'total_allocated': round(sum(allocated_values), 2),
            }
        else:
            stats = {}
        
        return {
            'comparison_count': len(comparison),
            'statistics': stats,
            'departments': comparison
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast")
def budget_forecast(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """
    Get budget forecast based on lapse predictions
    
    Shows which departments are likely to lapse (underspend) their budget
    combined with utilization status
    """
    try:
        # Get lapse predictions
        lapse_preds = db.query(LaspePrediction).order_by(
            desc(LaspePrediction.risk_score)
        ).limit(limit).all()
        
        # Batch-fetch all budget summaries for efficient lookup
        all_summaries = get_all_budget_summaries(db)
        summary_map = {s.department_id: s for s in all_summaries}
        
        forecast = []
        
        for pred in lapse_preds:
            summary = summary_map.get(pred.dept_id)
            
            if summary:
                forecast.append({
                    **summary.to_dict(),
                    'lapse_risk': {
                        'risk_level': pred.risk_level,
                        'risk_score': round(pred.risk_score, 2),
                        'predicted_lapse_date': pred.predicted_lapse_date.isoformat() if pred.predicted_lapse_date else None,
                        'days_until_lapse': pred.days_until_lapse,
                    }
                })
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'forecast_count': len(forecast),
            'forecast': forecast
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def list_all_budgets(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, description="Filter by status: on-track, at-risk, exceeded"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """
    List all department budgets with optional filtering
    
    Parameters:
    - limit: Number of results (default 50, max 500)
    - offset: Number of results to skip (for pagination)
    - status: Optional filter by status
    """
    try:
        all_summaries = get_all_budget_summaries(db)
        all_budgets = [
            s.to_dict() for s in all_summaries
            if status is None or s.status == status
        ]
        
        # Sort by utilization (descending)
        all_budgets = sorted(all_budgets, key=lambda x: x['utilization_percentage'], reverse=True)
        
        # Apply pagination
        total = len(all_budgets)
        paginated = all_budgets[offset:offset + limit]
        
        return {
            'total_count': total,
            'returned_count': len(paginated),
            'limit': limit,
            'offset': offset,
            'budgets': paginated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/departments/{dept_id}/transactions")
def list_department_transactions(
    dept_id: int,
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """List recent transactions for a department, newest first."""
    dept = db.query(Department).filter(Department.dept_id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail=f"Department {dept_id} not found")
    txns = (
        db.query(Transaction)
        .filter(Transaction.dept_id == dept_id)
        .order_by(Transaction.date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "department_id": dept_id,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "category": t.category,
                "description": t.description,
                "date": t.date.isoformat() if t.date else None,
            }
            for t in txns
        ],
    }


@router.post("/departments/{dept_id}/transactions")
def create_department_transaction(
    dept_id: int,
    payload: TransactionCreateRequest,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_auth),
):
    """Create a transaction row for a department and trigger single-department ML pipeline."""
    dept = db.query(Department).filter(Department.dept_id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail=f"Department {dept_id} not found")

    txn_date = payload.transaction_date or datetime.utcnow()
    txn = Transaction(
        dept_id=dept_id,
        amount=float(payload.amount),
        date=txn_date,
        category=payload.category,
        description=payload.description,
        created_at=datetime.utcnow(),
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    # Invalidate budget caches so next read picks up the new transaction
    cache_invalidate("get_budget_overview")
    cache_invalidate("get_department_budget_summary")

    trigger_status = "skipped"
    try:
        from celery_app import run_single_department_pipeline

        run_single_department_pipeline.delay(dept_id)
        trigger_status = "queued"
    except Exception:
        # Fallback to direct compute when Celery worker is not available.
        from services.pipeline_service import compute_anomalies_for_department

        compute_anomalies_for_department(db, dept_id)
        trigger_status = "executed_inline"

    return {
        "success": True,
        "transaction_id": txn.id,
        "department_id": dept_id,
        "amount": txn.amount,
        "pipeline_trigger": trigger_status,
    }
