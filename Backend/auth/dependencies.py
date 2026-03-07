from __future__ import annotations

import json
from typing import Optional, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime

from auth.models import AuthenticatedUser, TokenPayload
from auth.roles import Permission, has_permission
from database import get_db
from database.models import User as DBUser, UserRole
from config import settings


# Security scheme for FastAPI
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    """
    Dependency for authenticating users via JWT token
    
    Supports both custom JWT tokens and Clerk tokens
    
    Usage in FastAPI routes:
        @router.get("/protected")
        async def protected_route(user: AuthenticatedUser = Depends(get_current_user)):
            return {"user_id": user.id, "email": user.email}
    
    Args:
        credentials: Bearer token from Authorization header
        db: Database session
        
    Returns:
        AuthenticatedUser with user details and role
        
    Raises:
        HTTPException: If authentication fails
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Try to decode as custom JWT token
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no user id found",
            )
        
        try:
            user_id = int(sub)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: malformed user id",
            )
        
        # Look up user in database
        db_user = db.query(DBUser).filter(DBUser.id == user_id).first()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        # Parse department_ids if set
        department_ids = None
        if db_user.department_ids:
            try:
                department_ids = json.loads(db_user.department_ids)
            except (json.JSONDecodeError, TypeError):
                department_ids = None
        
        return AuthenticatedUser(
            id=db_user.id,
            email=db_user.email,
            full_name=db_user.full_name,
            phone=db_user.phone,
            role=db_user.role.value,
            is_active=db_user.is_active,
            department_ids=department_ids,
        )
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[AuthenticatedUser]:
    """
    Optional authentication dependency - returns None if no token provided
    
    Usage for routes that work for both authenticated and anonymous users:
        @router.get("/public")
        async def public_route(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
            if user:
                return {"message": f"Hello {user.full_name}"}
            return {"message": "Hello anonymous"}
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_auth(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """
    Simplified dependency alias for required authentication
    """
    return user


def require_role(*required_roles: str):
    """
    Dependency factory for role-based access control
    
    Usage:
        @router.get("/admin-only")
        async def admin_route(user: AuthenticatedUser = Depends(require_role("admin"))):
            return {"message": "Admin access granted"}
    
    Args:
        required_roles: One or more role names (e.g., "admin", "manager")
        
    Returns:
        Dependency function for use in route handlers
    """
    async def role_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role(s): {', '.join(required_roles)}",
            )
        return user
    
    return role_checker


def require_permission(permission: Permission):
    """
    Dependency factory for permission-based access control
    
    Usage:
        @router.post("/approve-reallocation")
        async def approve_reallocation(user: AuthenticatedUser = Depends(require_permission(Permission.APPROVE_REALLOCATION))):
            return {"status": "approved"}
    
    Args:
        permission: Permission to check
        
    Returns:
        Dependency function for use in route handlers
    """
    async def permission_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not has_permission(user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required permission: {permission.value}",
            )
        return user
    
    return permission_checker

