"""
User authentication routes - Register, Login, Get Current User
"""
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from database.models import User, UserRole
from auth.models import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse, AuthenticatedUser, PasswordResetRequest
from auth.utils import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user, require_auth

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/register", response_model=dict)
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account
    
    Args:
        request: Registration request with email, password, full_name, phone
        db: Database session
    
    Returns:
        Success message with user details
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        phone=request.phone,
        role=UserRole.VIEWER,  # Default role for new users
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "phone": new_user.phone,
            "role": new_user.role.value
        }
    }


@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Login user and return JWT access token
    
    Args:
        request: Login credentials (email and password)
        db: Database session
    
    Returns:
        JWT token and user details
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create JWT token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role.value,
            "is_active": user.is_active
        }
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(user: AuthenticatedUser = Depends(require_auth)):
    """
    Get current authenticated user information
    
    **Requires Authentication**: Authorization: Bearer <jwt_token>
    
    Returns:
        Current user details
    """
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=str(datetime.utcnow())
    )


@router.post("/logout")
def logout():
    """
    Logout user (client-side should delete the token)
    
    This is a placeholder endpoint. In real implementation,
    token blacklisting could be implemented here.
    """
    return {"message": "Logged out successfully"}


@router.post("/reset-password")
def reset_password(
    request: PasswordResetRequest,
    user: AuthenticatedUser = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Reset user password (authenticated users only)
    
    Args:
        request: Password reset request with old and new passwords
    
    Returns:
        Success message
    """
    # Get user from database
    db_user = db.query(User).filter(User.id == user.id).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify old password
    if not verify_password(request.old_password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Update password with new hash
    db_user.password_hash = hash_password(request.new_password)
    db_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_user)
    
    return {
        "success": True,
        "message": "Password updated successfully"
    }

