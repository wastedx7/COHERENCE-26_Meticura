from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ClerkUser(BaseModel):
    """User model from Clerk"""
    id: str = Field(..., description="Clerk user ID")
    email_addresses: list[dict] = Field(default_factory=list)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    image_url: Optional[str] = None
    created_at: int
    updated_at: int
    
    @property
    def primary_email(self) -> Optional[str]:
        """Extract primary email address"""
        for email_obj in self.email_addresses:
            if isinstance(email_obj, dict) and email_obj.get("id"):
                return email_obj.get("email_address")
        return None
    
    @property
    def full_name(self) -> str:
        """Construct full name from first and last name"""
        parts = []
        if self.first_name:
            parts.append(self.first_name)
        if self.last_name:
            parts.append(self.last_name)
        return " ".join(parts) if parts else self.username or "Unknown"


class AuthenticatedUser(BaseModel):
    """Simplified user model for authenticated requests"""
    clerk_id: str
    email: Optional[str] = None
    full_name: str
    username: Optional[str] = None
    image_url: Optional[str] = None
    role: str = "viewer"  # Default role
    department_ids: Optional[list[int]] = None  # Departments user can access (None = all)
    
    @classmethod
    def from_clerk_user(cls, clerk_user: ClerkUser, role: str = "viewer", department_ids: Optional[list[int]] = None) -> AuthenticatedUser:
        """Create from Clerk user object"""
        return cls(
            clerk_id=clerk_user.id,
            email=clerk_user.primary_email,
            full_name=clerk_user.full_name,
            username=clerk_user.username,
            image_url=clerk_user.image_url,
            role=role,
            department_ids=department_ids,
        )


class TokenPayload(BaseModel):
    """JWT token payload from Clerk"""
    sub: str = Field(..., description="Subject - Clerk user ID")
    azp: Optional[str] = None
    iat: Optional[int] = None
    exp: Optional[int] = None
    nbf: Optional[int] = None
    iss: Optional[str] = None
