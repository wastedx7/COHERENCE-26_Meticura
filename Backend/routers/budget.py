"""
Budget Router
API endpoints for budget overview, analysis, and comparisons
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from typing import List, Optional

from database import get_db
from database.models import Department, BudgetAllocation, Transaction, LaspePrediction

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


# ============================================================================
# Helper Functions
# ============================================================================

async def get_department_budget_summary(db: Session, dept_id: int) -> Optional[BudgetSummary]:
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


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/health")
async def budget_health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "budget",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/overview")
async def get_budget_overview(db: Session = Depends(get_db)):
    """
    Get overview of all department budgets
    
    Response includes:
    - Total budget allocated
    - Total spending
    - Departments by status (on-track, at-risk, exceeded)
    - Average utilization
    """
    try:
        total_allocated = db.query(func.sum(BudgetAllocation.total_amount)).scalar() or 0.0
        total_spent = db.query(func.sum(Transaction.amount)).scalar() or 0.0
        
        by_status = {
            'on-track': 0,
            'at-risk': 0,
            'exceeded': 0
        }
        
        departments = db.query(Department).all()
        
        for dept in departments:
            summary = await get_department_budget_summary(db, dept.dept_id)
            if summary:
                by_status[summary.status] += 1
        
        avg_utilization = (total_spent / total_allocated * 100) if total_allocated > 0 else 0
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_allocated_budget": round(total_allocated, 2),
                "total_spent": round(total_spent, 2),
                "total_remaining": round(total_allocated - total_spent, 2),
                "average_utilization_percentage": round(avg_utilization, 2),
            },
            "departments_by_status": by_status,
            "total_departments": len(departments),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/department/{dept_id}")
async def get_department_budget(dept_id: int, db: Session = Depends(get_db)):
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
        summary = await get_department_budget_summary(db, dept_id)
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
async def get_departments_by_status(
    status: str = Path(..., description="Status: on-track, at-risk, or exceeded"),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
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
        
        departments = db.query(Department).all()
        result = []
        
        for dept in departments:
            summary = await get_department_budget_summary(db, dept.dept_id)
            if summary and summary.status == status:
                result.append(summary.to_dict())
        
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
async def get_top_utilization(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get departments with highest budget utilization
    
    Useful for identifying departments approaching or exceeding budget
    """
    try:
        departments = db.query(Department).all()
        summaries = []
        
        for dept in departments:
            summary = await get_department_budget_summary(db, dept.dept_id)
            if summary:
                summaries.append(summary)
        
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
async def compare_departments(
    dept_ids: List[int] = Query(..., description="Comma-separated list of department IDs"),
    db: Session = Depends(get_db)
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
        
        comparison = []
        
        for dept_id in dept_ids:
            summary = await get_department_budget_summary(db, dept_id)
            if summary:
                comparison.append(summary.to_dict())
        
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
async def budget_forecast(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
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
        
        forecast = []
        
        for pred in lapse_preds:
            summary = await get_department_budget_summary(db, pred.dept_id)
            
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
async def list_all_budgets(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, description="Filter by status: on-track, at-risk, exceeded"),
    db: Session = Depends(get_db)
):
    """
    List all department budgets with optional filtering
    
    Parameters:
    - limit: Number of results (default 50, max 500)
    - offset: Number of results to skip (for pagination)
    - status: Optional filter by status
    """
    try:
        departments = db.query(Department).all()
        all_budgets = []
        
        for dept in departments:
            summary = await get_department_budget_summary(db, dept.dept_id)
            if summary:
                if status is None or summary.status == status:
                    all_budgets.append(summary.to_dict())
        
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
