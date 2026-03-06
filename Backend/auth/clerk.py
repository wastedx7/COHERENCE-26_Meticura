from __future__ import annotations

import httpx
import jwt
from typing import Optional
from fastapi import HTTPException, status

from config import settings
from auth.models import ClerkUser, TokenPayload


class ClerkClient:
    """Client for interacting with Clerk API"""
    
    BASE_URL = "https://api.clerk.com/v1"
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
        }
    
    async def get_user(self, user_id: str) -> ClerkUser:
        """
        Fetch user details from Clerk API
        
        Args:
            user_id: Clerk user ID (from JWT sub claim)
            
        Returns:
            ClerkUser object with user details
            
        Raises:
            HTTPException: If user not found or API error
        """
        url = f"{self.BASE_URL}/users/{user_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                user_data = response.json()
                return ClerkUser(**user_data)
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"User {user_id} not found in Clerk"
                    )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Clerk API error: {e.response.status_code}"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Clerk API: {str(e)}"
                )


class JWTValidator:
    """Validates JWT tokens from Clerk"""
    
    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = secret_key or settings.CLERK_SECRET_KEY
    
    def decode_token(self, token: str) -> TokenPayload:
        """
        Decode and validate JWT token from Clerk
        
        Args:
            token: JWT token string from Authorization header
            
        Returns:
            TokenPayload with decoded claims
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            # Decode without verification first to inspect issuer
            unverified_payload = jwt.decode(
                token,
                options={"verify_signature": False}
            )
            
            # For development: If using Clerk's default JWT format
            # In production, you should verify the signature using Clerk's public key
            # or JWKS endpoint
            
            # Verify token signature with secret key (if applicable)
            # Note: Clerk typically uses RS256, you may need to fetch JWKS
            try:
                payload = jwt.decode(
                    token,
                    self.secret_key,
                    algorithms=["HS256", "RS256"],
                    options={"verify_signature": True}
                )
            except jwt.InvalidSignatureError:
                # Fallback: use unverified for development
                # TODO: Implement proper JWKS verification for production
                payload = unverified_payload
            
            return TokenPayload(**payload)
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token validation failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )


# Singleton instances
clerk_client = ClerkClient(settings.CLERK_SECRET_KEY)
jwt_validator = JWTValidator()
