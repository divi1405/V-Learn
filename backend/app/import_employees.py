import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import (
    User, Enrollment, LessonProgress, QuizAttempt, Certificate, 
    UserSkill, Notification, CourseReview, LearningNeedAnalysis, 
    UserCheckpointProgress, Badge, UserRole
)
from app.auth import hash_password
from datetime import datetime
import os

# Config flags
KEEP_ADMIN = True
EXPORT_FILE = "/app/export.xlsx"
VELEARN_DB_FILE = "/app/velearn.xlsx"

DEFAULT_PASSWORD_HASH = hash_password("Welcome@123")


def normalize_role(role_raw):
    if not role_raw or (isinstance(role_raw, float) and pd.isna(role_raw)):
        return UserRole.LEARNER
    role = str(role_raw).upper().strip()
    if role in ["ADMIN", "HR_ADMIN", "MANAGER", "CONTENT_AUTHOR", "LEARNER"]:
        return getattr(UserRole, role)
    return UserRole.LEARNER


def clean_val(val):
    if val is None:
        return None
    if isinstance(val, float) and pd.isna(val):
        return None
    s = str(val).strip()
    return s if s and s.lower() != 'nan' else None


def delete_non_admin_users(db: Session):
    print("--- Cleaning up non-admin users ---")
    query = db.query(User)
    if KEEP_ADMIN:
        query = query.filter(User.role != UserRole.ADMIN)
    users_to_delete = query.all()

    for user in users_to_delete:
        uid = user.id
        db.query(Enrollment).filter(Enrollment.user_id == uid).delete()
        db.query(LessonProgress).filter(LessonProgress.user_id == uid).delete()
        db.query(QuizAttempt).filter(QuizAttempt.user_id == uid).delete()
        db.query(Certificate).filter(Certificate.user_id == uid).delete()
        db.query(UserSkill).filter(UserSkill.user_id == uid).delete()
        db.query(Notification).filter(Notification.user_id == uid).delete()
        db.query(CourseReview).filter(CourseReview.user_id == uid).delete()
        db.query(LearningNeedAnalysis).filter(LearningNeedAnalysis.user_id == uid).delete()
        db.query(UserCheckpointProgress).filter(UserCheckpointProgress.user_id == uid).delete()
        db.query(Badge).filter(Badge.user_id == uid).delete()
        db.delete(user)

    db.commit()
    print(f"--- Cleanup complete ({len(users_to_delete)} users removed) ---")


