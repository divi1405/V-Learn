from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut, PasswordResetRequest
from app.auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")
    user = User(
        name=req.name,
        email=req.email,
        employee_number=req.employee_number,
        password_hash=hash_password(req.password),
        role=req.role,
        department=req.department,
        designation=req.designation,
        division=req.division,
        type=req.type,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user.id, user.role.value if hasattr(user.role, 'value') else user.role)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user.id, user.role.value if hasattr(user.role, 'value') else user.role)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/set-password", response_model=UserOut)
def set_password(req: PasswordResetRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.password_hash = hash_password(req.new_password)
    user.is_first_login = False
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
