#!/usr/bin/env python3
"""Check password hashes in database"""
from database import SessionLocal
from database.models import User

db = SessionLocal()
users = db.query(User).all()

if not users:
    print("❌ No users in database")
else:
    print(f"✓ Found {len(users)} users:\n")
    for u in users:
        hash_str = u.password_hash or "(NULL)"
        is_bcrypt = hash_str.startswith("$2")
        status = "✓ bcrypt" if is_bcrypt else "❌ PLAIN/INVALID"
        print(f"{status:15} | {u.email:30} | {hash_str[:50]}...")

db.close()
