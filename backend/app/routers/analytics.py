from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models import (
    User, Course, Enrollment, EnrollmentStatus, Certificate,
    LessonProgress, Notification, UserRole
)
from app.schemas import DashboardStats, TeamMemberProgress, NotificationOut, UserOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard-stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total_users = db.query(User).count()
    total_courses = db.query(Course).count()
    total_enrollments = db.query(Enrollment).count()
    completed = db.query(Enrollment).filter(Enrollment.status == EnrollmentStatus.COMPLETED).count()
    completion_rate = (completed / total_enrollments * 100) if total_enrollments > 0 else 0
    thirty_days = datetime.utcnow() - timedelta(days=30)
    active_learners = db.query(func.count(func.distinct(LessonProgress.user_id))).filter(
        LessonProgress.last_accessed >= thirty_days
    ).scalar() or 0
    certs = db.query(Certificate).count()
    return DashboardStats(
        total_users=total_users,
        total_courses=total_courses,
        total_enrollments=total_enrollments,
        completion_rate=round(completion_rate, 1),
        active_learners=active_learners,
        certificates_issued=certs,
    )


@router.get("/team-progress", response_model=List[TeamMemberProgress])
def team_progress(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role in (UserRole.ADMIN, UserRole.HR_ADMIN):
        members = db.query(User).filter(User.role == UserRole.LEARNER).all()
    else:
        members = [user]

    result = []
    for member in members:
        enrollments = db.query(Enrollment).filter(Enrollment.user_id == member.id).all()
        assigned = len(enrollments)
        completed = len([e for e in enrollments if e.status == EnrollmentStatus.COMPLETED])
        last_progress = db.query(LessonProgress).filter(
            LessonProgress.user_id == member.id
        ).order_by(LessonProgress.last_accessed.desc()).first()
        last_active = last_progress.last_accessed if last_progress else None
        pct = (completed / assigned * 100) if assigned > 0 else 0

        result.append(TeamMemberProgress(
            user=UserOut.model_validate(member),
            courses_assigned=assigned,
            courses_completed=completed,
            last_active=last_active,
            completion_pct=round(pct, 1),
        ))
    return result


@router.get("/notifications", response_model=List[NotificationOut])
def my_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Notification).filter(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()


@router.post("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if not n:
        raise HTTPException(404, "Not found")
    n.read = True
    db.commit()
    return {"detail": "Marked read"}


@router.get("/department-stats")
def department_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    departments = db.query(User.department, func.count(User.id)).filter(
        User.department.isnot(None)
    ).group_by(User.department).all()

    result = []
    for dept, count in departments:
        dept_users = db.query(User.id).filter(User.department == dept).subquery()
        enrolled = db.query(Enrollment).filter(Enrollment.user_id.in_(dept_users)).count()
        completed = db.query(Enrollment).filter(
            Enrollment.user_id.in_(dept_users),
            Enrollment.status == EnrollmentStatus.COMPLETED
        ).count()
        result.append({
            "department": dept,
            "user_count": count,
            "enrollments": enrolled,
            "completions": completed,
            "completion_rate": round((completed / enrolled * 100) if enrolled > 0 else 0, 1)
        })
    return result
