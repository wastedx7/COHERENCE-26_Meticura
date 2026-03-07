from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import AuthenticatedUser, require_auth
from services import predictions_service


router = APIRouter(prefix="/predictions", tags=["Predictions"])


class ActiveModelUpdateRequest(BaseModel):
    model_name: str


def _is_center_admin(user: AuthenticatedUser) -> bool:
    return user.role in {"admin", "center_admin"}


@router.get("/metrics")
def get_metrics(user: AuthenticatedUser = Depends(require_auth)):
    return predictions_service.get_metrics()


@router.get("/metrics/{model_name}")
def get_metric(model_name: str, user: AuthenticatedUser = Depends(require_auth)):
    try:
        return predictions_service.get_metric(model_name)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Model not found: {model_name}") from exc


@router.get("/history")
def get_history(user: AuthenticatedUser = Depends(require_auth)):
    return predictions_service.get_history()


@router.get("/active-model")
def get_active_model(user: AuthenticatedUser = Depends(require_auth)):
    return predictions_service.get_active_model()


@router.put("/active-model")
def set_active_model(
    payload: ActiveModelUpdateRequest,
    user: AuthenticatedUser = Depends(require_auth),
):
    if not _is_center_admin(user):
        raise HTTPException(status_code=403, detail="Only Center Admin can set active model")

    try:
        return predictions_service.set_active_model(payload.model_name, user.clerk_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
