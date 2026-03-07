"""
Export API Routes
Endpoints for exporting data in CSV and PDF formats
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from auth.dependencies import require_auth
from database import get_db
from database.models import Anomaly, LaspePrediction, BudgetAllocation, Department
from services.export_service import ExportService
from logging_config import log_pipeline_stage

router = APIRouter(prefix="/export", tags=["Export"])
logger = logging.getLogger(__name__)

export_service = ExportService()

# Severity is derived from anomaly_score, not stored in the DB.
_SEVERITY_THRESHOLDS = [
    (0.75, 'critical'),
    (0.50, 'high'),
    (0.25, 'medium'),
]

def _score_to_severity(score: float | None) -> str:
    """Map an anomaly_score (0-1) to a severity label."""
    s = score or 0.0
    for threshold, label in _SEVERITY_THRESHOLDS:
        if s >= threshold:
            return label
    return 'low'

def _severity_score_range(severity: str):
    """Return (min_inclusive, max_exclusive) anomaly_score range for a severity label."""
    ranges = {
        'critical': (0.75, None),
        'high':     (0.50, 0.75),
        'medium':   (0.25, 0.50),
        'low':      (None, 0.25),
    }
    return ranges.get(severity, (None, None))


@router.get("/anomalies.csv")
def export_anomalies_csv(
    severity: str = Query(None, description="Filter by severity: low, medium, high, critical"),
    department_id: int = Query(None, description="Filter by department ID"),
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Export anomalies as CSV file
    
    **Requires Authentication**
    
    Query Parameters:
    - severity: Optional filter by severity level
    - department_id: Optional filter by department
    
    Returns:
    - CSV file download
    """
    try:
        query = db.query(Anomaly)
        
        if severity:
            lo, hi = _severity_score_range(severity)
            if lo is not None:
                query = query.filter(Anomaly.anomaly_score >= lo)
            if hi is not None:
                query = query.filter(Anomaly.anomaly_score < hi)
        
        if department_id:
            query = query.filter(Anomaly.dept_id == department_id)
        
        anomalies = query.order_by(desc(Anomaly.created_at)).limit(1000).all()
        
        # Convert to dictionaries (severity derived from anomaly_score)
        anomaly_dicts = [
            {
                "department_id": a.dept_id,
                "anomaly_type": a.anomaly_type,
                "severity": _score_to_severity(a.anomaly_score),
                "anomaly_score": a.anomaly_score,
                "confidence": a.confidence,
                "reason": a.reason,
                "status": a.status,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in anomalies
        ]
        
        # Export to CSV
        csv_content = export_service.export_anomalies_csv(anomaly_dicts)
        filename = export_service.get_filename("anomalies", "csv")
        
        log_pipeline_stage(
            "anomaly_export",
            "completed",
            {
                "format": "csv",
                "record_count": len(anomaly_dicts),
                "filters": {"severity": severity, "department_id": department_id}
            }
        )
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"❌ Error exporting anomalies CSV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export anomalies")


