from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User
from app.schemas import UserOut, UserUpdate, UserCreate
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/users", tags=["users"])


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

    from app.auth import hash_password
    hashed_password = hash_password(data.password)

    new_user = User(
        name=data.name,
        email=data.email,
        employee_number=data.employee_number,
        password_hash=hashed_password,
        role=data.role,
        department=data.department,
        designation=data.designation,
        division=data.division,
        type=data.type,
        manager_id=data.manager_id
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
    q = db.query(User)
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
        setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return u


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    db.delete(u)
    db.commit()
    return {"detail": "Deleted"}
