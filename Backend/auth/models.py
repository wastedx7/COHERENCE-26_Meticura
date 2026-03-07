from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegisterRequest(BaseModel):
    """Request model for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password (must be 8-72 bytes in UTF-8)")
    full_name: str
    phone: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
        """Validate that password is at most 72 bytes in UTF-8 (bcrypt limit)"""
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            raise ValueError(f"Password exceeds 72-byte bcrypt limit ({len(password_bytes)} bytes). Use fewer or simpler characters.")
        return v


class UserLoginRequest(BaseModel):
    """Request model for user login"""
    email: EmailStr
    password: str = Field(..., description="Password")


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

class PasswordResetRequest(BaseModel):
    """Request model for password reset"""
    old_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (must be 8-72 bytes in UTF-8)")
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password_bytes(cls, v: str) -> str:
        """Validate that new password is at most 72 bytes in UTF-8 (bcrypt limit)"""
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            raise ValueError(f"Password exceeds 72-byte bcrypt limit ({len(password_bytes)} bytes). Use fewer or simpler characters.")
        return v
