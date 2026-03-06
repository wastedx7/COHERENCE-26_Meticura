"""
Database seed script
Loads initial data (lapse predictions) into the database
Run this after the database is initialized to populate it with data
"""
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from database import get_db_context, SessionLocal
from services.lapse_service import LaspePredictionService


def seed_database():
    """
    Populate database with initial data
    """
    print("🌱 Seeding database with initial data...")
    
    with get_db_context() as db:
        try:
            # Load lapse predictions
            print("\n📊 Loading lapse predictions...")
            count = LaspePredictionService.save_predictions_to_db(db)
            
            # Show summary
            print("\n📈 Database Summary:")
            summary = LaspePredictionService.get_lapse_summary(db)
            print(f"   Total predictions: {summary['total']}")
            print(f"   By risk level: {summary['by_risk_level']}")
            print(f"   Avg days until lapse: {summary['avg_days_until_lapse']:.1f}")
            
            # Show critical budgets
            critical = LaspePredictionService.get_critical_budgets(db, limit=5)
            if critical:
                print(f"\n⚠️  Top 5 critical budgets:")
                for pred in critical:
                    print(f"   Dept {pred['dept_id']}: {pred['risk_level']} ({pred['days_until_lapse']} days)")
            
            print("\n✅ Database seeding complete!")
            
        except Exception as e:
            print(f"\n❌ Error during seeding: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    return True


if __name__ == "__main__":
    success = seed_database()
    sys.exit(0 if success else 1)