@router.get("/anomalies.pdf")
def export_anomalies_pdf(
    severity: str = Query(None, description="Filter by severity: low, medium, high, critical"),
    department_id: int = Query(None, description="Filter by department ID"),
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Export anomalies as PDF file
    
    **Requires Authentication**
    
    Query Parameters:
    - severity: Optional filter by severity level
    - department_id: Optional filter by department
    
    Returns:
    - PDF file download
    """
    try:
        query = db.query(Anomaly)
        
        if severity:
            lo, hi = _severity_score_range(severity)
            if lo is not None:
                query = query.filter(Anomaly.anomaly_score >= lo)
            if hi is not None:
                query = query.filter(Anomaly.anomaly_score < hi)
        
        if department_id:
            query = query.filter(Anomaly.dept_id == department_id)
        
        anomalies = query.order_by(desc(Anomaly.created_at)).limit(1000).all()
        
        # Convert to dictionaries (severity derived from anomaly_score)
        anomaly_dicts = [
            {
                "department_id": a.dept_id,
                "anomaly_type": a.anomaly_type,
                "severity": _score_to_severity(a.anomaly_score),
                "anomaly_score": a.anomaly_score,
                "confidence": a.confidence,
                "reason": a.reason,
                "status": a.status,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in anomalies
        ]
        
        # Export to PDF
        pdf_content = export_service.export_anomalies_pdf(
            anomaly_dicts,
            title="Anomaly Detection Report"
        )
        filename = export_service.get_filename("anomalies", "pdf")
        
        log_pipeline_stage(
            "anomaly_export",
            "completed",
            {
                "format": "pdf",
                "record_count": len(anomaly_dicts),
                "filters": {"severity": severity, "department_id": department_id}
            }
        )
        
        return StreamingResponse(
            iter([pdf_content]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ImportError as e:
        logger.error(f"❌ ReportLab not installed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="PDF export not available. Install reportlab: pip install reportlab"
        )
    except Exception as e:
        logger.error(f"❌ Error exporting anomalies PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export anomalies")


@router.get("/predictions.csv")
def export_predictions_csv(
    risk_level: str = Query(None, description="Filter by risk level: low, medium, high, critical"),
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Export lapse predictions as CSV file
    
    **Requires Authentication**
    
    Query Parameters:
    - risk_level: Optional filter by risk level
    
    Returns:
    - CSV file download
    """
    try:
        query = db.query(LaspePrediction)
        
        if risk_level:
            query = query.filter(LaspePrediction.risk_level == risk_level)
        
        predictions = query.order_by(desc(LaspePrediction.risk_score)).limit(1000).all()
        
        # Convert to dictionaries
        pred_dicts = [
            {
                "dept_id": p.dept_id,
                "risk_level": p.risk_level,
                "risk_score": p.risk_score,
                "days_until_lapse": p.days_until_lapse,
                "predicted_lapse_date": p.predicted_lapse_date.isoformat() if p.predicted_lapse_date else None,
                "r2_score": p.r2_score,
                "spending_index": p.spending_index,
                "model_version": p.model_version,
            }
            for p in predictions
        ]
        
        # Export to CSV
        csv_content = export_service.export_predictions_csv(pred_dicts)
        filename = export_service.get_filename("predictions", "csv")
        
        log_pipeline_stage(
            "prediction_export",
            "completed",
            {
                "format": "csv",
                "record_count": len(pred_dicts),
                "filters": {"risk_level": risk_level}
            }
        )
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"❌ Error exporting predictions CSV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export predictions")


@router.get("/predictions.pdf")
def export_predictions_pdf(
    risk_level: str = Query(None, description="Filter by risk level: low, medium, high, critical"),
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Export lapse predictions as PDF file
    
    **Requires Authentication**
    
    Query Parameters:
    - risk_level: Optional filter by risk level
    
    Returns:
    - PDF file download
    """
    try:
        query = db.query(LaspePrediction)
        
        if risk_level:
            query = query.filter(LaspePrediction.risk_level == risk_level)
        
        predictions = query.order_by(desc(LaspePrediction.risk_score)).limit(1000).all()
        
        # Convert to dictionaries
        pred_dicts = [
            {
                "dept_id": p.dept_id,
                "risk_level": p.risk_level,
                "risk_score": p.risk_score,
                "days_until_lapse": p.days_until_lapse,
                "predicted_lapse_date": p.predicted_lapse_date.isoformat() if p.predicted_lapse_date else None,
                "r2_score": p.r2_score,
                "spending_index": p.spending_index,
            }
            for p in predictions
        ]
        
        # Export to PDF
        pdf_content = export_service.export_predictions_pdf(
            pred_dicts,
            title="Lapse Prediction Report"
        )
        filename = export_service.get_filename("predictions", "pdf")
        
        log_pipeline_stage(
            "prediction_export",
            "completed",
            {
                "format": "pdf",
                "record_count": len(pred_dicts),
                "filters": {"risk_level": risk_level}
            }
        )
        
        return StreamingResponse(
            iter([pdf_content]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ImportError as e:
        logger.error(f"❌ ReportLab not installed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="PDF export not available. Install reportlab: pip install reportlab"
        )
    except Exception as e:
        logger.error(f"❌ Error exporting predictions PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export predictions")


@router.get("/budgets.csv")
def export_budgets_csv(
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """
    Export budget data as CSV file
    
    **Requires Authentication**
    
    Returns:
    - CSV file download with all departments' budget information
    """
    try:
        # Get budget data
        budgets = db.query(BudgetAllocation).order_by(
            desc(BudgetAllocation.fiscal_year)
        ).limit(10000).all()
        
        # Convert to dictionaries with department info
        budget_dicts = []
        for b in budgets:
            dept = db.query(Department).filter(
                Department.dept_id == b.dept_id
            ).first()
            
            budget_dicts.append({
                "department_id": b.dept_id,
                "department_name": dept.name if dept else "Unknown",
                "fiscal_year": b.fiscal_year,
                "allocated_amount": b.total_amount,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            })
        
        # Export to CSV
        csv_content = export_service.export_budget_csv(budget_dicts)
        filename = export_service.get_filename("budgets", "csv")
        
        log_pipeline_stage(
            "budget_export",
            "completed",
            {
                "format": "csv",
                "record_count": len(budget_dicts)
            }
        )
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"❌ Error exporting budgets CSV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export budgets")
