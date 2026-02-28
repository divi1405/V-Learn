from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    HR_ADMIN = "HR_ADMIN"
    CONTENT_AUTHOR = "CONTENT_AUTHOR"
    LEARNER = "LEARNER"
    MANAGER = "MANAGER"


class CourseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class LessonType(str, enum.Enum):
    VIDEO = "video"
    ARTICLE = "article"
    QUIZ = "quiz"
    PDF = "pdf"


class EnrollmentStatus(str, enum.Enum):
    ENROLLED = "enrolled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DROPPED = "dropped"


class LessonStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class Manager(Base):
    __tablename__ = "managers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(255), nullable=False)
    department = Column(String(100))
    division = Column(String(255))
    designation = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    direct_reports = relationship("User", back_populates="manager", foreign_keys="[User.manager_id]")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    employee_number = Column(String(100), unique=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.LEARNER, nullable=False)
    designation = Column(String(255))
    division = Column(String(255))
    department = Column(String(100))
    type = Column(String(100))
    manager_id = Column(Integer, ForeignKey("managers.id"))
    is_first_login = Column(Boolean, default=True)
    profile_image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    manager = relationship("Manager", back_populates="direct_reports", foreign_keys=[manager_id])
    enrollments = relationship("Enrollment", foreign_keys="[Enrollment.user_id]", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

    @property
    def manager_name(self):
        return self.manager.name if self.manager else None


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    thumbnail = Column(String(500))
    author_id = Column(Integer, ForeignKey("users.id"))
    status = Column(SAEnum(CourseStatus), default=CourseStatus.DRAFT)
    duration_mins = Column(Integer, default=0)
    category = Column(String(100))
    difficulty = Column(String(50), default="beginner")
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User")
    modules = relationship("Module", back_populates="course", order_by="Module.order_index")
    enrollments = relationship("Enrollment", back_populates="course")
    skills = relationship("CourseSkill", back_populates="course")


class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String(500), nullable=False)
    order_index = Column(Integer, default=0)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.order_index")


class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"))
    title = Column(String(500), nullable=False)
    type = Column(SAEnum(LessonType), default=LessonType.ARTICLE)
    content = Column(Text)
    content_url = Column(String(500))
    duration_mins = Column(Integer, default=5)
    order_index = Column(Integer, default=0)

    module = relationship("Module", back_populates="lessons")
    quiz = relationship("Quiz", back_populates="lesson", uselist=False)
    progress = relationship("LessonProgress", back_populates="lesson")


class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), unique=True)
    pass_threshold = Column(Float, default=70.0)
    max_attempts = Column(Integer, default=3)

    lesson = relationship("Lesson", back_populates="quiz")
    questions = relationship("Question", back_populates="quiz")


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    question_text = Column(Text, nullable=False)
    type = Column(String(50), default="mcq")
    options = Column(JSON)
    correct_answer = Column(String(255), nullable=False)

    quiz = relationship("Quiz", back_populates="questions")


class LearningPath(Base):
    __tablename__ = "learning_paths"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    department = Column(String(100))
    target_role = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    courses = relationship("PathCourse", back_populates="path", order_by="PathCourse.order_index")


class PathCourse(Base):
    __tablename__ = "path_courses"
    id = Column(Integer, primary_key=True, index=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    order_index = Column(Integer, default=0)
    is_required = Column(Boolean, default=True)

    path = relationship("LearningPath", back_populates="courses")
    course = relationship("Course")


class PathStep(Base):
    __tablename__ = "path_steps"
    id = Column(Integer, primary_key=True, index=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"))
    title = Column(String(500), nullable=False)
    description = Column(Text)
    track = Column(String(100), nullable=True)  # e.g., 'tech', 'finance', 'operations'. Null means core/universal.
    order_index = Column(Integer, default=0)

    path = relationship("LearningPath")
    checkpoints = relationship("StepCheckpoint", back_populates="step", order_by="StepCheckpoint.order_index", cascade="all, delete-orphan")


class StepCheckpoint(Base):
    __tablename__ = "step_checkpoints"
    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("path_steps.id", ondelete="CASCADE"))
    title = Column(String(500), nullable=False)
    type = Column(String(50), default="task")  # 'video', 'quiz', 'article', 'task'
    is_required = Column(Boolean, default=True)
    content_url = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    step = relationship("PathStep", back_populates="checkpoints")


class UserCheckpointProgress(Base):
    __tablename__ = "user_checkpoint_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    checkpoint_id = Column(Integer, ForeignKey("step_checkpoints.id", ondelete="CASCADE"))
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User")
    checkpoint = relationship("StepCheckpoint")


class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    status = Column(SAEnum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED)
    completion_date = Column(DateTime, nullable=True)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    progress_pct = Column(Float, default=0.0)

    user = relationship("User", foreign_keys=[user_id], back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    assigner = relationship("User", foreign_keys=[assigned_by])


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    status = Column(SAEnum(LessonStatus), default=LessonStatus.NOT_STARTED)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    time_spent_secs = Column(Integer, default=0)

    user = relationship("User")
    lesson = relationship("Lesson", back_populates="progress")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    attempt_number = Column(Integer, default=1)
    answers = Column(JSON)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    quiz = relationship("Quiz")


class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    issued_at = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    credential_id = Column(String(100), unique=True)
    pdf_path = Column(String(500))

    user = relationship("User", back_populates="certificates")
    course = relationship("Course")


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(100))
    level = Column(String(50))


class CourseSkill(Base):
    __tablename__ = "course_skills"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    skill_id = Column(Integer, ForeignKey("skills.id"))

    course = relationship("Course", back_populates="skills")
    skill = relationship("Skill")


class UserSkill(Base):
    __tablename__ = "user_skills"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    source = Column(String(50), default="earned")

    user = relationship("User")
    skill = relationship("Skill")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String(50))
    message = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class BadgeLevel(str, enum.Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    level = Column(SAEnum(BadgeLevel), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    earned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class CourseReview(Base):
    __tablename__ = "course_reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    course = relationship("Course")


class LearningNeedAnalysis(Base):
    __tablename__ = "learning_need_analyses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    current_skill_level = Column(String(50))
    areas_of_interest = Column(JSON)
    learning_goals = Column(Text)
    preferred_format = Column(String(50))
    weekly_time_commitment = Column(String(50))
    submitted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

