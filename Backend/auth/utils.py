"""
Authentication utilities for password hashing and JWT token management
"""
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status

from config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Dictionary with user data to encode (usually {'sub': user_id, 'email': user_email})
        expires_delta: Optional timedelta for token expiration
    
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    
    # Use a simple secret key (in production, use settings.SECRET_KEY)
    secret_key = getattr(settings, 'SECRET_KEY', 'your-secret-key-change-in-production')
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token
    
    Args:
        token: JWT token to decode
    
    Returns:
        Decoded token payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        secret_key = getattr(settings, 'SECRET_KEY', 'your-secret-key-change-in-production')
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
