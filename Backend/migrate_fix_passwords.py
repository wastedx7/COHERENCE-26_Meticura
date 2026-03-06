"""
Fix corrupted password hashes in the database.
Identifies plain-text or invalid password hashes and resets them to bcrypt format.

Usage:
    python migrate_fix_passwords.py [--reset-all] [--interactive]
"""
import sys
import argparse
from auth.utils import hash_password
from database import SessionLocal
from database.models import User
from config import settings


def is_valid_bcrypt(hash_str: str) -> bool:
    """Check if a hash string is a valid bcrypt hash"""
    if not hash_str:
        return False
    return hash_str.startswith("$2")


def fix_passwords(reset_all: bool = False, interactive: bool = True):
    """
    Fix invalid password hashes in the database
    
    Args:
        reset_all: If True, reset all users to default password
        interactive: If True, ask for confirmation before each fix
    """
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        
        if not users:
            print("✓ No users found in database")
            return
        
        print(f"\n🔍 Found {len(users)} users in database\n")
        
        invalid_users = []
        for u in users:
            if not is_valid_bcrypt(u.password_hash):
                invalid_users.append(u)
                hash_preview = (u.password_hash[:40] + "...") if u.password_hash else "(NULL)"
                print(f"  ❌ INVALID: {u.email:30} | {hash_preview}")
            else:
                print(f"  ✓ VALID:   {u.email:30} | bcrypt hash")
        
        if not invalid_users and not reset_all:
            print("\n✅ All password hashes are valid!")
            return
        
        print(f"\n{'='*70}")
        
        if reset_all:
            print(f"🔄 Resetting all {len(users)} users to default password")
            default_password = getattr(settings, 'SUPER_ADMIN_PASSWORD', 'ChangeMeNow123!')
            for u in users:
                u.password_hash = hash_password(default_password)
                print(f"  ✓ Reset {u.email}")
            
            if interactive:
                confirm = input(f"\nConfirm resetting {len(users)} users? (yes/no): ").strip().lower()
                if confirm != "yes":
                    print("❌ Cancelled")
                    db.rollback()
                    return
            
            db.commit()
            print(f"\n✅ Reset {len(users)} users to default password: '{default_password}'")
            print("\n📝 NOTE: Users were reset. They should change their password on first login.")
        
        elif invalid_users:
            print(f"🔄 Fixing {len(invalid_users)} invalid password(s)")
            
            # For invalid hashes with no known plain text, generate a secure temporary password
            import secrets
            temp_pass = f"Reset{secrets.token_hex(4).upper()}"
            
            for u in invalid_users:
                u.password_hash = hash_password(temp_pass)
                print(f"  ✓ Fixed {u.email}")
            
            if interactive:
                confirm = input(f"\nConfirm fixing {len(invalid_users)} users with temp password? (yes/no): ").strip().lower()
                if confirm != "yes":
                    print("❌ Cancelled")
                    db.rollback()
                    return
            
            db.commit()
            print(f"\n✅ Fixed {len(invalid_users)} users with temporary password: '{temp_pass}'")
            print("\n📝 NOTE: Users must reset password on login with temporary password.")
        
        print(f"{'='*70}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix corrupted password hashes")
    parser.add_argument("--reset-all", action="store_true", help="Reset all users to default password")
    parser.add_argument("--force", action="store_true", help="Skip confirmation prompts")
    
    args = parser.parse_args()
    
    fix_passwords(reset_all=args.reset_all, interactive=not args.force)
