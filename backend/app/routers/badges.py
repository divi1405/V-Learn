from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Badge, BadgeLevel, Enrollment, EnrollmentStatus, Course
from app.schemas import BadgeOut

router = APIRouter(prefix="/api/badges", tags=["badges"])

# Updated thresholds: Bronze=1, Silver=5, Gold=10, Platinum=all courses
FIXED_MILESTONES = [
    (1, BadgeLevel.BRONZE, "Quick Starter", "Completed your first AI course"),
    (5, BadgeLevel.SILVER, "AI Explorer", "Completed 5 AI courses"),
    (10, BadgeLevel.GOLD, "AI Specialist", "Completed 10 AI courses"),
]


def get_badge_milestones(db: Session):
    """Return all badge milestones including dynamic Platinum threshold."""
    total_courses = db.query(Course).count()
    platinum = (max(total_courses, 1), BadgeLevel.PLATINUM, "AI Master", "Completed all available AI courses")
    return FIXED_MILESTONES + [platinum]


def check_and_award_badges_for_user(user_id: int, db: Session):
    """Core logic: check completed courses, award any newly earned badges. Returns newly awarded badges."""
    from app.models import Badge, BadgeLevel, Enrollment, EnrollmentStatus

    completed_count = db.query(Enrollment).filter(
        Enrollment.user_id == user_id,
        Enrollment.status == EnrollmentStatus.COMPLETED
    ).count()

    existing_badges = db.query(Badge).filter(Badge.user_id == user_id).all()
    existing_levels = {b.level for b in existing_badges}

    milestones = get_badge_milestones(db)
    newly_awarded = []
    for required, level, title, desc in milestones:
        if completed_count >= required and level not in existing_levels:
            badge = Badge(
                user_id=user_id, level=level,
                title=title, description=desc
            )
            db.add(badge)
            newly_awarded.append(badge)

    if newly_awarded:
        db.commit()
        for b in newly_awarded:
            db.refresh(b)

    return newly_awarded


@router.get("", response_model=list[BadgeOut])
def get_badges(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Root endpoint: return all badges for the current user."""
    return db.query(Badge).filter(Badge.user_id == user.id).order_by(Badge.earned_at.desc()).all()


@router.get("/me", response_model=list[BadgeOut])
def get_my_badges(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Badge).filter(Badge.user_id == user.id).order_by(Badge.earned_at.desc()).all()


@router.get("/all-levels")
def get_all_badge_levels(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Return all badge levels with their requirements"""
    milestones = get_badge_milestones(db)
    return [
        {"level": level.value, "title": title, "description": desc, "courses_required": req}
        for req, level, title, desc in milestones
    ]


@router.post("/check", response_model=list[BadgeOut])
def check_and_award_badges(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Check if user qualifies for new badges and award them"""
    return check_and_award_badges_for_user(user.id, db)
