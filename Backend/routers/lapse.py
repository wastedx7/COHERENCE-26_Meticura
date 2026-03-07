"""
Lapse Prediction API Routes
Endpoints for budget depletion forecasts and risk assessment
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_auth, AuthenticatedUser
from database import get_db
from services.lapse_service import LaspePredictionService


router = APIRouter(
    prefix="/lapse",
    tags=["Lapse Predictions"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not found"},
    }
)


@router.get("/health")
def lapse_health():
    """Health check for lapse prediction service"""
    return {
        "status": "healthy",
        "service": "lapse-prediction",
        "version": "1.0.0"
    }


@router.get("/department/{dept_id}")
def get_department_lapse_prediction(
    dept_id: int,
    user: AuthenticatedUser = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Get lapse prediction for a specific department
    
    **Requires Authentication**
    
    Returns:
    - Predicted lapse date (when budget will deplete)
    - Days until lapse
    - Risk level and score
    - Model confidence (R² score)
    - Spending index
    """
    pred = LaspePredictionService.get_lapse_prediction(db, dept_id)
    
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No lapse prediction found for department {dept_id}"
        )
    
    return {
        "success": True,
        "department_id": dept_id,
        "prediction": pred,
    }


@router.get("/summary")
def get_lapse_summary(
    user: AuthenticatedUser = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Get summary statistics of all lapse predictions
    
    **Requires Authentication**
    
    Returns:
    - Total number of departments
    - Distribution by risk level
    - Average days until lapse
    """
    summary = LaspePredictionService.get_lapse_summary(db)
    
    return {
        "success": True,
        "summary": summary,
    }


@router.get("/critical")
def get_critical_budgets(
    limit: int = 10,
    user: AuthenticatedUser = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Get departments with critical or high-risk budgets
    
    **Requires Authentication**
    
    Returns:
    - List of high-risk departments sorted by risk score
    - Limited to top 'limit' results
    """
    critical = LaspePredictionService.get_critical_budgets(db, limit=limit)
    
    if not critical:
        return {
            "success": True,
            "count": 0,
            "message": "No critical budgets detected",
            "data": []
        }
    
    return {
        "success": True,
        "count": len(critical),
        "data": critical,
    }


@router.get("/by-risk-level/{risk_level}")
def get_by_risk_level(
    risk_level: str,
    user: AuthenticatedUser = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Get all departments with a specific risk level
    
    **Requires Authentication**
    
    **Risk Levels**: low, medium, high, critical, depleted
    
    Returns:
    - List of departments matching the risk level
    """
    valid_levels = ['low', 'medium', 'high', 'critical', 'depleted']
    if risk_level not in valid_levels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid risk level. Must be one of: {', '.join(valid_levels)}"
        )
    
    preds = LaspePredictionService.get_all_lapse_predictions(db, risk_level=risk_level)
    
    return {
        "success": True,
        "risk_level": risk_level,
        "count": len(preds),
        "data": preds,
    }


@router.get("/")
def list_all_lapse_predictions(
    user: AuthenticatedUser = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    List all lapse predictions
    
    **Requires Authentication**
    
    Returns:
    - Complete list of all department predictions
    - Sorted by risk score (highest first)
    """
    preds = LaspePredictionService.get_all_lapse_predictions(db)
    
    # Sort by risk score (highest first)
    preds_sorted = sorted(preds, key=lambda x: x['risk_score'], reverse=True)
    
    return {
        "success": True,
        "count": len(preds_sorted),
        "data": preds_sorted,
    }
