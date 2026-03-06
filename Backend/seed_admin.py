"""
Initialize super admin user in the database.
Run this once after database is set up.

Usage:
    python seed_admin.py
"""

import sys
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from database.models import User, UserRole
from auth.utils import hash_password
from config import settings


def init_super_admin():
    """Create super admin user if it doesn't exist"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = next(get_db())
    
    try:
        # Check if super admin already exists
        existing_admin = db.query(User).filter(
            User.email == settings.SUPER_ADMIN_EMAIL
        ).first()
        
        if existing_admin:
            print(f"✓ Super admin user already exists: {settings.SUPER_ADMIN_EMAIL}")
            return
        
        # Create super admin user
        super_admin = User(
            email=settings.SUPER_ADMIN_EMAIL,
            password_hash=hash_password(settings.SUPER_ADMIN_PASSWORD),
            full_name=settings.SUPER_ADMIN_NAME,
            phone=None,
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        
        print(f"✓ Super admin created successfully!")
        print(f"  Email: {settings.SUPER_ADMIN_EMAIL}")
        print(f"  Role: {UserRole.ADMIN.value}")
        print(f"  Status: Active")
        
    except Exception as e:
        print(f"✗ Error creating super admin: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_super_admin()
