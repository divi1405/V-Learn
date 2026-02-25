from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Quiz, Question, QuizAttempt, Lesson, LessonProgress, LessonStatus
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

    # Check attempt count
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id, QuizAttempt.quiz_id == quiz_id
    ).count()
    if attempts >= quiz.max_attempts:
        raise HTTPException(400, f"Maximum attempts ({quiz.max_attempts}) reached")

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

    db.commit()
    db.refresh(attempt)
    return attempt


@router.get("/{quiz_id}/attempts", response_model=list[QuizAttemptOut])
def get_attempts(quiz_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id, QuizAttempt.quiz_id == quiz_id
    ).order_by(QuizAttempt.attempt_number).all()
