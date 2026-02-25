from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models import Course, Module, Lesson, Enrollment, CourseStatus
from app.schemas import CourseCreate, CourseOut, CourseUpdate
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=List[CourseOut])
def list_courses(
    status: str = None,
    category: str = None,
    search: str = None,
    db: Session = Depends(get_db),
):
    q = db.query(Course).options(joinedload(Course.modules).joinedload(Module.lessons))
    if status:
        q = q.filter(Course.status == status)
    else:
        q = q.filter(Course.status == CourseStatus.PUBLISHED)
    if category:
        q = q.filter(Course.category == category)
    if search:
        q = q.filter(Course.title.ilike(f"%{search}%"))
    courses = q.order_by(Course.created_at.desc()).all()
    result = []
    for c in courses:
        out = CourseOut.model_validate(c)
        out.enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        result.append(out)
    return result


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    c = db.query(Course).options(
        joinedload(Course.modules).joinedload(Module.lessons)
    ).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(404, "Course not found")
    out = CourseOut.model_validate(c)
    out.enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
    return out


@router.post("", response_model=CourseOut)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    c = Course(
        title=data.title,
        description=data.description,
        thumbnail=data.thumbnail,
        category=data.category,
        difficulty=data.difficulty,
        duration_mins=data.duration_mins,
        author_id=user.id,
        status=CourseStatus.PUBLISHED,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return CourseOut.model_validate(c)


@router.put("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(404, "Course not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return CourseOut.model_validate(c)


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(404, "Course not found")
    db.delete(c)
    db.commit()
    return {"detail": "Deleted"}
