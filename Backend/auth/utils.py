"""
Authentication utilities for password hashing and JWT token management
"""
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import logging
from jose import JWTError, jwt
from fastapi import HTTPException, status

from config import settings

# Configure logging
logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt directly.
    
    Automatically truncates passwords exceeding bcrypt's 72-byte limit.
    
    Args:
        password: Plain text password to hash
    
    Returns:
        Bcrypt hash of the password
    
    Raises:
        ValueError: If password is None or empty
    """
    if not password:
        raise ValueError("Password cannot be empty")
    
    # Truncate to 72 bytes if necessary (bcrypt's hard limit)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Safely truncate by characters to avoid breaking multi-byte UTF-8
        # Start from 72 bytes and work backwards character by character
        password_bytes = password_bytes[:72]
        # Decode with errors='ignore' to drop incomplete UTF-8 sequences at boundary
        password = password_bytes.decode('utf-8', errors='ignore')
        logger.warning(f"Password truncated to 72 bytes: {len(password)} characters")
    
    # Hash with bcrypt directly (avoid broken passlib wrapper)
    try:
        salt = bcrypt.gensalt(rounds=12)  # 12 rounds is standard
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Password hashing failed: {e}")
        raise ValueError(f"Could not hash password: {str(e)}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    Handles both valid bcrypt hashes and legacy plain-text passwords.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database
    
    Returns:
        True if password matches, False otherwise
    """
    if not hashed_password or not plain_password:
        return False
    
    # Safely truncate input password to 72 bytes if necessary
    plain_password_bytes = plain_password.encode('utf-8')
    if len(plain_password_bytes) > 72:
        plain_password_bytes = plain_password_bytes[:72]
        plain_password = plain_password_bytes.decode('utf-8', errors='ignore')
    
    try:
        # Try standard bcrypt verification
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        # If bcrypt fails (UnknownHashError, etc.), check if it's a plain-text password
        # This is a temporary fallback for legacy data - should be migrated to bcrypt
        logger.warning(f"Password verification failed with hash format error: {e}")
        
        # Fallback: check if stored value is plain text (INSECURE - legacy only)
        if plain_password == hashed_password:
            logger.warning("Using insecure plain-text password match - user should update password")
            return True
        
        return False


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
