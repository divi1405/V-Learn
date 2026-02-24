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
import argparse

# Config flags
KEEP_ADMIN = True
EXPORT_FILE = "/app/export.xlsx"
VELEARN_DB_FILE = "/app/velearn.xlsx"

DEFAULT_PASSWORD_HASH = hash_password("Welcome@123")

def normalize_role(role_raw):
    # Map any role to one of the strict ENUMs
    if not role_raw or pd.isna(role_raw):
        return UserRole.LEARNER
    role = str(role_raw).upper().strip()
    if role in ["ADMIN", "HR_ADMIN", "MANAGER", "CONTENT_AUTHOR", "LEARNER"]:
        return getattr(UserRole, role)
    # Give a safe default
    return UserRole.LEARNER

def clean_val(val):
    if pd.isna(val) or val == 'nan':
        return None
    return str(val).strip()

def delete_dummy_users(db: Session):
    print("--- Starting Cleanup of Dummy Users ---")
    
    # Identify dummy users
    query = db.query(User)
    if KEEP_ADMIN:
        query = query.filter(User.email != 'admin@company.com')
        
    # We can define dummy users as anyone seeded early, or with @company.com except admin
    # Let's target all users with @company.com, or simply all current users before import
    # to be thorough. The prompt said "created_at equal to original seed timestamp range"
    # or "emails like admin@company.com, hr@company.com"
    dummy_users = query.filter(User.email.like('%@company.com')).all()

    for user in dummy_users:
        uid = user.id
        print(f"Deleting user {uid} ({user.email})...")
        
        # Explicitly delete dependent records
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
        
        # Finally delete User
        db.delete(user)
    
    db.commit()
    print("--- Cleanup Complete ---")

def import_data(db: Session, export_path: str, velearn_path: str):
    print("--- Loading Excel Files ---")
    if not os.path.exists(export_path) or not os.path.exists(velearn_path):
        print(f"Error: Missing excel files at {export_path} or {velearn_path}")
        return

    df_export = pd.read_excel(export_path)
    df_velearn = pd.read_excel(velearn_path)
    
    # Normalize EXPORT to match
    df_export = df_export.rename(columns={
        'Emp ID': 'Employee Number',
        'Email ID': 'Email',
        'Emp Name': 'Employee Name'
    })

    # Assume export DB primary key is "Employee Number" and VeLearn is "id"
    # Rename VeLearn 'id' to match 'Employee Number' for merge if necessary
    if 'id' in df_velearn.columns and 'Employee Number' not in df_velearn.columns:
        df_velearn = df_velearn.rename(columns={'id': 'Employee Number'})

    if 'Employee Number' not in df_export.columns:
        print("Error: 'Employee Number' column missing in export file.")
        return

    # Merge data (Outer join so we keep everything, but we will rely on ID existence)
    df_merged = pd.merge(df_export, df_velearn, on='Employee Number', how='outer', suffixes=('_export', '_velearn'))

    print(f"Merged {len(df_merged)} rows. Upserting into database...")

    # Dictionary to cache name -> id for manager assignments during a second pass if needed, 
    # but the prompt implies manager_id logic. If the excel only has 'Manager Employee Name', 
    # we might need to look them up by name.
    
    # First Pass: Insert/Update Users
    user_cache = {} # Map email -> user_id to handle manager linking
    name_cache = {}

    for _, row in df_merged.iterrows():
        emp_num = clean_val(row.get('Employee Number'))
        if not emp_num:
            continue
            
        # Prefer export, fallback to velearn
        def get_val(col):
            ex_val = clean_val(row.get(f'{col}_export') if f'{col}_export' in row else row.get(col))
            vel_val = clean_val(row.get(f'{col}_velearn') if f'{col}_velearn' in row else None)
            return ex_val if ex_val else vel_val

        email = get_val('Email')
        if email: 
            email = email.lower()
        else:
            continue # We require email for auth
            
        name = get_val('Employee Name')
        designation = get_val('Curr.Designation')
        division = get_val('Curr.Division')
        department = get_val('Curr.Department')
        emp_type = get_val('Type')
        role_str = get_val('Role') or get_val('role')
        role_enum = normalize_role(role_str)

        user = db.query(User).filter(User.employee_number == emp_num).first()
        if not user:
            user = db.query(User).filter(User.email == email).first()

        if user:
            user.employee_number = emp_num
            user.name = name or user.name
            user.email = email
            user.designation = designation
            user.division = division
            user.department = department
            user.type = emp_type
            user.role = role_enum
        else:
            user = User(
                employee_number=emp_num,
                name=name or "Unknown",
                email=email,
                password_hash=DEFAULT_PASSWORD_HASH,
                designation=designation,
                division=division,
                department=department,
                type=emp_type,
                role=role_enum
            )
            db.add(user)
        
        db.flush() # flush to get the serial integer ID tracked
        
        name_cache[user.name.lower()] = user.id
        user_cache[email] = user.id

    db.commit()

    # Second Pass: Manager assignments
    print("--- Second Pass: Manager Assignments ---")
    for _, row in df_merged.iterrows():
        emp_num = clean_val(row.get('Employee Number'))
        if not emp_num:
            continue
        
        manager_name = clean_val(row.get('Manager Employee Name'))
        if manager_name:
            manager_id = name_cache.get(manager_name.lower())
            if manager_id:
                user = db.query(User).filter(User.employee_number == emp_num).first()
                if user:
                    user.manager_id = manager_id

    db.commit()
    print("✅ Employee Data Sync Successfully Completed.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        delete_dummy_users(db)
        import_data(db, EXPORT_FILE, VELEARN_DB_FILE)
    except Exception as e:
        db.rollback()
        print(f"Fatal error during migration: {e}")
        raise
    finally:
        db.close()
