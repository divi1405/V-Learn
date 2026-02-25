from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Lesson, Module
from app.schemas import LessonCreate, LessonOut
from app.auth import require_role
from app.models import User

router = APIRouter(prefix="/api/modules/{module_id}/lessons", tags=["lessons"])


@router.get("", response_model=List[LessonOut])
def list_lessons(module_id: int, db: Session = Depends(get_db)):
    return db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.order_index).all()


@router.post("", response_model=LessonOut)
def create_lesson(
    module_id: int,
    data: LessonCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    mod = db.query(Module).filter(Module.id == module_id).first()
    if not mod:
        raise HTTPException(404, "Module not found")
    lesson = Lesson(
        module_id=module_id,
        title=data.title,
        type=data.type,
        content=data.content,
        content_url=data.content_url,
        duration_mins=data.duration_mins,
        order_index=data.order_index,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}")
def delete_lesson(
    module_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.module_id == module_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    db.delete(lesson)
    db.commit()
    return {"detail": "Deleted"}

@router.put("/{lesson_id}", response_model=LessonOut)
def update_lesson(
    module_id: int,
    lesson_id: int,
    data: __import__('app.schemas').schemas.LessonUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.module_id == module_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
        
    if data.title is not None:
        lesson.title = data.title
    if data.type is not None:
        lesson.type = data.type
    if data.content is not None:
        lesson.content = data.content
    if data.content_url is not None:
        lesson.content_url = data.content_url
    if data.duration_mins is not None:
        lesson.duration_mins = data.duration_mins
    if data.order_index is not None:
        lesson.order_index = data.order_index
        
    db.commit()
    db.refresh(lesson)
    return lesson
