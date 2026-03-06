"""
Authentication routes
Handles user authentication, verification, and profile management via Clerk
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user, get_optional_user, require_auth, AuthenticatedUser


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={
        401: {"description": "Unauthorized - invalid or missing token"},
        404: {"description": "User not found"},
    }
)


@router.get("/me", response_model=dict)
async def get_current_user_info(user: AuthenticatedUser = Depends(require_auth)):
    """
    Get current authenticated user information
    
    **Requires Authentication**: Authorization: Bearer <jwt_token>
    
    Returns user details from Clerk:
    - clerk_id: Unique Clerk user identifier
    - email: Primary email address
    - full_name: User's full name
    - username: Username if available
    - image_url: Profile picture URL if available
    """
    return {
        "clerk_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
        "username": user.username,
        "image_url": user.image_url,
    }


@router.get("/profile", response_model=dict)
async def get_user_profile(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Get user profile details
    
    **Requires Authentication**: Authorization: Bearer <jwt_token>
    
    Alternative to `/me` endpoint with simplified response format.
    """
    return {
        "success": True,
        "user": {
            "id": current_user.clerk_id,
            "email": current_user.email,
            "name": current_user.full_name,
            "avatar": current_user.image_url,
            "username": current_user.username,
        }
    }


@router.get("/public", response_model=dict)
async def public_endpoint():
    """
    Public endpoint (no authentication required)
    
    Useful for testing API connectivity without authentication.
    """
    return {
        "message": "Public endpoint - no authentication required",
        "status": "accessible"
    }


@router.get("/optional", response_model=dict)
async def optional_auth_route(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Optional authentication endpoint
    
    Works with or without token:
    - With token: Returns personalized user info
    - Without token: Returns anonymous response
    
    Useful for pages that show different content based on login status.
    """
    if user:
        return {
            "authenticated": True,
            "message": f"Welcome back, {user.full_name}!",
            "user_id": user.clerk_id,
            "email": user.email,
        }
    
    return {
        "authenticated": False,
        "message": "You are not logged in",
    }


@router.post("/verify-token", response_model=dict)
async def verify_token(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Verify JWT token validity
    
    **Requires Authentication**: Authorization: Bearer <jwt_token>
    
    Frontend can use this endpoint to verify that a token is still valid
    before making other API calls. Returns user info if valid.
    """
    return {
        "valid": True,
        "user_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
    }


@router.get("/health", response_model=dict)
async def auth_health():
    """
    Authentication service health check
    
    No authentication required. Used to verify the auth service is running.
    """
    return {
        "status": "healthy",
        "service": "authentication",
        "version": "1.0.0"
    }


@router.post("/logout", response_model=dict)
async def logout(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Logout endpoint
    
    **Requires Authentication**: Authorization: Bearer <jwt_token>
    
    Note: With Clerk, actual logout happens on frontend.
    This endpoint can be used for backend cleanup/audit logging.
    """
    return {
        "success": True,
        "message": f"Successfully logged out user {user.clerk_id}",
        "logged_out_user": user.email,
    }
