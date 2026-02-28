# backend/app/import_excel_to_courses.py

import re
from datetime import datetime
from typing import Optional, Tuple

import pandas as pd
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Course, Module, Lesson, LessonType, LearningPath, PathCourse

EXCEL_PATH = "/app/AI_Adoption_LnD_Resources_v4.xlsx"

# If True, create a Learning Path per sheet and add all section-courses to it.
CREATE_LEARNING_PATHS = False

# The sheets in your Excel (edit if names differ)
SHEETS = [
    "All_(Generic)",
    "Engineers",
    "Financial_Services",
    "HR",
    "Ops_&_Admin",
]

YOUTUBE_RE = re.compile(r"(youtube\.com|youtu\.be)", re.IGNORECASE)

def clean(x) -> str:
    if x is None:
        return ""
    return re.sub(r"\s+", " ", str(x).strip())

def normalize_role(sheet_name: str) -> str:
    # Pretty labels for your role-based “category”
    return (
        sheet_name.replace("_", " ")
        .replace("(Generic)", "Generic")
        .replace("Ops & Admin", "Ops & Admin")
        .strip()
    )

def is_section_row(a: str, b: str, c: str) -> bool:
    # Section rows in your Excel usually have a title in col A and empty B/C
    return bool(a) and not b and not c

def normalize_section_title(s: str) -> str:
    # Remove emojis / leading symbols, keep readable title
    s = clean(s)
    s = re.sub(r"^[^\wA-Za-z0-9]+", "", s).strip()
    return s or "Resources"

def looks_like_header_row(a: str, b: str) -> bool:
    # Skip header rows like "Tool Name | Link | Primary Use"
    a_l = a.lower()
    b_l = b.lower()
    return ("name" in a_l and "link" in b_l)

def infer_lesson_type(url: str) -> LessonType:
    return LessonType.VIDEO if YOUTUBE_RE.search(url or "") else LessonType.ARTICLE

def upsert_learning_path(db: Session, role_label: str) -> LearningPath:
    title = f"AI Adoption Resources — {role_label}"
    lp = db.query(LearningPath).filter(LearningPath.title == title).first()
    if lp:
        return lp
    lp = LearningPath(
        title=title,
        description=f"Imported from Excel for {role_label}.",
        department=role_label,
        created_at=datetime.utcnow(),
    )
    db.add(lp)
    db.flush()
    return lp

def upsert_course(db: Session, title: str, description: str, category: str, author_id: int = 1) -> Course:
    c = db.query(Course).filter(Course.title == title).first()
    if c:
        # keep it updated
        c.description = description or c.description
        c.category = category or c.category
        c.status = "PUBLISHED"
        return c

    c = Course(
        title=title,
        description=description,
        thumbnail=None,
        author_id=author_id,
        status="PUBLISHED",
        duration_mins=60,            # default, lesson durations vary
        category=category,
        difficulty="beginner",
        created_at=datetime.utcnow(),
    )
    db.add(c)
    db.flush()
    return c

def get_or_create_module(db: Session, course_id: int) -> Module:
    m = db.query(Module).filter(Module.course_id == course_id, Module.title == "Resources").first()
    if m:
        return m
    m = Module(course_id=course_id, title="Resources", order_index=0)
    db.add(m)
    db.flush()
    return m

def upsert_lesson(
    db: Session,
    module_id: int,
    title: str,
    url: str,
    description: str,
    order_index: int,
):
    title = clean(title)
    url = clean(url)
    description = clean(description)

    if not title:
        return

    existing = db.query(Lesson).filter(Lesson.module_id == module_id, Lesson.title == title).first()
    ltype = infer_lesson_type(url)

    # store link in content for ARTICLE pages too
    content = description
    if url:
        content = (content + "\n\n" if content else "") + f"Link: {url}"

    if existing:
        # update missing fields
        if url and not existing.content_url:
            existing.content_url = url
        if content and (not existing.content or existing.content.strip() == ""):
            existing.content = content
        existing.type = ltype
        return

    lesson = Lesson(
        module_id=module_id,
        title=title,
        type=ltype,                 # VIDEO or ARTICLE
        content=content,
        content_url=url if url else None,
        duration_mins=15,
        order_index=order_index,
    )
    db.add(lesson)

def import_sheet(db: Session, sheet_name: str):
    df = pd.read_excel(EXCEL_PATH, sheet_name=sheet_name, engine="openpyxl")

    # We only care about first 3 columns: name/title, link, description
    cols = list(df.columns)
    if len(cols) < 3:
        raise ValueError(f"Sheet '{sheet_name}' must have at least 3 columns. Found: {cols}")

    a_col, b_col, c_col = cols[0], cols[1], cols[2]
    rows = df[[a_col, b_col, c_col]].fillna("")

    role_label = normalize_role(sheet_name)

    lp = upsert_learning_path(db, role_label) if CREATE_LEARNING_PATHS else None

    current_section: Optional[str] = None
    current_course: Optional[Course] = None
    current_module: Optional[Module] = None
    lesson_idx = 0
    course_order = 0

    for a, b, c in rows.itertuples(index=False, name=None):
        a_txt, b_txt, c_txt = clean(a), clean(b), clean(c)

        if not a_txt and not b_txt and not c_txt:
            continue

        # Skip header row patterns
        if looks_like_header_row(a_txt, b_txt):
            continue

        # New section => new course
        if is_section_row(a_txt, b_txt, c_txt):
            section = normalize_section_title(a_txt)
            current_section = section

            course_title = f"{section} — {role_label}"
            course_desc = f"Imported from Excel sheet '{sheet_name}' section '{section}'."

            current_course = upsert_course(db, course_title, course_desc, category=role_label, author_id=1)
            current_module = get_or_create_module(db, current_course.id)
            lesson_idx = 0

            # Attach to learning path
            if lp:
                exists = db.query(PathCourse).filter(
                    PathCourse.path_id == lp.id,
                    PathCourse.course_id == current_course.id,
                ).first()
                if not exists:
                    db.add(PathCourse(path_id=lp.id, course_id=current_course.id, order_index=course_order))
                    course_order += 1

            continue

        # If no section header was found before data rows, create fallback course
        if not current_course:
            section = "General Resources"
            course_title = f"{section} — {role_label}"
            current_course = upsert_course(db, course_title, f"Imported from Excel sheet '{sheet_name}'.", category=role_label, author_id=1)
            current_module = get_or_create_module(db, current_course.id)
            lesson_idx = 0

        # normal resource row => lesson
        upsert_lesson(
            db=db,
            module_id=current_module.id,
            title=a_txt,
            url=b_txt,
            description=c_txt,
            order_index=lesson_idx,
        )
        lesson_idx += 1

def main():
    db = SessionLocal()
    try:
        for sheet in SHEETS:
            import_sheet(db, sheet)
        db.commit()
        print("✅ Import complete: courses/modules/lessons created from Excel.")
    except Exception as e:
        db.rollback()
        print("❌ Import failed:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()