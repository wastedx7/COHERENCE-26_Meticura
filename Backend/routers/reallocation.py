"""
Budget Reallocation API Endpoints
Handles reallocation suggestions, approvals, and rejections
"""
import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from auth.dependencies import require_auth
from database import get_db
from database.models import ReallocaitonSuggestion, Department, BudgetAllocation, AllocationHistor
from logging_config import log_pipeline_stage

router = APIRouter(prefix="/reallocation", tags=["Reallocation"])
logger = logging.getLogger(__name__)


# =====================================================
# Pydantic Models for Request/Response
# =====================================================

from pydantic import BaseModel, Field


class ReallocaitonSuggestionBase(BaseModel):
    """Base reallocation suggestion data"""
    donor_dept_id: int
    recipient_dept_id: int
    suggested_amount: float
    priority: str = "medium"
    reason: str


class ReallocaitonSuggestionCreate(ReallocaitonSuggestionBase):
    """Create reallocation suggestion"""
    pass


class ReallocaitonSuggestionResponse(ReallocaitonSuggestionBase):
    """Reallocation suggestion response"""
    id: int
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReallocaitonApprovalRequest(BaseModel):
    """Request to approve reallocation"""
    notes: Optional[str] = None


class ReallocaitonRejectionRequest(BaseModel):
    """Request to reject reallocation"""
    reason: str


class ReallocaitonSummary(BaseModel):
    """Summary of reallocation status"""
    pending_count: int
    approved_count: int
    rejected_count: int
    executed_count: int
    total_amount_pending: float
    total_amount_approved: float


# =====================================================
# API Endpoints
# =====================================================

