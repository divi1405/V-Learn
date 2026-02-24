from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import LearningPath, PathCourse, Course, Enrollment, PathStep, StepCheckpoint, UserCheckpointProgress
from app.schemas import LearningPathCreate, LearningPathOut
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/api/learning-paths", tags=["learning_paths"])


@router.get("/recommended", response_model=List[LearningPathOut])
def get_recommended_paths(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(LearningPath).options(
        joinedload(LearningPath.courses).joinedload(PathCourse.course)
    )
    if user.department:
        q = q.filter(or_(LearningPath.department == user.department, LearningPath.department == None))
    return q.all()


@router.get("", response_model=List[LearningPathOut])
def list_paths(db: Session = Depends(get_db)):
    return db.query(LearningPath).options(
        joinedload(LearningPath.courses).joinedload(PathCourse.course)
    ).all()


@router.get("/{path_id}", response_model=LearningPathOut)
def get_path(path_id: int, db: Session = Depends(get_db)):
    p = db.query(LearningPath).options(
        joinedload(LearningPath.courses).joinedload(PathCourse.course)
    ).filter(LearningPath.id == path_id).first()
    if not p:
        raise HTTPException(404, "Path not found")
    return p


@router.get("/{path_id}/map")
def get_path_map(path_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not path:
        raise HTTPException(404, "Path not found")
        
    steps_query = db.query(PathStep).filter(
        PathStep.path_id == path_id,
        or_(PathStep.track == None, PathStep.track == user.department)
    ).order_by(PathStep.order_index).all()
    
    user_progress = {
        up.checkpoint_id: up 
        for up in db.query(UserCheckpointProgress).filter(UserCheckpointProgress.user_id == user.id).all()
    }
    
    result_steps = []
    path_locked = False
    
    for step in steps_query:
        checkpoints_data = []
        step_completed = True
        
        step_checkpoints = db.query(StepCheckpoint).filter(StepCheckpoint.step_id == step.id).order_by(StepCheckpoint.order_index).all()
        
        if not step_checkpoints:
            step_completed = False # Empty step is not completed

        for cp in step_checkpoints:
            up = user_progress.get(cp.id)
            is_completed = up.completed if up else False
            if cp.is_required and not is_completed:
                step_completed = False
            checkpoints_data.append({
                "id": cp.id,
                "title": cp.title,
                "type": cp.type,
                "is_required": cp.is_required,
                "content_url": cp.content_url,
                "content": cp.content,
                "completed": is_completed,
                "completed_at": up.completed_at if up else None
            })
            
        step_status = "locked" if path_locked else ("completed" if step_completed else "available")
        
        if not step_completed:
            path_locked = True
            
        result_steps.append({
            "id": step.id,
            "title": step.title,
            "description": step.description,
            "track": step.track,
            "order_index": step.order_index,
            "status": step_status,
            "checkpoints": checkpoints_data
        })
        
    return {
        "path_id": path.id,
        "name": path.name,
        "description": path.description,
        "steps": result_steps
    }


class CompleteRequest(BaseModel):
    completed: bool = True

@router.post("/{path_id}/checkpoints/{check_id}/complete")
def complete_checkpoint(
    path_id: int, 
    check_id: int, 
    data: CompleteRequest,
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    cp = db.query(StepCheckpoint).filter(StepCheckpoint.id == check_id).first()
    if not cp:
        raise HTTPException(404, "Checkpoint not found")
        
    up = db.query(UserCheckpointProgress).filter(
        UserCheckpointProgress.user_id == user.id,
        UserCheckpointProgress.checkpoint_id == check_id
    ).first()
    
    if not up:
        up = UserCheckpointProgress(user_id=user.id, checkpoint_id=check_id)
        db.add(up)
        
    up.completed = data.completed
    up.completed_at = datetime.utcnow() if data.completed else None
    
    db.commit()
    return {"detail": "Progress updated", "completed": up.completed}


@router.post("", response_model=LearningPathOut)
def create_path(
    data: LearningPathCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin")),
):
    path = LearningPath(
        name=data.name,
        description=data.description,
        department=data.department,
        target_role=data.target_role,
    )
    db.add(path)
    db.commit()
    db.refresh(path)
    for i, cid in enumerate(data.course_ids):
        pc = PathCourse(path_id=path.id, course_id=cid, order_index=i)
        db.add(pc)
    db.commit()
    db.refresh(path)
    return path


@router.post("/{path_id}/assign/{user_id}")
def assign_path(
    path_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    assigner: User = Depends(require_role("admin", "hr_admin")),
):
    path = db.query(LearningPath).options(
        joinedload(LearningPath.courses)
    ).filter(LearningPath.id == path_id).first()
    if not path:
        raise HTTPException(404, "Path not found")
    assigned = 0
    for pc in path.courses:
        existing = db.query(Enrollment).filter(
            Enrollment.user_id == user_id, Enrollment.course_id == pc.course_id
        ).first()
        if not existing:
            enrollment = Enrollment(
                user_id=user_id, course_id=pc.course_id, assigned_by=assigner.id
            )
            db.add(enrollment)
            assigned += 1
    db.commit()
    return {"detail": f"Assigned {assigned} courses from path"}


@router.delete("/{path_id}")
def delete_path(
    path_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    p = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not p:
        raise HTTPException(404, "Path not found")
    db.delete(p)
    db.commit()
    return {"detail": "Deleted"}
