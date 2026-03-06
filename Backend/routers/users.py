"""
User management and role assignment endpoints
"""
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from auth.dependencies import get_current_user, require_role, require_permission
from auth.models import AuthenticatedUser
from auth.roles import Permission
from database import get_db
from database.models import User, UserRole

router = APIRouter(prefix="/users", tags=["users"])


# Pydantic schemas for request/response
class UserRoleUpdate(BaseModel):
    """Schema for updating user role"""
    user_id: int
    role: str
    department_ids: Optional[List[int]] = None


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    role: str
    is_active: bool
    department_ids: Optional[List[int]]
    created_at: str
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for user list response"""
    total: int
    users: List[UserResponse]


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Get current authenticated user's information"""
    db_user = db.query(User).filter(User.id == current_user.id).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    department_ids = None
    if db_user.department_ids:
        try:
            department_ids = json.loads(db_user.department_ids)
        except (json.JSONDecodeError, TypeError):
            department_ids = None
    
    return {
        "id": db_user.id,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "phone": db_user.phone,
        "role": db_user.role.value,
        "is_active": db_user.is_active,
        "department_ids": department_ids,
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
    }


@router.get("", response_model=UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 50,
    current_user: AuthenticatedUser = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> dict:
    """
    List all users (admin only)
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user (must be admin)
        db: Database session
        
    Returns:
        List of users with pagination info
    """
    total = db.query(User).count()
    users = db.query(User).offset(skip).limit(limit).all()
    
    users_data = []
    for user in users:
        department_ids = None
        if user.department_ids:
            try:
                department_ids = json.loads(user.department_ids)
            except (json.JSONDecodeError, TypeError):
                department_ids = None
        
        users_data.append({
            "id": user.id,
            "clerk_id": user.clerk_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_active": user.is_active,
            "department_ids": department_ids,
        })
    
    return {"total": total, "users": users_data}


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_ROLES)),
    db: Session = Depends(get_db),
) -> dict:
    """
    Update user role and department access (requires MANAGE_ROLES permission)
    
    Args:
        user_id: User ID to update
        role_update: New role and optional department access list
        current_user: Current authenticated user (must have MANAGE_ROLES permission)
        db: Database session
        
    Returns:
        Updated user information
    """
    # Prevent users from changing their own role
    if user_id and current_user.clerk_id:
        target_user = db.query(User).filter(User.id == user_id).first()
        if target_user and target_user.clerk_id == current_user.clerk_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot change your own role",
            )
    
    db_user = db.query(User).filter(User.id == user_id).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )
    
    # Validate role
    try:
        db_user.role = UserRole[role_update.role.upper()]
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role_update.role}. Valid roles: {', '.join([r.value for r in UserRole])}",
        )
    
    # Update department IDs if provided
    if role_update.department_ids is not None:
        db_user.department_ids = json.dumps(role_update.department_ids)
    
    db.commit()
    db.refresh(db_user)
    
    department_ids = None
    if db_user.department_ids:
        try:
            department_ids = json.loads(db_user.department_ids)
        except (json.JSONDecodeError, TypeError):
            department_ids = None
    
    return {
        "id": db_user.id,
        "clerk_id": db_user.clerk_id,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "role": db_user.role.value,
        "is_active": db_user.is_active,
        "department_ids": department_ids,
    }


@router.put("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: int,
    is_active: bool,
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_USERS)),
    db: Session = Depends(get_db),
) -> dict:
    """
    Activate or deactivate a user (requires MANAGE_USERS permission)
    
    Args:
        user_id: User ID to update
        is_active: Whether the user should be active
        current_user: Current authenticated user (must have MANAGE_USERS permission)
        db: Database session
        
    Returns:
        Updated user information
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )
    
    db_user.is_active = is_active
    db.commit()
    db.refresh(db_user)
    
    department_ids = None
    if db_user.department_ids:
        try:
            department_ids = json.loads(db_user.department_ids)
        except (json.JSONDecodeError, TypeError):
            department_ids = None
    
    return {
        "id": db_user.id,
        "clerk_id": db_user.clerk_id,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "role": db_user.role.value,
        "is_active": db_user.is_active,
        "department_ids": department_ids,
    }


@router.get("/roles/available")
async def get_available_roles(
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MANAGE_ROLES)),
) -> dict:
    """
    Get list of available roles and their permissions (requires MANAGE_ROLES permission)
    
    Returns:
        Available roles with their descriptions
    """
    from auth.roles import ROLE_PERMISSIONS
    
    roles = {}
    for role, permissions in ROLE_PERMISSIONS.items():
        roles[role] = {
            "name": role.capitalize(),
            "permissions": [p.value for p in permissions],
        }
    
    return {"roles": roles}
