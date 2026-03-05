from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Quiz, Question, QuizAttempt, Lesson, LessonProgress, LessonStatus, Enrollment, EnrollmentStatus, Module
from app.schemas import QuizCreate, QuizOut, QuizSubmit, QuizAttemptOut
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


@router.post("/lesson/{lesson_id}", response_model=QuizOut)
def create_quiz(
    lesson_id: int,
    data: QuizCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "hr_admin", "content_author")),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    existing = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).first()
    if existing:
        raise HTTPException(400, "Quiz already exists for this lesson")
    quiz = Quiz(lesson_id=lesson_id, pass_threshold=data.pass_threshold, max_attempts=data.max_attempts)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    for q in data.questions:
        question = Question(
            quiz_id=quiz.id,
            question_text=q.question_text,
            type=q.type,
            options=q.options,
            correct_answer=q.correct_answer,
        )
        db.add(question)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizAttemptOut)
def submit_quiz(
    quiz_id: int,
    data: QuizSubmit,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")

    # Attempts cap removed, count is just for record keeping
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id, QuizAttempt.quiz_id == quiz_id
    ).count()

    # Grade
    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(400, "No questions in quiz")

    correct = 0
    for q in questions:
        submitted = data.answers.get(str(q.id))
        if submitted and submitted.strip().lower() == q.correct_answer.strip().lower():
            correct += 1
    score = (correct / len(questions)) * 100
    passed = score >= quiz.pass_threshold

    attempt = QuizAttempt(
        user_id=user.id,
        quiz_id=quiz_id,
        score=score,
        passed=passed,
        attempt_number=attempts + 1,
        answers=data.answers,
    )
    db.add(attempt)

    # Mark lesson complete if passed
    if passed:
        lesson = quiz.lesson
        progress = db.query(LessonProgress).filter(
            LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson.id
        ).first()
        if progress:
            progress.status = LessonStatus.COMPLETED
        else:
            progress = LessonProgress(
                user_id=user.id, lesson_id=lesson.id, status=LessonStatus.COMPLETED
            )
            db.add(progress)
        db.flush()

        # Update enrollment progress
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
                if completed >= total_lessons or enrollment.progress_pct >= 99.9:
                    enrollment.status = EnrollmentStatus.COMPLETED
                    if not enrollment.completion_date:
                        enrollment.completion_date = datetime.utcnow()
                    try:
                        from app.routers.badges import check_and_award_badges_for_user
                        check_and_award_badges_for_user(user.id, db)
                    except Exception:
                        pass
                else:
                    enrollment.status = EnrollmentStatus.IN_PROGRESS

    db.commit()
    db.refresh(attempt)
    return attempt


@router.get("/lesson/{lesson_id}", response_model=QuizOut)
def get_quiz_for_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    quiz = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).first()
    if not quiz:
        raise HTTPException(404, "No quiz for this lesson")
    return quiz


@router.get("/{quiz_id}/attempts", response_model=list[QuizAttemptOut])
def get_attempts(quiz_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id, QuizAttempt.quiz_id == quiz_id
    ).order_by(QuizAttempt.attempt_number).all()
