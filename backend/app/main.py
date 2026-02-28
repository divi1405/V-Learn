from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.database import engine, Base
from app.routers import auth, users, courses, modules, lessons, quizzes, enrollments, learning_paths, certificates, analytics, leaderboard, badges, reviews, lna, upload, ai, manager, recommendations
from fastapi.staticfiles import StaticFiles
import os

# Create tables
Base.metadata.create_all(bind=engine)

from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN profile_image TEXT"))
except Exception:
    pass

app = FastAPI(title="VeLearn Platform API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(modules.router)
app.include_router(lessons.router)
app.include_router(quizzes.router)
app.include_router(enrollments.router)
app.include_router(learning_paths.router)
app.include_router(certificates.router)
app.include_router(analytics.router)
app.include_router(leaderboard.router)
app.include_router(badges.router)
app.include_router(reviews.router)
app.include_router(lna.router)
app.include_router(upload.router)
app.include_router(ai.router)
app.include_router(manager.router)
app.include_router(recommendations.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "LMS API"}


@app.on_event("startup")
def on_startup():
    from app.seed import seed
    seed()
