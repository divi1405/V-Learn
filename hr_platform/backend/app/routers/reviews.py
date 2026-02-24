from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import get_current_user
from app.models import User, CourseReview, Course, Enrollment, EnrollmentStatus
from app.schemas import ReviewCreate, ReviewOut, AdminReviewOut
from app.auth import require_role

router = APIRouter(prefix="/api", tags=["reviews"])


@router.post("/courses/{course_id}/reviews", response_model=ReviewOut)
def create_review(course_id: int, data: ReviewCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Check if user completed the course
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id,
        Enrollment.status == EnrollmentStatus.COMPLETED
    ).first()
    if not enrollment:
        raise HTTPException(status_code=400, detail="You must complete the course before reviewing")

    # Check if already reviewed
    existing = db.query(CourseReview).filter(
        CourseReview.user_id == user.id,
        CourseReview.course_id == course_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this course")

    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review = CourseReview(
        user_id=user.id,
        course_id=course_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewOut(
        id=review.id, user_id=review.user_id, course_id=review.course_id,
        rating=review.rating, comment=review.comment, created_at=review.created_at,
        user_name=user.name
    )


@router.get("/courses/{course_id}/reviews", response_model=list[ReviewOut])
def get_course_reviews(course_id: int, db: Session = Depends(get_db)):
    reviews = db.query(CourseReview).filter(CourseReview.course_id == course_id).order_by(CourseReview.created_at.desc()).all()
    result = []
    for r in reviews:
        u = db.query(User).filter(User.id == r.user_id).first()
        result.append(ReviewOut(
            id=r.id, user_id=r.user_id, course_id=r.course_id,
            rating=r.rating, comment=r.comment, created_at=r.created_at,
            user_name=u.name if u else "Unknown"
        ))
    return result

@router.get("/admin/reviews", response_model=list[AdminReviewOut])
def get_all_reviews_admin(db: Session = Depends(get_db), admin_user: User = Depends(require_role("admin", "hr_admin"))):
    reviews = db.query(CourseReview).order_by(CourseReview.created_at.desc()).all()
    result = []
    for r in reviews:
        u = db.query(User).filter(User.id == r.user_id).first()
        c = db.query(Course).filter(Course.id == r.course_id).first()
        result.append(AdminReviewOut(
            id=r.id, user_id=r.user_id, course_id=r.course_id,
            rating=r.rating, comment=r.comment, created_at=r.created_at,
            user_name=u.name if u else "Unknown",
            course_title=c.title if c else "Unknown Course"
        ))
    return result


@router.get("/courses/top-rated")
def get_top_rated_courses(db: Session = Depends(get_db)):
    results = db.query(
        CourseReview.course_id,
        func.avg(CourseReview.rating).label("avg_rating"),
        func.count(CourseReview.id).label("review_count")
    ).group_by(CourseReview.course_id).order_by(func.avg(CourseReview.rating).desc()).all()

    top_courses = []
    for course_id, avg_rating, review_count in results:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            top_courses.append({
                "course_id": course.id,
                "title": course.title,
                "category": course.category,
                "difficulty": course.difficulty,
                "avg_rating": round(float(avg_rating), 1),
                "review_count": review_count,
            })
    return top_courses
