from __future__ import annotations

import json
from typing import Optional, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from auth.clerk import clerk_client, jwt_validator
from auth.models import AuthenticatedUser, TokenPayload
from auth.roles import Permission, has_permission
from database import get_db
from database.models import User as DBUser, UserRole


# Security scheme for FastAPI
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    """
    Dependency for authenticating users via Clerk JWT token
    
    Usage in FastAPI routes:
        @router.get("/protected")
        async def protected_route(user: AuthenticatedUser = Depends(get_current_user)):
            return {"user_id": user.clerk_id, "email": user.email}
    
    Args:
        credentials: Bearer token from Authorization header
        db: Database session
        
    Returns:
        AuthenticatedUser with Clerk user details and role
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    
    # Decode and validate JWT
    token_payload: TokenPayload = jwt_validator.decode_token(token)
    
    # Extract user ID from token
    clerk_user_id = token_payload.sub
    
    # Fetch full user details from Clerk API
    clerk_user = await clerk_client.get_user(clerk_user_id)
    
    # Get or create user in database with role information
    db_user = db.query(DBUser).filter(DBUser.clerk_id == clerk_user_id).first()
    
    if not db_user:
        # Create new user with default role
        db_user = DBUser(
            clerk_id=clerk_user_id,
            email=clerk_user.primary_email or "",
            full_name=clerk_user.full_name,
            role=UserRole.VIEWER,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    
    # Parse department_ids if set
    department_ids = None
    if db_user.department_ids:
        try:
            department_ids = json.loads(db_user.department_ids)
        except (json.JSONDecodeError, TypeError):
            department_ids = None
    
    # Convert to simplified authenticated user model with role
    return AuthenticatedUser.from_clerk_user(
        clerk_user,
        role=db_user.role.value,
        department_ids=department_ids,
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

