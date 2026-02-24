import os
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.auth import get_current_user, require_role
from app.models import User

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    user: User = Depends(require_role("admin", "content_author", "hr_admin"))
):
    try:
        # Create a safe filename (ideally using uuid, but keeping it simple)
        safe_filename = file.filename.replace(" ", "_").lower()
        file_location = f"{UPLOAD_DIR}/{safe_filename}"
        
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # Return the URL path
        return {"url": f"/api/uploads/{safe_filename}", "filename": safe_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
