"""Password reset utility — run inside the Docker backend container.
Usage: docker exec hr_platform-backend-1 python /tmp/reset_passwords.py
"""
from app.database import SessionLocal
from app.models import User, UserRole
from app.auth import hash_password

db = SessionLocal()

DEFAULT_PW = "Welcome@123"
default_hash = hash_password(DEFAULT_PW)

# Reset admin
admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
if admin:
    admin.password_hash = default_hash
    admin.is_first_login = True
    print(f"Admin reset: {admin.email} → Welcome@123 (is_first_login=True)")

# Reset sri.vidya (re-set to Welcome@123 for demo; she'll change on login)
sri = db.query(User).filter(User.email == "sri.vidya@vearc.com").first()
if sri:
    sri.password_hash = default_hash
    sri.is_first_login = True
    print(f"Demo user reset: {sri.email} → Welcome@123 (is_first_login=True)")

db.commit()
print("\n✅ Done. All affected users reset to Welcome@123.")
print("They will be prompted to change password on first login.")
db.close()
