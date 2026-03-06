"""
Anomaly Detection API Routes
Endpoints for rule-based and ML-based anomaly detection
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_auth, AuthenticatedUser
from database import get_db
from database.models import Anomaly
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


class ResolveAnomalyRequest(BaseModel):
    notes: Optional[str] = None


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


# =====================================================
# Advanced Filtering Endpoints
# =====================================================

@router.get("/advanced/by-severity")
async def filter_by_severity(
    min_severity: str = Query("low", description="Minimum severity: low, medium, high, critical"),
    max_severity: Optional[str] = Query(None, description="Maximum severity: low, medium, high, critical"),
    limit: int = Query(100, ge=1, le=1000),
    user: AuthenticatedUser = Depends(require_auth)
):
    """
    Filter anomalies by severity level
    
    **Requires Authentication**
    
    **Parameters:**
    - min_severity: Minimum severity level to include
    - max_severity: Maximum severity level (optional)
    - limit: Max results to return
    
    Returns:
    - Departments with rule violations matching severity criteria
    """
    severity_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    
    if min_severity not in severity_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid severity: {min_severity}"
        )
    
    min_val = severity_order[min_severity]
    max_val = severity_order.get(max_severity, 3) if max_severity else 3
    
    all_results = anomaly_service.batch_detect()
    
    # Filter by severity range
    filtered = []
    for result in all_results:
        for violation in result.rule_violations:
            sev_val = severity_order.get(violation.severity, 0)
            if min_val <= sev_val <= max_val:
                filtered.append({
                    'department_id': result.department_id,
                    'rule_name': violation.rule_name,
                    'severity': violation.severity,
                    'score': violation.score,
                    'reason': violation.reason,
                })
                break
    
    # Sort by severity (highest first)
    filtered = sorted(
        filtered,
        key=lambda x: severity_order.get(x['severity'], 0),
        reverse=True
    )[:limit]
    
    return {
        "success": True,
        "filter": {
            "min_severity": min_severity,
            "max_severity": max_severity or "critical"
        },
        "count": len(filtered),
        "data": filtered,
    }


@router.get("/advanced/summary-stats")
async def get_advanced_statistics(
    group_by: str = Query("verdict", description="Group by: verdict, severity, rule"),
    user: AuthenticatedUser = Depends(require_auth)
):
    """
    Get detailed statistics with grouping
    
    **Requires Authentication**
    
    **Parameters:**
    - group_by: Group results by "verdict", "severity", or "rule"
    
    Returns:
    - Statistics grouped by requested field
    - Count and percentage for each group
    """
    all_results = anomaly_service.batch_detect()
    
    if group_by == "verdict":
        groups = {}
        for result in all_results:
            verdict = result.combined_verdict
            groups[verdict] = groups.get(verdict, 0) + 1
        
        total = len(all_results)
        stats = {
            "group_field": "verdict",
            "total": total,
            "groups": [
                {
                    "name": verdict,
                    "count": count,
                    "percentage": round((count / total * 100) if total > 0 else 0, 2)
                }
                for verdict, count in sorted(groups.items(), key=lambda x: x[1], reverse=True)
            ]
        }
    
    elif group_by == "severity":
        severity_groups = {}
        for result in all_results:
            for violation in result.rule_violations:
                sev = violation.severity
                severity_groups[sev] = severity_groups.get(sev, 0) + 1
        
        total = sum(severity_groups.values())
        severity_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        stats = {
            "group_field": "severity",
            "total": total,
            "groups": [
                {
                    "name": severity,
                    "count": count,
                    "percentage": round((count / total * 100) if total > 0 else 0, 2)
                }
                for severity, count in sorted(
                    severity_groups.items(),
                    key=lambda x: severity_order.get(x[0], 0),
                    reverse=True
                )
            ]
        }
    
    elif group_by == "rule":
        rule_groups = {}
        for result in all_results:
            for violation in result.rule_violations:
                rule = violation.rule_name
                rule_groups[rule] = rule_groups.get(rule, 0) + 1
        
        total = sum(rule_groups.values())
        stats = {
            "group_field": "rule",
            "total": total,
            "groups": [
                {
                    "name": rule,
                    "count": count,
                    "percentage": round((count / total * 100) if total > 0 else 0, 2)
                }
                for rule, count in sorted(rule_groups.items(), key=lambda x: x[1], reverse=True)
            ]
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="group_by must be 'verdict', 'severity', or 'rule'"
        )
    
    return {
        "success": True,
        "statistics": stats,
    }


@router.get("/advanced/search")
async def search_anomalies(
    query: str = Query(..., description="Search for departments by ID or name"),
    verdict: Optional[str] = Query(None, description="Filter by verdict"),
    min_score: float = Query(0.0, ge=0.0, le=1.0, description="Minimum anomaly score"),
    limit: int = Query(50, ge=1, le=500),
    user: AuthenticatedUser = Depends(require_auth)
):
    """
    Advanced search with multiple filters
    
    **Requires Authentication**
    
    **Parameters:**
    - query: Search term (dept ID like "DEPT001")
    - verdict: Optional filter (normal, warning, alert, critical)
    - min_score: Minimum anomaly score (0-1)
    - limit: Max results
    
    Returns:
    - Matching anomalies with all filters applied
    """
    all_results = anomaly_service.batch_detect()
    
    # Filter by search query (department ID)
    filtered = []
    for result in all_results:
        if query.lower() in str(result.department_id).lower():
            # Apply additional filters
            if verdict and result.combined_verdict != verdict:
                continue
            if result.combined_score < min_score:
                continue
            
            filtered.append(result.to_dict())
    
    # Sort by score (highest first)
    filtered = sorted(
        filtered,
        key=lambda x: x['combined']['score'],
        reverse=True
    )[:limit]
    
    return {
        "success": True,
        "query": query,
        "filters": {
            "verdict": verdict,
            "min_score": min_score
        },
        "count": len(filtered),
        "data": filtered,
    }


@router.post("/{anomaly_id}/resolve")
async def resolve_anomaly(
    anomaly_id: int,
    payload: ResolveAnomalyRequest,
    user: AuthenticatedUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Resolve an anomaly row in database for audit/export workflows."""
    row = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Anomaly {anomaly_id} not found")

    row.status = "resolved"
    row.reviewed_by = user.clerk_id
    row.reviewed_at = row.reviewed_at or datetime.utcnow()
    if payload.notes:
        row.notes = payload.notes
    db.commit()

    return {
        "success": True,
        "anomaly_id": anomaly_id,
        "status": row.status,
        "reviewed_by": row.reviewed_by,
    }
