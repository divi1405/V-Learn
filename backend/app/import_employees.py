import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.database import SessionLocal
from app.models import (
    User, Enrollment, LessonProgress, QuizAttempt, Certificate, 
    UserSkill, Notification, CourseReview, LearningNeedAnalysis, 
    UserCheckpointProgress, Badge, UserRole, Manager
)
from app.auth import hash_password
from datetime import datetime
import os

# Config flags
KEEP_ADMIN = True
EXPORT_FILE = "/app/excel_sheets/export.xlsx"
VELEARN_DB_FILE = "/app/excel_sheets/VeLearn Database.xlsx"

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
    
    # Run raw SQL to do cleanup more safely
    admin_filter = "WHERE role != 'ADMIN'" if KEEP_ADMIN else ""
    
    queries = [
        f"UPDATE courses SET author_id = NULL WHERE author_id IN (SELECT id FROM users {admin_filter})",
        f"UPDATE enrollments SET assigned_by = NULL WHERE assigned_by IN (SELECT id FROM users {admin_filter})",
        # users.manager_id references managers(id), so NULL them all before deleting managers
        "UPDATE users SET manager_id = NULL",
        f"DELETE FROM enrollments WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM lesson_progress WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM quiz_attempts WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM certificates WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM user_skills WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM notifications WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM course_reviews WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM learning_need_analyses WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM user_checkpoint_progress WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM badges WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM managers WHERE user_id IN (SELECT id FROM users {admin_filter})",
        f"DELETE FROM users {admin_filter}"
    ]
    
    for q in queries:
        db.execute(text(q))
    
    db.commit()
    print("--- Cleanup complete ---")


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

    # Resolve conflicting columns after merge:
    # - Employee Name: prefer VeLearn (_vel)
    # - Email: prefer export (_exp)
    for col, prefer in [('Employee Name', '_vel'), ('Email', '_exp')]:
        pref_col = f'{col}{prefer}'
        alt_col = f'{col}_vel' if prefer == '_exp' else f'{col}_exp'
        if pref_col in df_merged.columns and alt_col in df_merged.columns:
            df_merged[col] = df_merged[pref_col].combine_first(df_merged[alt_col])
        elif pref_col in df_merged.columns:
            df_merged[col] = df_merged[pref_col]
        elif alt_col in df_merged.columns:
            df_merged[col] = df_merged[alt_col]

    # VeLearn uses 'Manager Employee Name' not 'Manager Name'
    if 'Manager Employee Name' in df_merged.columns:
        df_merged['Manager Name'] = df_merged['Manager Employee Name']

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
        
        # Determine company_id from generic variations
        company_id = clean_val(row.get('Company ID')) or clean_val(row.get('Company Id')) or clean_val(row.get('company_id'))

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
            if company_id:
                user.company_id = company_id
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
                company_id=company_id if company_id else None,
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

    # Pass 2: Identify manager users and create Manager table entries
    print("--- Pass 2: Creating manager entries ---")
    # Collect all unique manager names from the data
    manager_names_set = set()
    for _, row in df_merged.iterrows():
        mgr_name = clean_val(row.get('Manager Name') or row.get('Manager Employee Name'))
        if mgr_name:
            manager_names_set.add(mgr_name.lower())

    # Create Manager entries for each manager user
    manager_entry_cache = {}  # manager_name.lower() -> managers.id
    for mgr_name_lower in manager_names_set:
        user_id = name_cache.get(mgr_name_lower)
        if user_id:
            mgr_user = db.query(User).filter(User.id == user_id).first()
            if mgr_user:
                # Create a Manager entry
                mgr_entry = Manager(
                    user_id=mgr_user.id,
                    name=mgr_user.name,
                    department=mgr_user.department,
                    division=mgr_user.division,
                    designation=mgr_user.designation,
                )
                db.add(mgr_entry)
                db.flush()
                manager_entry_cache[mgr_name_lower] = mgr_entry.id
                # Promote to MANAGER role
                if mgr_user.role == UserRole.LEARNER:
                    mgr_user.role = UserRole.MANAGER

    db.commit()
    print(f"   Created {len(manager_entry_cache)} manager entries")

    # Pass 3: Link users to their managers
    print("--- Pass 3: Linking managers ---")
    linked = 0
    for _, row in df_merged.iterrows():
        emp_num = clean_val(row.get('Employee Number'))
        if not emp_num:
            continue

        mgr_name = clean_val(row.get('Manager Name') or row.get('Manager Employee Name'))
        if mgr_name:
            manager_table_id = manager_entry_cache.get(mgr_name.lower())
            if manager_table_id:
                user = db.query(User).filter(User.employee_number == emp_num).first()
                if user:
                    user.manager_id = manager_table_id
                    linked += 1

    # Link Sri Vidya M's manager (Mandar Deshpande)
    demo = db.query(User).filter(User.email == "sri.vidya@vearc.com").first()
    if demo:
        mandar_mgr_id = manager_entry_cache.get("mandar deshpande")
        if mandar_mgr_id:
            demo.manager_id = mandar_mgr_id
            print("   Sri Vidya M linked to manager: Mandar Deshpande")

    db.commit()
    print(f"   Linked {linked} manager relationships")

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
        with open("/app/last_error.txt", "w") as f:
            f.write(traceback.format_exc())
        print("Error logged to /app/last_error.txt")
        raise
    finally:
        db.close()
