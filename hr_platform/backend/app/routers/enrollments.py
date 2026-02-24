from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import (
    Enrollment, EnrollmentStatus, Course, LessonProgress, Lesson, Module, LessonStatus, Notification
)
from app.schemas import EnrollmentCreate, EnrollmentOut, LessonProgressUpdate, LessonProgressOut
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/api/enrollments", tags=["enrollments"])


@router.get("", response_model=List[EnrollmentOut])
def my_enrollments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    enrollments = db.query(Enrollment).options(
        joinedload(Enrollment.course).joinedload(Course.modules).joinedload(Module.lessons)
    ).filter(Enrollment.user_id == user.id).all()
    return enrollments


@router.post("", response_model=EnrollmentOut)
def enroll(data: EnrollmentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == user.id, Enrollment.course_id == data.course_id
    ).first()
    if existing:
        raise HTTPException(400, "Already enrolled")
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    enrollment = Enrollment(user_id=user.id, course_id=data.course_id)
    db.add(enrollment)
    # Send notification
    notif = Notification(
        user_id=user.id,
        type="enrollment",
        message=f"You've been enrolled in '{course.title}'",
    )
    db.add(notif)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.post("/assign")
def assign_course(
    user_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    assigner: User = Depends(get_current_user),
):
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == user_id, Enrollment.course_id == course_id
    ).first()
    if existing:
        raise HTTPException(400, "Already enrolled")
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    enrollment = Enrollment(
        user_id=user_id, course_id=course_id, assigned_by=assigner.id
    )
    db.add(enrollment)
    notif = Notification(
        user_id=user_id,
        type="assignment",
        message=f"You've been assigned '{course.title}' by {assigner.name}",
    )
    db.add(notif)
    db.commit()
    return {"detail": "Assigned"}


@router.post("/lessons/{lesson_id}/progress", response_model=LessonProgressOut)
def update_progress(
    lesson_id: int,
    data: LessonProgressUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    progress = db.query(LessonProgress).filter(
        LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson_id
    ).first()
    if progress:
        progress.status = data.status
        progress.time_spent_secs += data.time_spent_secs
        progress.last_accessed = datetime.utcnow()
    else:
        progress = LessonProgress(
            user_id=user.id,
            lesson_id=lesson_id,
            status=data.status,
            time_spent_secs=data.time_spent_secs,
        )
        db.add(progress)
    db.commit()
    db.refresh(progress)

    # Update enrollment progress
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if lesson:
        module = lesson.module
        course = module.course
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == user.id, Enrollment.course_id == course.id
        ).first()
        if enrollment:
            total_lessons = sum(len(m.lessons) for m in course.modules)
            if total_lessons > 0:
                completed = db.query(LessonProgress).filter(
                    LessonProgress.user_id == user.id,
                    LessonProgress.status == LessonStatus.COMPLETED,
                    LessonProgress.lesson_id.in_([l.id for m in course.modules for l in m.lessons])
                ).count()
                enrollment.progress_pct = round((completed / total_lessons) * 100, 1)
                if enrollment.progress_pct >= 100:
                    enrollment.status = EnrollmentStatus.COMPLETED
                    enrollment.completion_date = datetime.utcnow()
                else:
                    enrollment.status = EnrollmentStatus.IN_PROGRESS
                db.commit()

    return progress


@router.get("/lessons/progress", response_model=List[LessonProgressOut])
def my_progress(
    course_id: int = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(LessonProgress).filter(LessonProgress.user_id == user.id)
    if course_id:
        lesson_ids = [
            l.id for m in db.query(Module).filter(Module.course_id == course_id).all()
            for l in m.lessons
        ]
        q = q.filter(LessonProgress.lesson_id.in_(lesson_ids))
    return q.all()