def import_data(db: Session, export_path: str, velearn_path: str):
    print("--- Loading Excel Files ---")
    if not os.path.exists(export_path) or not os.path.exists(velearn_path):
        print(f"Error: Missing excel files at {export_path} or {velearn_path}")
        return

    df_export = pd.read_excel(export_path)
    df_velearn = pd.read_excel(velearn_path)

    # Normalize export columns
    df_export = df_export.rename(columns={
        'Emp ID': 'Employee Number',
        'Emp Name': 'Employee Name',
        'Email ID': 'Email',
    })

    # Clean employee numbers for consistent join
    df_export['Employee Number'] = df_export['Employee Number'].astype(str).str.strip()
    df_velearn['Employee Number'] = df_velearn['Employee Number'].astype(str).str.strip()

    # INNER JOIN — only keep employees that exist in both sheets
    df_merged = pd.merge(df_export, df_velearn, on='Employee Number', how='inner', suffixes=('_exp', '_vel'))
    print(f"Inner-joined {len(df_merged)} employees (skipping those missing from either sheet).")

    # Resolve conflicting name columns — prefer export
    for col in ['Employee Name', 'Email']:
        exp_col = f'{col}_exp'
        vel_col = f'{col}_vel'
        if exp_col in df_merged.columns and vel_col in df_merged.columns:
            df_merged[col] = df_merged[exp_col].combine_first(df_merged[vel_col])
        elif exp_col in df_merged.columns:
            df_merged[col] = df_merged[exp_col]
        elif vel_col in df_merged.columns:
            df_merged[col] = df_merged[vel_col]

    name_cache = {}  # manager_name.lower() -> user_id (built after first pass)

    # Pass 1: Upsert users
    print("--- Pass 1: Importing employees ---")
    imported = 0
    skipped = 0
    for _, row in df_merged.iterrows():
        emp_num = clean_val(row.get('Employee Number'))
        if not emp_num or emp_num in ('nan', 'Employee Number'):
            skipped += 1
            continue

        email = clean_val(row.get('Email'))
        if not email or '@' not in email:
            skipped += 1
            continue
        email = email.lower()

        name = clean_val(row.get('Employee Name')) or "Unknown"
        designation = clean_val(row.get('Curr.Designation'))
        division = clean_val(row.get('Curr.Division'))
        department = clean_val(row.get('Curr.Department'))
        emp_type = clean_val(row.get('Type'))

        # Look up existing user
        user = db.query(User).filter(User.employee_number == emp_num).first()
        if not user:
            user = db.query(User).filter(User.email == email).first()

        if user:
            user.employee_number = emp_num
            user.name = name
            user.email = email
            user.designation = designation
            user.division = division
            user.department = department
            user.type = emp_type
            user.role = UserRole.LEARNER  # default; managers promoted in pass 3
        else:
            user = User(
                employee_number=emp_num,
                name=name,
                email=email,
                password_hash=DEFAULT_PASSWORD_HASH,
                designation=designation,
                division=division,
                department=department,
                type=emp_type,
                role=UserRole.LEARNER,
                is_first_login=True,
            )
            db.add(user)

        db.flush()
        name_cache[name.lower()] = user.id
        imported += 1

    db.commit()
    print(f"   Imported: {imported}, Skipped (no email/id): {skipped}")

    # Add default demo user: Sri Vidya M
    print("--- Adding default demo user: Sri Vidya M ---")
    demo_email = "sri.vidya@vearc.com"
    existing_demo = db.query(User).filter(User.email == demo_email).first()
    if not existing_demo:
        demo_user = User(
            employee_number="SV001",
            name="Sri Vidya M",
            email=demo_email,
            password_hash=DEFAULT_PASSWORD_HASH,
            designation="Intern",
            division="AI-CoE",
            department="Technology",
            type="Intern",
            role=UserRole.LEARNER,
            is_first_login=True,
        )
        db.add(demo_user)
        db.flush()
        name_cache["sri vidya m"] = demo_user.id
        print(f"   Demo user created: {demo_email}")
    else:
        name_cache["sri vidya m"] = existing_demo.id
        print(f"   Demo user already exists: {demo_email}")
    db.commit()

    # Pass 2: Set manager_id links
    print("--- Pass 2: Linking managers ---")
    linked = 0
    for _, row in df_merged.iterrows():
        emp_num = clean_val(row.get('Employee Number'))
        if not emp_num:
            continue

        manager_name = clean_val(row.get('Manager Employee Name'))
        if manager_name:
            manager_id = name_cache.get(manager_name.lower())
            if manager_id:
                user = db.query(User).filter(User.employee_number == emp_num).first()
                if user and user.id != manager_id:
                    user.manager_id = manager_id
                    linked += 1

    db.commit()
    print(f"   Linked {linked} manager relationships")

    # Link Sri Vidya M's manager (Mandar Deshpande)
    demo = db.query(User).filter(User.email == "sri.vidya@vearc.com").first()
    if demo:
        mandar_id = name_cache.get("mandar deshpande")
        if mandar_id:
            demo.manager_id = mandar_id
            db.commit()
            print("   Sri Vidya M linked to manager: Mandar Deshpande")

    # Pass 3: Promote users with direct reports to MANAGER role
    print("--- Pass 3: Promoting managers ---")
    manager_ids = set()
    for user in db.query(User).filter(User.manager_id != None).all():
        if user.manager_id:
            manager_ids.add(user.manager_id)

    promoted = 0
    for mid in manager_ids:
        mgr = db.query(User).filter(User.id == mid).first()
        if mgr and mgr.role == UserRole.LEARNER:
            mgr.role = UserRole.MANAGER
            promoted += 1

    db.commit()
    print(f"   Promoted {promoted} employees to MANAGER role")

    # Summary
    total_users = db.query(User).count()
    mgr_count = db.query(User).filter(User.role == UserRole.MANAGER).count()
    learner_count = db.query(User).filter(User.role == UserRole.LEARNER).count()
    admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
    print(f"\n✅ Import complete! Total users: {total_users}")
    print(f"   ADMIN: {admin_count}, MANAGER: {mgr_count}, LEARNER: {learner_count}")
    print(f"\n   Default password for all employees: Welcome@123")
    print(f"   Demo account: sri.vidya@vearc.com / Welcome@123")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        delete_non_admin_users(db)
        import_data(db, EXPORT_FILE, VELEARN_DB_FILE)
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Fatal error: {e}")
        traceback.print_exc()
        raise
    finally:
        db.close()
