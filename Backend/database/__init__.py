"""
Database initialization and session management
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from contextlib import contextmanager
from typing import Generator

from config import settings
from database.models import Base


# Create engine with connection pooling
db_url = settings.DATABASE_URL
connect_args = {}

# Driver-specific connection arguments
if db_url.startswith("postgresql"):
    connect_args = {"connect_timeout": 10}
elif db_url.startswith("sqlite"):
    connect_args = {"timeout": 10}

engine = create_engine(
    db_url,
    echo=False,  # Set to True for SQL debugging
    pool_pre_ping=True,  # Test connections before using them
    pool_recycle=3600,  # Recycle connections every hour
    connect_args=connect_args,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for database session (non-FastAPI use)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def init_db():
    """
    Initialize database
    Creates all tables if they don't exist
    Creates or updates admin user with correct password
    """
    from database.models import User, UserRole
    from auth.utils import hash_password
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database initialized - all tables created")
    
    # Ensure admin user exists with correct password
    try:
        with get_db_context() as db:
            existing_admin = db.query(User).filter(
                User.email == settings.SUPER_ADMIN_EMAIL
            ).first()
            
            new_password_hash = hash_password(settings.SUPER_ADMIN_PASSWORD)
            
            if not existing_admin:
                # Create new admin user
                admin_user = User(
                    email=settings.SUPER_ADMIN_EMAIL,
                    password_hash=new_password_hash,
                    full_name=settings.SUPER_ADMIN_NAME,
                    phone=None,
                    role=UserRole.ADMIN,
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
                print(f"✓ Admin user created: {settings.SUPER_ADMIN_EMAIL}")
            else:
                # Update existing admin user's password to ensure it's correct
                existing_admin.password_hash = new_password_hash
                existing_admin.full_name = settings.SUPER_ADMIN_NAME
                existing_admin.is_active = True
                if existing_admin.role != UserRole.ADMIN:
                    existing_admin.role = UserRole.ADMIN
                db.commit()
                print(f"✓ Admin user password updated: {settings.SUPER_ADMIN_EMAIL}")
    except Exception as e:
        print(f"⚠ Could not create/update admin user: {str(e)}")


async def drop_db():
    """
    Drop all tables (DANGER - use only for testing/reset)
    """
    Base.metadata.drop_all(bind=engine)
    print("All database tables dropped")


def verify_db_connection():
    """
    Verify database connection works
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("Database connection verified")
            return True
    except Exception as e:
        print(f" Database connection failed: {str(e)}")
        return False
