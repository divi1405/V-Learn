from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "LEARNER"
    employee_number: Optional[str] = None
    designation: Optional[str] = None
    division: Optional[str] = None
    department: Optional[str] = None
    type: Optional[str] = None
    company_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# --- User ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "LEARNER"
    employee_number: Optional[str] = None
    designation: Optional[str] = None
    division: Optional[str] = None
    department: Optional[str] = None
    type: Optional[str] = None
    company_id: Optional[str] = None
    manager_id: Optional[int] = None
class ManagerOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    department: Optional[str] = None
    division: Optional[str] = None
    designation: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    employee_number: Optional[str] = None
    designation: Optional[str] = None
    division: Optional[str] = None
    department: Optional[str] = None
    type: Optional[str] = None
    company_id: Optional[str] = None
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: Optional[bool] = True
    is_first_login: Optional[bool] = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    designation: Optional[str] = None
    division: Optional[str] = None
    department: Optional[str] = None
    type: Optional[str] = None
    manager_id: Optional[int] = None
    profile_image: Optional[str] = None


# --- Course ---
class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    difficulty: str = "beginner"
    duration_mins: int = 0

class CourseOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    author_id: Optional[int] = None
    status: str
    duration_mins: int
    category: Optional[str] = None
    difficulty: Optional[str] = None
    created_at: Optional[datetime] = None
    modules: Optional[List["ModuleOut"]] = []
    enrollment_count: Optional[int] = 0

    class Config:
        from_attributes = True

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration_mins: Optional[int] = None


# --- Module ---
class ModuleCreate(BaseModel):
    title: str
    order_index: int = 0

class ModuleOut(BaseModel):
    id: int
    course_id: int
    title: str
    order_index: int
    lessons: Optional[List["LessonOut"]] = []

    class Config:
        from_attributes = True

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    order_index: Optional[int] = None


# --- Lesson ---
class LessonCreate(BaseModel):
    title: str
    type: str = "article"
    content: Optional[str] = None
    content_url: Optional[str] = None
    duration_mins: int = 5
    order_index: int = 0

class LessonOut(BaseModel):
    id: int
    module_id: int
    title: str
    type: str
    content: Optional[str] = None
    content_url: Optional[str] = None
    duration_mins: int
    order_index: int

    class Config:
        from_attributes = True

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    content: Optional[str] = None
    content_url: Optional[str] = None
    duration_mins: Optional[int] = None
    order_index: Optional[int] = None


# --- Quiz ---
class QuestionCreate(BaseModel):
    question_text: str
    type: str = "mcq"
    options: Any = None
    correct_answer: str

class QuestionOut(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    type: str
    options: Any = None

    class Config:
        from_attributes = True

class QuizCreate(BaseModel):
    pass_threshold: float = 70.0
    max_attempts: int = 3
    questions: List[QuestionCreate] = []

class QuizOut(BaseModel):
    id: int
    lesson_id: int
    pass_threshold: float
    max_attempts: int
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True

class QuizSubmit(BaseModel):
    answers: dict  # {question_id: selected_answer}

class QuizAttemptOut(BaseModel):
    id: int
    quiz_id: int
    score: float
    passed: bool
    attempt_number: int
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Learning Path ---
class LearningPathCreate(BaseModel):
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    target_role: Optional[str] = None
    course_ids: List[int] = []

class PathCourseOut(BaseModel):
    id: int
    course_id: int
    order_index: int
    is_required: bool
    course: Optional[CourseOut] = None

    class Config:
        from_attributes = True

class LearningPathOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    target_role: Optional[str] = None
    courses: List[PathCourseOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StepCheckpointCreate(BaseModel):
    title: str
    type: str = "task"
    is_required: bool = True
    content_url: Optional[str] = None
    content: Optional[str] = None
    order_index: int = 0

class StepCheckpointOut(BaseModel):
    id: int
    step_id: int
    title: str
    type: str
    is_required: bool
    content_url: Optional[str] = None
    content: Optional[str] = None
    order_index: int

    class Config:
        from_attributes = True

class PathStepCreate(BaseModel):
    title: str
    description: Optional[str] = None
    track: Optional[str] = None
    order_index: int = 0

class PathStepOut(BaseModel):
    id: int
    path_id: int
    title: str
    description: Optional[str] = None
    track: Optional[str] = None
    order_index: int
    checkpoints: List[StepCheckpointOut] = []

    class Config:
        from_attributes = True

class UserCheckpointProgressOut(BaseModel):
    id: int
    user_id: int
    checkpoint_id: int
    completed: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Enrollment ---
class EnrollmentCreate(BaseModel):
    course_id: int

class EnrollmentOut(BaseModel):
    id: int
    user_id: int
    course_id: Optional[int] = None
    enrolled_at: Optional[datetime] = None
    status: str
    completion_date: Optional[datetime] = None
    assigned_by: Optional[int] = None
    progress_pct: float = 0.0
    course: Optional[CourseOut] = None

    class Config:
        from_attributes = True

class LessonProgressUpdate(BaseModel):
    status: str = "completed"
    time_spent_secs: int = 0

class LessonProgressOut(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    status: str
    last_accessed: Optional[datetime] = None
    time_spent_secs: int

    class Config:
        from_attributes = True


# --- Certificate ---
class CertificateOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    issued_at: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    credential_id: str
    pdf_path: Optional[str] = None
    course: Optional[CourseOut] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# --- Notification ---
class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: Optional[str] = None
    message: Optional[str] = None
    read: bool
    course_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Analytics ---
class DashboardStats(BaseModel):
    total_users: int = 0
    total_courses: int = 0
    total_enrollments: int = 0
    completion_rate: float = 0.0
    active_learners: int = 0
    certificates_issued: int = 0

class TeamMemberProgress(BaseModel):
    user: UserOut
    courses_assigned: int = 0
    courses_completed: int = 0
    last_active: Optional[datetime] = None
    completion_pct: float = 0.0


# --- Badge ---
class BadgeOut(BaseModel):
    id: int
    user_id: int
    level: str
    title: str
    description: Optional[str] = None
    earned_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Review ---
class ReviewCreate(BaseModel):
    rating: int  # 1-5
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None
    user_name: Optional[str] = None

class AdminReviewOut(ReviewOut):
    course_title: Optional[str] = None

    class Config:
        from_attributes = True


# --- Learning Need Analysis ---
class LNACreate(BaseModel):
    current_skill_level: str
    areas_of_interest: List[str] = []
    learning_goals: str
    preferred_format: str
    weekly_time_commitment: str

class LNAOut(BaseModel):
    id: int
    user_id: int
    current_skill_level: str
    areas_of_interest: Optional[List[str]] = []
    learning_goals: str
    preferred_format: str
    weekly_time_commitment: str
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminLNAOut(LNAOut):
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Leaderboard ---
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    user_name: str
    department: Optional[str] = None
    courses_completed: int = 0
    badges_count: int = 0
    avg_score: float = 0.0
    total_points: int = 0


# Resolve forward references
TokenResponse.model_rebuild()
CourseOut.model_rebuild()
ModuleOut.model_rebuild()
LearningPathOut.model_rebuild()
PathCourseOut.model_rebuild()
EnrollmentOut.model_rebuild()
CertificateOut.model_rebuild()

