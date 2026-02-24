from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, LearningNeedAnalysis
from app.schemas import LNACreate, LNAOut, AdminLNAOut
from app.auth import require_role

router = APIRouter(prefix="/api/lna", tags=["learning-need-analysis"])


@router.post("", response_model=LNAOut)
def submit_lna(data: LNACreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Upsert — replace existing if any
    existing = db.query(LearningNeedAnalysis).filter(LearningNeedAnalysis.user_id == user.id).first()
    if existing:
        existing.current_skill_level = data.current_skill_level
        existing.areas_of_interest = data.areas_of_interest
        existing.learning_goals = data.learning_goals
        existing.preferred_format = data.preferred_format
        existing.weekly_time_commitment = data.weekly_time_commitment
        db.commit()
        db.refresh(existing)
        return existing

    lna = LearningNeedAnalysis(
        user_id=user.id,
        current_skill_level=data.current_skill_level,
        areas_of_interest=data.areas_of_interest,
        learning_goals=data.learning_goals,
        preferred_format=data.preferred_format,
        weekly_time_commitment=data.weekly_time_commitment,
    )
    db.add(lna)
    db.commit()
    db.refresh(lna)
    return lna


@router.get("/me", response_model=LNAOut)
def get_my_lna(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lna = db.query(LearningNeedAnalysis).filter(LearningNeedAnalysis.user_id == user.id).first()
    if not lna:
        raise HTTPException(status_code=404, detail="No learning need analysis found")
    return lna

@router.get("/admin", response_model=list[AdminLNAOut])
def get_all_lnas_admin(db: Session = Depends(get_db), admin_user: User = Depends(require_role("admin", "hr_admin"))):
    lnas = db.query(LearningNeedAnalysis).order_by(LearningNeedAnalysis.submitted_at.desc()).all()
    result = []
    for lna in lnas:
        u = db.query(User).filter(User.id == lna.user_id).first()
        result.append(AdminLNAOut(
            id=lna.id,
            user_id=lna.user_id,
            current_skill_level=lna.current_skill_level,
            areas_of_interest=lna.areas_of_interest,
            learning_goals=lna.learning_goals,
            preferred_format=lna.preferred_format,
            weekly_time_commitment=lna.weekly_time_commitment,
            submitted_at=lna.submitted_at,
            user_name=u.name if u else "Unknown"
        ))
    return result
