import pandas as pd
import math
from app.database import SessionLocal, engine
from app.models import Base, User, Manager, UserRole
from app.auth import hash_password

def clean_val(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, str):
        v = v.strip()
        return v if v else None
    return v

def run_import():
    db = SessionLocal()
    try:
        # Recreate tables so the new schema is fully applied
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Recreated database schema.")

        df1 = pd.read_excel('/app/excel_sheets/VeLearn Database.xlsx').dropna(how='all')
        df2 = pd.read_excel('/app/excel_sheets/export.xlsx').dropna(how='all')

        # Create dictionaries for fast lookup
        emails_by_name = {}
        emails_by_id = {}
        for _, row in df2.iterrows():
            name = clean_val(row.get('Emp Name'))
            emp_id = clean_val(row.get('Emp ID'))
            email = clean_val(row.get('Email ID'))
            if email:
                if name: emails_by_name[name.lower()] = email
                if emp_id: emails_by_id[emp_id.lower()] = email

        managers_dict = {}  # manager_name.lower(): Manager object
        users_cache = {}    # email.lower(): User object

        # Pass 1: Extract and create ALL managers first
        for _, row in df1.iterrows():
            manager_name = clean_val(row.get('Manager Employee Name'))
            if not manager_name: continue
            
            m_key = manager_name.lower()
            if m_key not in managers_dict:
                # 1. We need a User account for this manager
                m_email = emails_by_name.get(m_key) or f"{manager_name.replace(' ', '.').lower()}@vearc.com"
                
                # Create Manager User Account
                m_user = db.query(User).filter(User.email == m_email).first()
                if not m_user:
                    m_user = User(
                        employee_number=f"MGR-{len(managers_dict)}",
                        name=manager_name,
                        email=m_email,
                        password_hash=hash_password("Welcome@123"),
                        role=UserRole.MANAGER,
                        is_first_login=True
                    )
                    db.add(m_user)
                    db.flush() # get m_user.id
                else:
                    m_user.role = UserRole.MANAGER
                    db.flush()

                # 2. Create the standalone Manager record
                manager_record = Manager(
                    user_id=m_user.id,
                    name=manager_name,
                    department="Management", # Default, can be updated later
                )
                db.add(manager_record)
                db.flush()
                managers_dict[m_key] = manager_record
                users_cache[m_email] = m_user

        # Pass 2: Create all users and link them to proper manager_id
        for _, row in df1.iterrows():
            emp_num = clean_val(row.get('Employee Number'))
            name = clean_val(row.get('Employee Name'))
            mgr_name = clean_val(row.get('Manager Employee Name'))
            
            if not name or not emp_num: continue

            # Determine email
            email = emails_by_id.get(emp_num.lower()) or emails_by_name.get(name.lower()) or f"{name.replace(' ', '.').lower()}@vearc.com"
            
            user = users_cache.get(email)
            if not user:
                user = User(
                    employee_number=emp_num,
                    name=name,
                    email=email,
                    password_hash=hash_password("Welcome@123"),
                    role=UserRole.LEARNER,
                    designation=clean_val(row.get('Curr.Designation')),
                    division=clean_val(row.get('Curr.Division')),
                    department=clean_val(row.get('Curr.Department')),
                    type=clean_val(row.get('Type'))
                )
                db.add(user)
                users_cache[email] = user

            # Link manager
            if mgr_name:
                m_key = mgr_name.lower()
                if m_key in managers_dict:
                    user.manager_id = managers_dict[m_key].id

        db.commit()
        print(f"Successfully imported {len(users_cache)} users and {len(managers_dict)} managers.")

    except Exception as e:
        db.rollback()
        print("Error during import:", e)
    finally:
        db.close()

if __name__ == "__main__":
    run_import()
