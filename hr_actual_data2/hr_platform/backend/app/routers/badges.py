from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Badge, BadgeLevel, Enrollment, EnrollmentStatus
from app.schemas import BadgeOut

router = APIRouter(prefix="/api/badges", tags=["badges"])

BADGE_MILESTONES = [
    (1, BadgeLevel.BRONZE, "Quick Starter", "Completed your first AI course"),
    (3, BadgeLevel.SILVER, "AI Explorer", "Completed 3 AI courses"),
    (5, BadgeLevel.GOLD, "AI Specialist", "Completed 5 AI courses"),
    (6, BadgeLevel.PLATINUM, "AI Master", "Completed all available AI courses"),
]


@router.get("/me", response_model=list[BadgeOut])
def get_my_badges(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Badge).filter(Badge.user_id == user.id).order_by(Badge.earned_at.desc()).all()


@router.get("/all-levels")
def get_all_badge_levels(user: User = Depends(get_current_user)):
    """Return all badge levels with their requirements"""
    return [
        {"level": level.value, "title": title, "description": desc, "courses_required": req}
        for req, level, title, desc in BADGE_MILESTONES
    ]


@router.post("/check", response_model=list[BadgeOut])
def check_and_award_badges(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Check if user qualifies for new badges and award them"""
    completed_count = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.status == EnrollmentStatus.COMPLETED
    ).count()

    existing_badges = db.query(Badge).filter(Badge.user_id == user.id).all()
    existing_levels = {b.level for b in existing_badges}

    newly_awarded = []
    for required, level, title, desc in BADGE_MILESTONES:
        if completed_count >= required and level not in existing_levels:
            badge = Badge(
                user_id=user.id, level=level,
                title=title, description=desc
            )
            db.add(badge)
            newly_awarded.append(badge)

    if newly_awarded:
        db.commit()
        for b in newly_awarded:
            db.refresh(b)

    return newly_awarded