@router.get("/suggestions", response_model=List[ReallocaitonSuggestionResponse])
async def get_reallocation_suggestions(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected, executed"),
    priority: Optional[str] = Query(None, description="Filter by priority: low, medium, high, critical"),
    department_id: Optional[int] = Query(None, description="Filter by department (donor or recipient)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Get reallocation suggestions with optional filters
    
    Query Parameters:
    - status: pending, approved, rejected, executed
    - priority: low, medium, high, critical
    - department_id: Filter by donor or recipient department
    - skip: Number of records to skip (for pagination)
    - limit: Maximum records to return
    """
    try:
        query = db.query(ReallocaitonSuggestion)
        
        # Apply filters
        if status:
            query = query.filter(ReallocaitonSuggestion.status == status)
        
        if priority:
            query = query.filter(ReallocaitonSuggestion.priority == priority)
        
        if department_id:
            query = query.filter(
                (ReallocaitonSuggestion.donor_dept_id == department_id) |
                (ReallocaitonSuggestion.recipient_dept_id == department_id)
            )
        
        # Order by priority and creation date
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        query = query.order_by(
            ReallocaitonSuggestion.status == "pending",  # Pending first
            desc(ReallocaitonSuggestion.created_at)      # Newest first
        )
        
        # Pagination
        total = query.count()
        suggestions = query.offset(skip).limit(limit).all()
        
        logger.info(f"📋 Retrieved {len(suggestions)} reallocation suggestions", extra={
            "filters": {"status": status, "priority": priority, "department_id": department_id},
            "pagination": {"skip": skip, "limit": limit, "total": total}
        })
        
        return suggestions
        
    except Exception as e:
        logger.error(f"❌ Error retrieving suggestions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve suggestions")


@router.get("/suggestion/{suggestion_id}", response_model=ReallocaitonSuggestionResponse)
async def get_reallocation_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Get a single reallocation suggestion by ID
    """
    try:
        suggestion = db.query(ReallocaitonSuggestion).filter(
            ReallocaitonSuggestion.id == suggestion_id
        ).first()
        
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        logger.info(f"📋 Retrieved suggestion {suggestion_id}")
        return suggestion
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving suggestion {suggestion_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve suggestion")


@router.post("/suggestion/{suggestion_id}/approve", response_model=ReallocaitonSuggestionResponse)
async def approve_reallocation_suggestion(
    suggestion_id: int,
    request: ReallocaitonApprovalRequest,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Approve a reallocation suggestion
    
    This will:
    1. Update the suggestion status to 'approved'
    2. Record the approver (user)
    3. Queue execution task
    """
    try:
        suggestion = db.query(ReallocaitonSuggestion).filter(
            ReallocaitonSuggestion.id == suggestion_id
        ).first()
        
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        if suggestion.status != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve a {suggestion.status} suggestion"
            )
        
        # Update suggestion
        suggestion.status = "approved"
        suggestion.approved_by = user_info.get("sub")  # Clerk user ID
        suggestion.approved_at = datetime.utcnow()
        suggestion.notes = request.notes
        
        # TODO: Queue execution task in Celery
        # execute_reallocation_async.delay(suggestion_id)
        
        db.commit()
        
        log_pipeline_stage(
            "reallocation_approval",
            "completed",
            {
                "suggestion_id": suggestion_id,
                "donor_dept_id": suggestion.donor_dept_id,
                "recipient_dept_id": suggestion.recipient_dept_id,
                "amount": suggestion.suggested_amount,
                "approved_by": user_info.get("email")
            }
        )
        
        logger.info(f"✅ Approved suggestion {suggestion_id}", extra={
            "suggestion_id": suggestion_id,
            "user": user_info.get("email")
        })
        
        return suggestion
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error approving suggestion {suggestion_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to approve suggestion")


@router.post("/suggestion/{suggestion_id}/reject", response_model=ReallocaitonSuggestionResponse)
async def reject_reallocation_suggestion(
    suggestion_id: int,
    request: ReallocaitonRejectionRequest,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Reject a reallocation suggestion
    
    This will:
    1. Update the suggestion status to 'rejected'
    2. Record the rejection reason
    3. Keep audit trail
    """
    try:
        suggestion = db.query(ReallocaitonSuggestion).filter(
            ReallocaitonSuggestion.id == suggestion_id
        ).first()
        
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        if suggestion.status != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reject a {suggestion.status} suggestion"
            )
        
        # Update suggestion
        suggestion.status = "rejected"
        suggestion.notes = request.reason
        
        db.commit()
        
        log_pipeline_stage(
            "reallocation_rejection",
            "completed",
            {
                "suggestion_id": suggestion_id,
                "reason": request.reason,
                "rejected_by": user_info.get("email")
            }
        )
        
        logger.info(f"❌ Rejected suggestion {suggestion_id}: {request.reason}", extra={
            "suggestion_id": suggestion_id,
            "user": user_info.get("email")
        })
        
        return suggestion
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error rejecting suggestion {suggestion_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to reject suggestion")


@router.post("/suggestion/{suggestion_id}/execute", response_model=ReallocaitonSuggestionResponse)
async def execute_reallocation(
    suggestion_id: int,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Execute (transfer) a reallocation between departments
    
    Only works if suggestion is approved.
    """
    try:
        suggestion = db.query(ReallocaitonSuggestion).filter(
            ReallocaitonSuggestion.id == suggestion_id
        ).first()
        
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        if suggestion.status != "approved":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot execute a {suggestion.status} suggestion (must be approved)"
            )
        
        # Get departments
        donor = db.query(Department).filter(
            Department.dept_id == suggestion.donor_dept_id
        ).first()
        recipient = db.query(Department).filter(
            Department.dept_id == suggestion.recipient_dept_id
        ).first()
        
        if not donor or not recipient:
            raise HTTPException(status_code=404, detail="Department not found")
        
        # Get current allocations
        donor_alloc = db.query(BudgetAllocation).filter(
            BudgetAllocation.dept_id == suggestion.donor_dept_id
        ).order_by(desc(BudgetAllocation.fiscal_year)).first()
        
        recipient_alloc = db.query(BudgetAllocation).filter(
            BudgetAllocation.dept_id == suggestion.recipient_dept_id
        ).order_by(desc(BudgetAllocation.fiscal_year)).first()
        
        # Perform transfer
        if donor_alloc and recipient_alloc:
            new_donor_amount = donor_alloc.total_amount - suggestion.suggested_amount
            new_recipient_amount = recipient_alloc.total_amount + suggestion.suggested_amount
            
            # Update allocations
            donor_alloc.total_amount = new_donor_amount
            recipient_alloc.total_amount = new_recipient_amount
            
            # Record in history
            donor_history = AllocationHistor(
                dept_id=suggestion.donor_dept_id,
                fiscal_year=donor_alloc.fiscal_year,
                old_amount=donor_alloc.total_amount + suggestion.suggested_amount,
                new_amount=new_donor_amount,
                change_reason=f"Reallocation to {recipient.name}",
                changed_by=user_info.get("email")
            )
            
            recipient_history = AllocationHistor(
                dept_id=suggestion.recipient_dept_id,
                fiscal_year=recipient_alloc.fiscal_year,
                old_amount=recipient_alloc.total_amount,
                new_amount=new_recipient_amount,
                change_reason=f"Reallocation from {donor.name}",
                changed_by=user_info.get("email")
            )
            
            db.add(donor_history)
            db.add(recipient_history)
        
        # Mark suggestion as executed
        suggestion.status = "executed"
        suggestion.executed_at = datetime.utcnow()
        
        db.commit()
        
        log_pipeline_stage(
            "reallocation_execution",
            "completed",
            {
                "suggestion_id": suggestion_id,
                "amount": suggestion.suggested_amount,
                "from": donor.name if donor else "Unknown",
                "to": recipient.name if recipient else "Unknown"
            }
        )
        
        logger.info(f"💰 Executed reallocation {suggestion_id}", extra={
            "suggestion_id": suggestion_id,
            "amount": suggestion.suggested_amount,
            "donor": suggestion.donor_dept_id,
            "recipient": suggestion.recipient_dept_id
        })
        
        return suggestion
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error executing reallocation {suggestion_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to execute reallocation")


@router.get("/summary", response_model=ReallocaitonSummary)
async def get_reallocation_summary(
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Get summary statistics of reallocation suggestions
    """
    try:
        all_suggestions = db.query(ReallocaitonSuggestion).all()
        
        pending = [s for s in all_suggestions if s.status == "pending"]
        approved = [s for s in all_suggestions if s.status == "approved"]
        rejected = [s for s in all_suggestions if s.status == "rejected"]
        executed = [s for s in all_suggestions if s.status == "executed"]
        
        summary = ReallocaitonSummary(
            pending_count=len(pending),
            approved_count=len(approved),
            rejected_count=len(rejected),
            executed_count=len(executed),
            total_amount_pending=sum(s.suggested_amount for s in pending),
            total_amount_approved=sum(s.suggested_amount for s in approved)
        )
        
        logger.info(f"📊 Retrieved reallocation summary", extra={
            "summary": {
                "pending": summary.pending_count,
                "approved": summary.approved_count,
                "rejected": summary.rejected_count,
                "executed": summary.executed_count
            }
        })
        
        return summary
        
    except Exception as e:
        logger.error(f"❌ Error getting reallocation summary: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get summary")
