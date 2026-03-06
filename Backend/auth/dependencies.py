from __future__ import annotations

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth.clerk import clerk_client, jwt_validator
from auth.models import AuthenticatedUser, TokenPayload


# Security scheme for FastAPI
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser:
    """
    Dependency for authenticating users via Clerk JWT token
    
    Usage in FastAPI routes:
        @router.get("/protected")
        async def protected_route(user: AuthenticatedUser = Depends(get_current_user)):
            return {"user_id": user.clerk_id, "email": user.email}
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        AuthenticatedUser with Clerk user details
        
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
    
    # Convert to simplified authenticated user model
    return AuthenticatedUser.from_clerk_user(clerk_user)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
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
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_auth(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """
    Simplified dependency alias for required authentication
    """
    return user
