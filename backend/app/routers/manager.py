from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import User, Manager, Enrollment, EnrollmentStatus, Course, LessonProgress, Notification, UserRole
from app.schemas import UserOut, EnrollmentOut, TeamMemberProgress
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/manager", tags=["manager"])


def require_manager(user: User = Depends(get_current_user)):
    """Only MANAGER, ADMIN, HR_ADMIN can access manager endpoints."""
    if user.role not in (UserRole.MANAGER, UserRole.ADMIN, UserRole.HR_ADMIN):
        raise HTTPException(status_code=403, detail="Manager access required")
    return user


@router.get("/my-team", response_model=List[UserOut])
def get_my_team(
    db: Session = Depends(get_db),
    manager: User = Depends(require_manager),
):
    """Return all employees/learners directly under this manager."""
    if manager.role in (UserRole.ADMIN, UserRole.HR_ADMIN):
        # Admins can see all learners
        members = db.query(User).filter(User.role == UserRole.LEARNER).all()
    else:
        mgr_record = db.query(Manager).filter(Manager.user_id == manager.id).first()
        if not mgr_record:
            return []
        members = db.query(User).filter(User.manager_id == mgr_record.id).all()
    return members


@router.get("/team-progress", response_model=List[TeamMemberProgress])
def get_team_progress(
    db: Session = Depends(get_db),
    manager: User = Depends(require_manager),
):
    """Progress tracker for employees under this manager."""
    if manager.role in (UserRole.ADMIN, UserRole.HR_ADMIN):
        members = db.query(User).filter(User.role == UserRole.LEARNER).all()
    else:
        mgr_record = db.query(Manager).filter(Manager.user_id == manager.id).first()
        if not mgr_record:
            return []
        members = db.query(User).filter(User.manager_id == mgr_record.id).all()

    result = []
    for member in members:
        enrollments = db.query(Enrollment).filter(Enrollment.user_id == member.id).all()
        assigned = len(enrollments)
        completed = len([e for e in enrollments if e.status == EnrollmentStatus.COMPLETED])
        last_progress = (
            db.query(LessonProgress)
            .filter(LessonProgress.user_id == member.id)
            .order_by(LessonProgress.last_accessed.desc())
            .first()
        )
        last_active = last_progress.last_accessed if last_progress else None
        pct = round((completed / assigned * 100), 1) if assigned > 0 else 0.0

        result.append(
            TeamMemberProgress(
                user=UserOut.model_validate(member),
                courses_assigned=assigned,
                courses_completed=completed,
                last_active=last_active,
                completion_pct=pct,
            )
        )
    return result


@router.post("/assign-course")
def assign_course_to_employee(
    employee_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(require_manager),
):
    """Manager assigns a course to one of their direct reports."""
    # Validate the employee is under this manager (unless admin)
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    mgr_record = None
    if manager.role == UserRole.MANAGER:
        mgr_record = db.query(Manager).filter(Manager.user_id == manager.id).first()
        if not mgr_record or employee.manager_id != mgr_record.id:
            raise HTTPException(status_code=403, detail="You can only assign courses to your direct reports")

    # Check if already enrolled
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == employee_id,
        Enrollment.course_id == course_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee is already enrolled in this course")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollment = Enrollment(
        user_id=employee_id,
        course_id=course_id,
        assigned_by=manager.id,
    )
    db.add(enrollment)

    notif = Notification(
        user_id=employee_id,
        type="assignment",
        message=f"'{course.title}' has been assigned to you by {manager.name}",
    )
    db.add(notif)
    db.commit()
    return {"detail": "Course assigned successfully"}


@router.delete("/unassign-course")
def unassign_course(
    employee_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(require_manager),
):
    """Remove a course assignment from an employee."""
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    mgr_record = None
    if manager.role == UserRole.MANAGER:
        mgr_record = db.query(Manager).filter(Manager.user_id == manager.id).first()
        if not mgr_record or employee.manager_id != mgr_record.id:
            raise HTTPException(status_code=403, detail="Access denied")

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == employee_id,
        Enrollment.course_id == course_id,
        Enrollment.assigned_by == manager.id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(enrollment)
    db.commit()
    return {"detail": "Assignment removed"}


@router.get("/portco-employees")
def get_portco_employees(
    db: Session = Depends(get_db),
    manager: User = Depends(require_manager),
):
    """Get employees grouped by portco (division). Managers see only their team;
    admins see all employees."""
    if manager.role in (UserRole.ADMIN, UserRole.HR_ADMIN):
        employees = db.query(User).filter(User.role.in_([UserRole.LEARNER, UserRole.MANAGER])).all()
    else:
        mgr_record = db.query(Manager).filter(Manager.user_id == manager.id).first()
        if not mgr_record:
            return {}
        employees = db.query(User).filter(User.manager_id == mgr_record.id).all()

    grouped: dict = {}
    for emp in employees:
        portco = emp.division or "Unassigned"
        if portco not in grouped:
            grouped[portco] = []
        grouped[portco].append(UserOut.model_validate(emp).model_dump())

    return grouped


@router.get("/employee/{employee_id}/enrollments", response_model=List[EnrollmentOut])
def get_employee_enrollments(
    employee_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(require_manager),
):
    """Get enrollments for a specific employee under this manager."""
    from sqlalchemy.orm import joinedload
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if manager.role == UserRole.MANAGER:
        mgr_record = db.query(Manager).filter(Manager.user_id == manager.id).first()
        if not mgr_record or employee.manager_id != mgr_record.id:
            raise HTTPException(status_code=403, detail="Access denied")

    enrollments = (
        db.query(Enrollment)
        .options(joinedload(Enrollment.course))
        .filter(Enrollment.user_id == employee_id)
        .all()
    )
    return enrollments


@router.get("/assigned-courses")
def get_manager_assigned_courses(
    db: Session = Depends(get_db),
    manager: User = Depends(require_manager),
):
    """Get all courses assigned to the manager's team, grouped by course."""
    from sqlalchemy.orm import joinedload
    
    if manager.role in (UserRole.ADMIN, UserRole.HR_ADMIN):
        members = db.query(User).filter(User.role.in_([UserRole.LEARNER, UserRole.MANAGER])).all()
    else:
        mgr_record = db.query(Manager).filter(Manager.user_id == manager.id).first()
        if not mgr_record:
            return []
        members = db.query(User).filter(User.manager_id == mgr_record.id).all()

    member_ids = [m.id for m in members]
    if not member_ids:
        return []

    # Get enrollments for these members that were assigned by someone
    enrollments = (
        db.query(Enrollment)
        .options(joinedload(Enrollment.course), joinedload(Enrollment.user))
        .filter(Enrollment.user_id.in_(member_ids))
        .filter(Enrollment.assigned_by.isnot(None))
        .all()
    )

    grouped = {}
    for e in enrollments:
        if not e.course or not e.user:
            continue
        c_id = e.course.id
        if c_id not in grouped:
            grouped[c_id] = {
                "course": e.course.title,
                "course_id": e.course.id,
                "description": e.course.description,
                "assignments": []
            }
        grouped[c_id]["assignments"].append({
            "user_id": e.user.id,
            "user_name": e.user.name,
            "status": e.status,
            "progress_pct": e.progress_pct,
            "assigned_by": e.assigned_by,
        })
    
    return list(grouped.values())
