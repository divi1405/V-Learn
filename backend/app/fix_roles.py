import sys
import os

# Ensure the correct path is available for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from sqlalchemy import text

if __name__ == "__main__":
    db = SessionLocal()
    try:
        # First ensure the enum accepts 'manager' so we don't get a DataError if it was somehow removed.
        # But since we just removed MANAGER from the python Enum, the DB enum might still have it.
        # Let's directly execute the UPDATE. If it fails due to InvalidTextRepresentation, we can catch it.
        print("Executing role updates...")
        
        # We need to bypass SQLAlchemy's ORM model for User here, 
        # because loading the User model triggers the Enum validation error 
        # before we even execute the query.
        db.execute(text("UPDATE users SET role = 'learner'::userrole WHERE role::text = 'manager';"))
        db.commit()
        print("✅ Orphaned 'manager' roles have been successfully updated to 'learner'.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating roles: {e}")
    finally:
        db.close()
