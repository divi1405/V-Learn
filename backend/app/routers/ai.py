from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/api/ai", tags=["ai"])

class GenerateQuizRequest(BaseModel):
    topic: str
    difficulty: str = "medium"

class MockQuestion(BaseModel):
    question_text: str
    correct_answer: str
    options: List[str]

@router.post("/generate-quiz", response_model=List[MockQuestion])
def generate_quiz(
    data: GenerateQuizRequest,
    user: User = Depends(require_role("admin", "content_author", "hr_admin"))
):
    """
    MOCK AI ENDPOINT
    In reality, this would hit an LLM API (OpenAI/Gemini/Anthropic).
    For now, it returns 3 dynamically scaffolded questions based on the topic.
    """
    topic = data.topic.title()
    return [
        {
            "question_text": f"What is the primary function of {topic}?",
            "correct_answer": "It serves as the core foundation.",
            "options": [
                "It serves as the core foundation.",
                "It is purely decorative.",
                "It replaces all previous databases.",
                "None of the above."
            ]
        },
        {
            "question_text": f"When configuring {topic}, what is the best practice?",
            "correct_answer": "Always secure the endpoints.",
            "options": [
                "Always secure the endpoints.",
                "Leave public access open for testing.",
                "Disable logging to save memory.",
                "Hardcode credentials in the repo."
            ]
        },
        {
            "question_text": f"Which of these is a valid use-case for {topic}?",
            "correct_answer": "Scaling enterprise applications.",
            "options": [
                "Scaling enterprise applications.",
                "Offline text editing.",
                "Creating generic 404 pages.",
                "Managing desktop wallpapers."
            ]
        }
    ]
