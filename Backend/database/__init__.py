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
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database initialized - all tables created")


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
