from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Request model for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    phone: Optional[str] = None


class UserLoginRequest(BaseModel):
    """Request model for user login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None


class UserResponse(BaseModel):
    """User response model"""
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: str
    
    class Config:
        from_attributes = True


class AuthenticatedUser(BaseModel):
    """User model for authenticated requests"""
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str = "viewer"
    is_active: bool = True
    department_ids: Optional[list[int]] = None


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: int = Field(..., description="Subject - User ID")
    email: str
    role: str
    exp: Optional[int] = None

