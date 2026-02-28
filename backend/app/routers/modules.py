from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Module, Course
from app.schemas import ModuleCreate, ModuleOut
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/api/courses/{course_id}/modules", tags=["modules"])


@router.get("", response_model=List[ModuleOut])
def list_modules(course_id: int, db: Session = Depends(get_db)):
    return db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index).all()


@router.post("", response_model=ModuleOut)
def create_module(
    course_id: int,
    data: ModuleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    m = Module(course_id=course_id, title=data.title, order_index=data.order_index)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{module_id}")
def delete_module(
    course_id: int,
    module_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    m = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not m:
        raise HTTPException(404, "Module not found")
    db.delete(m)
    db.commit()
    return {"detail": "Deleted"}

@router.put("/{module_id}", response_model=ModuleOut)
def update_module(
    course_id: int,
    module_id: int,
    data: __import__('app.schemas').schemas.ModuleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    m = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not m:
        raise HTTPException(404, "Module not found")
        
    if data.title is not None:
        m.title = data.title
    if data.order_index is not None:
        m.order_index = data.order_index
        
    db.commit()
    db.refresh(m)
    return m
