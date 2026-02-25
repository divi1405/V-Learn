from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Course, Enrollment, CourseStatus
from app.schemas import CourseOut
from app.auth import get_current_user
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# Department/role → course categories mapping
TECH_KEYWORDS = [
    "engineer", "developer", "software", "devops", "data", "ml", "ai", "tech",
    "architect", "qa", "sre", "cloud", "backend", "frontend", "fullstack",
    "security", "infrastructure", "analyst", "scientist", "research"
]

DEPARTMENT_CATEGORY_MAP = {
    "finance": ["Finance", "Financial Management", "Accounting", "Excel & Data"],
    "human resources": ["HR", "Human Resources", "People Management", "Recruitment", "Compliance"],
    "hr": ["HR", "Human Resources", "People Management", "Recruitment", "Compliance"],
    "marketing": ["Marketing", "Digital Marketing", "Analytics", "Content Strategy", "Branding"],
    "sales": ["Sales", "CRM", "Negotiation", "Customer Success", "Presentation Skills"],
    "operations": ["Operations", "Project Management", "Process Improvement", "Supply Chain"],
    "legal": ["Legal", "Compliance", "Risk Management", "Contract Management"],
    "customer support": ["Customer Success", "Communication", "CRM", "Support"],
    "product": ["Product Management", "Agile", "UX Research", "Roadmapping"],
    "design": ["Design", "UX/UI", "Figma", "Prototyping", "User Research"],
    "engineering": ["AI Programming", "AI Fundamentals", "Machine Learning", "Deep Learning",
                    "NLP", "Generative AI", "Cloud Computing", "DevOps"],
    "data science": ["Machine Learning", "Deep Learning", "Data Science", "AI Programming",
                     "NLP", "AI Fundamentals"],
    "it": ["AI Fundamentals", "AI Programming", "Cloud Computing", "Cybersecurity", "DevOps"],
}

# Tech-related designations → get tech/AI courses
TECH_DESIGNATIONS = TECH_KEYWORDS

# Non-tech departments (used to exclude AI-only courses)
NON_TECH_DEPARTMENTS = {
    "finance", "human resources", "hr", "marketing", "sales", "legal",
    "customer support", "operations"
}

# All AI/tech categories
AI_TECH_CATEGORIES = {
    "AI Fundamentals", "AI Programming", "Machine Learning", "Deep Learning",
    "NLP", "Generative AI", "Cloud Computing", "DevOps", "Cybersecurity",
    "Data Science"
}


def is_tech_user(user: User) -> bool:
    """Returns True if the user is considered tech/AI track."""
    dept = (user.department or "").lower()
    designation = (user.designation or "").lower()
    for kw in TECH_KEYWORDS:
        if kw in designation or kw in dept:
            return True
    return False


def get_recommended_categories(user: User) -> list:
    """Returns list of course categories relevant to this user."""
    dept = (user.department or "").lower()

    # Check department map
    for dept_key, categories in DEPARTMENT_CATEGORY_MAP.items():
        if dept_key in dept:
            return categories

    # Fallback: tech users get AI/tech categories
    if is_tech_user(user):
        return list(AI_TECH_CATEGORIES)

    # Default: AI Fundamentals for everyone
    return ["AI Fundamentals"]


@router.get("", response_model=List[CourseOut])
def get_recommendations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Returns personalized course recommendations based on role/department."""
    # Get courses user is already enrolled in
    enrolled_course_ids = {
        e.course_id for e in db.query(Enrollment).filter(Enrollment.user_id == user.id).all()
    }

    user_is_tech = is_tech_user(user)
    recommended_categories = get_recommended_categories(user)

    # Base query: published courses not yet enrolled
    q = db.query(Course).options(
        joinedload(Course.modules)
    ).filter(Course.status == CourseStatus.PUBLISHED)

    if enrolled_course_ids:
        q = q.filter(~Course.id.in_(enrolled_course_ids))

    all_published = q.all()

    # Filter by relevant categories
    dept = (user.department or "").lower()
    is_non_tech = any(key in dept for key in NON_TECH_DEPARTMENTS)

    recommended = []
    other_courses = []

    for course in all_published:
        cat = course.category or ""
        # Prioritize courses matching user's categories
        cat_lower = cat.lower()
        match = any(rc.lower() in cat_lower or cat_lower in rc.lower()
                    for rc in recommended_categories)

        if match:
            # Non-tech users: skip pure AI/tech courses only if better options exist
            if is_non_tech and cat in AI_TECH_CATEGORIES and len(recommended) >= 3:
                other_courses.append(course)
            else:
                recommended.append(course)
        else:
            other_courses.append(course)

    # If we have fewer than 3 recommendations, add some general ones
    if len(recommended) < 3:
        # Add AI Fundamentals for everyone (it's always useful)
        for course in other_courses:
            if course.category == "AI Fundamentals" and course not in recommended:
                recommended.append(course)
                break

    # Fill up to 6 with other courses
    for c in other_courses:
        if c not in recommended and len(recommended) < 6:
            recommended.append(c)

    result = []
    for c in recommended[:6]:
        out = CourseOut.model_validate(c)
        out.enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        result.append(out)

    return result
