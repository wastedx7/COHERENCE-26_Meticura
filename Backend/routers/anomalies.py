"""
Anomaly Detection API Routes
Endpoints for rule-based and ML-based anomaly detection
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from auth import require_auth, AuthenticatedUser
from services.anomaly_service import AnomalyService
from ml.rules import RuleEngine


router = APIRouter(
    prefix="/anomalies",
    tags=["Anomalies"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Not found"},
    }
)

# Initialize service
anomaly_service = AnomalyService()
rule_engine = RuleEngine()


@router.get("/health")
async def anomaly_health():
    """Health check for anomaly detection service"""
    return {
        "status": "healthy",
        "service": "anomaly-detection",
        "version": "1.0.0"
    }


@router.get("/rules")
async def get_rules(
    user: AuthenticatedUser = Depends(require_auth)
):
    """
    Get list of all fraud detection rules
    
    **Requires Authentication**
    
    Returns:
    - All 8 fraud detection rules with descriptions
    - Severity levels
    - Enable/disable status
    """
    stats = rule_engine.get_rule_statistics()
    
    return {
        "success": True,
        "total_rules": stats['total_rules'],
        "enabled_rules": stats['enabled_rules'],
        "rules": stats['rules'],
    }


@router.get("/department/{dept_id}")
async def get_department_anomalies(
    dept_id: int,
    user: AuthenticatedUser = Depends(require_auth)
):
    """
    Detect anomalies for a specific department
    
    **Requires Authentication**
    
    Combines:
    - Isolation Forest ML model (60% weight)
    - Rule Engine (40% weight)
    
    Returns:
    - ML detection result (score, confidence, flagged)
    - Rule violations (8 rules evaluated)
    - Combined verdict (normal, warning, alert, critical)
    - Combined anomaly score (0-1)
    """
    result = anomaly_service.detect_anomalies(dept_id)
    
    return {
        "success": True,
        "department_id": dept_id,
        "detection": result.to_dict(),
    }


@router.get("/critical")
async def get_critical_anomalies(
    limit: int = Query(20, ge=1, le=100),
    user: AuthenticatedUser = Depends(require_auth)
):
    """
    Get departments with critical or alert anomalies
    
    **Requires Authentication**
    
    Returns:
    - Top N flagged departments sorted by anomaly score
    - Includes both ML and rule violations
    """
    critical = anomaly_service.get_critical_anomalies(limit=limit)
    
    if not critical:
        return {
            "success": True,
            "count": 0,
            "message": "No critical anomalies detected",
            "data": []
        }
    
    return {
        "success": True,
        "count": len(critical),
        "data": critical,
    }


@router.get("/by-verdict/{verdict}")
async def get_by_verdict(
    verdict: str,
    user: AuthenticatedUser = Depends(require_auth),
    limit: int = Query(50, ge=1, le=500)
):
    """
    Get anomalies filtered by verdict
    
    **Requires Authentication**
    
    **Verdicts**: normal, warning, alert, critical
    
    Returns:
    - List of departments matching the verdict
    """
    valid_verdicts = ['normal', 'warning', 'alert', 'critical']
    if verdict not in valid_verdicts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verdict. Must be one of: {', '.join(valid_verdicts)}"
        )
    
    all_results = anomaly_service.batch_detect()
    
    # Filter by verdict
    filtered = [
        r.to_dict() for r in all_results
        if r.combined_verdict == verdict
    ][:limit]
    
    return {
        "success": True,
        "verdict": verdict,
        "count": len(filtered),
        "data": filtered,
    }


@router.get("/summary")
async def get_anomaly_summary(
    user: AuthenticatedUser = Depends(require_auth)
):
    """
    Get summary statistics of anomalies
    
    **Requires Authentication**
    
    Returns:
    - Total anomalies detected
    - Distribution by verdict
    - Distribution by rule severity
    - Critical count, alert count
    """
    summary = anomaly_service.get_summary_statistics()
    
    return {
        "success": True,
        "summary": summary,
    }


@router.get("/rule/{rule_name}")
async def get_rule_violations(
    rule_name: str,
    user: AuthenticatedUser = Depends(require_auth),
    limit: int = Query(50, ge=1, le=500)
):
    """
    Get all departments violating a specific rule
    
    **Requires Authentication**
    
    Returns:
    - List of departments flagged by this rule
    - Rule violation details and scores
    """
    # Get all results
    all_results = anomaly_service.batch_detect()
    
    # Filter for this rule
    matching = []
    for result in all_results:
        for violation in result.rule_violations:
            if violation.rule_name.lower() == rule_name.lower():
                matching.append({
                    'department_id': result.department_id,
                    'rule_name': violation.rule_name,
                    'severity': violation.severity,
                    'score': violation.score,
                    'reason': violation.reason,
                    'details': violation.details,
                })
    
    if not matching:
        return {
            "success": True,
            "rule_name": rule_name,
            "count": 0,
            "message": f"No violations found for rule '{rule_name}'",
            "data": []
        }
    
    # Sort by score (highest first)
    matching = sorted(matching, key=lambda x: x['score'], reverse=True)[:limit]
    
    return {
        "success": True,
        "rule_name": rule_name,
        "count": len(matching),
        "data": matching,
    }


@router.get("/")
async def list_all_anomalies(
    user: AuthenticatedUser = Depends(require_auth),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    List all detected anomalies
    
    **Requires Authentication**
    
    Returns:
    - All departments with anomalies
    - Sorted by combined anomaly score (highest first)
    """
    results = anomaly_service.batch_detect()
    
    # Filter to only flagged departments
    flagged = [
        r.to_dict() for r in results
        if r.ml_flagged or r.rule_flagged
    ]
    
    # Sort by combined score (highest first)
    flagged = sorted(flagged, key=lambda x: x['combined']['score'], reverse=True)[:limit]
    
    return {
        "success": True,
        "count": len(flagged),
        "data": flagged,
    }


@router.post("/rescan/{dept_id}")
async def rescan_department(
    dept_id: int,
    user: AuthenticatedUser = Depends(require_auth)
):
    """
    Re-run anomaly detection for a department
    
    **Requires Authentication**
    
    (Useful after database updates or model retraining)
    
    Returns:
    - Fresh anomaly detection result
    """
    result = anomaly_service.detect_anomalies(dept_id)
    
    return {
        "success": True,
        "message": f"Re-scanned department {dept_id}",
        "department_id": dept_id,
        "detection": result.to_dict(),
    }
