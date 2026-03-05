from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserOut, UserUpdate, UserCreate
from app.auth import get_current_user, require_role, hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


def resolve_role(role_str: str) -> UserRole:
    """Convert a role string to UserRole enum, defaulting to LEARNER."""
    if not role_str:
        return UserRole.LEARNER
    try:
        return UserRole(role_str.upper())
    except (ValueError, KeyError):
        return UserRole.LEARNER


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user

@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    for k, v in data.model_dump(exclude_unset=True).items():
        if k in ["name", "designation", "profile_image"]:
            setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user

@router.post("", response_model=UserOut, status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin", "hr_admin")),
):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(data.password)

    new_user = User(
        name=data.name,
        email=data.email,
        employee_number=data.employee_number or f"USR-{db.query(User).count() + 1}",
        password_hash=hashed_password,
        role=resolve_role(data.role),
        department=data.department,
        designation=data.designation,
        division=data.division,
        type=data.type,
        company_id=data.company_id,
        manager_id=data.manager_id,
        is_first_login=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("", response_model=List[UserOut])
def list_users(
    role: str = None,
    department: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(User).filter(User.is_active == True)
    if role:
        q = q.filter(User.role == role)
    if department:
        q = q.filter(User.department == department)
    return q.order_by(User.name).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    return u


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin")),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == "role" and v is not None:
            setattr(u, k, resolve_role(v))
        else:
            setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return u


@router.put("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin", "hr_admin")),
):
    """Admin endpoint to reset a user's password to Welcome@123."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    u.password_hash = hash_password("Welcome@123")
    u.is_first_login = True
    db.commit()
    return {"detail": f"Password reset for {u.email}. New password: Welcome@123"}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    u.is_active = False
    db.commit()
    return {"detail": "Deactivated"}
