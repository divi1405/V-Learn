from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Enrollment, EnrollmentStatus, Badge, QuizAttempt, Certificate
from app.schemas import LeaderboardEntry

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get leaderboard ranked by points (courses completed * 100 + badges * 50 + avg_score)"""
    # Base users
    users = db.query(User).filter(User.role.in_(["learner"])).all()

    entries = []
    for u in users:
        completed = db.query(Enrollment).filter(
            Enrollment.user_id == u.id,
            Enrollment.status == EnrollmentStatus.COMPLETED
        ).count()

        badge_count = db.query(Badge).filter(Badge.user_id == u.id).count()

        avg_score_result = db.query(func.avg(QuizAttempt.score)).filter(
            QuizAttempt.user_id == u.id, QuizAttempt.passed == True
        ).scalar()
        avg_score = round(float(avg_score_result), 1) if avg_score_result else 0.0

        total_points = (completed * 100) + (badge_count * 50) + int(avg_score)

        entries.append(LeaderboardEntry(
            rank=0,
            user_id=u.id,
            user_name=u.name,
            department=u.department,
            courses_completed=completed,
            badges_count=badge_count,
            avg_score=avg_score,
            total_points=total_points,
        ))

    entries.sort(key=lambda x: x.total_points, reverse=True)
    for i, e in enumerate(entries):
        e.rank = i + 1

    return entries
