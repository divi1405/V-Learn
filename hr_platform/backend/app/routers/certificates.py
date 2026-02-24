from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import uuid, os
from app.database import get_db
from app.models import Certificate, Course, User, Enrollment, EnrollmentStatus
from app.schemas import CertificateOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/certificates", tags=["certificates"])

CERT_DIR = "/app/certificates"


def generate_pdf(cert, user, course):
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor

    os.makedirs(CERT_DIR, exist_ok=True)
    path = os.path.join(CERT_DIR, f"{cert.credential_id}.pdf")
    c = canvas.Canvas(path, pagesize=landscape(A4))
    w, h = landscape(A4)

    # Background
    c.setFillColor(HexColor("#0f172a"))
    c.rect(0, 0, w, h, fill=1)

    # Border
    c.setStrokeColor(HexColor("#6366f1"))
    c.setLineWidth(3)
    c.rect(30, 30, w - 60, h - 60)

    # Title
    c.setFillColor(HexColor("#6366f1"))
    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(w / 2, h - 120, "Certificate of Completion")

    # Decorative line
    c.setStrokeColor(HexColor("#818cf8"))
    c.setLineWidth(1)
    c.line(w / 2 - 150, h - 140, w / 2 + 150, h - 140)

    # Awarded to
    c.setFillColor(HexColor("#cbd5e1"))
    c.setFont("Helvetica", 16)
    c.drawCentredString(w / 2, h - 190, "This is to certify that")

    # Name
    c.setFillColor(HexColor("#f1f5f9"))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w / 2, h - 230, user.name)

    # Course
    c.setFillColor(HexColor("#cbd5e1"))
    c.setFont("Helvetica", 16)
    c.drawCentredString(w / 2, h - 275, "has successfully completed the course")

    c.setFillColor(HexColor("#a5b4fc"))
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(w / 2, h - 310, course.title)

    # Date & ID
    c.setFillColor(HexColor("#94a3b8"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(w / 2, 80, f"Issued: {cert.issued_at.strftime('%B %d, %Y')}  |  Credential ID: {cert.credential_id}")

    c.save()
    return path


@router.get("", response_model=List[CertificateOut])
def my_certificates(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Certificate).filter(Certificate.user_id == user.id).all()


@router.post("/generate/{course_id}", response_model=CertificateOut)
def generate_certificate(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id,
        Enrollment.status == EnrollmentStatus.COMPLETED,
    ).first()
    if not enrollment:
        raise HTTPException(400, "Course not completed yet")

    existing = db.query(Certificate).filter(
        Certificate.user_id == user.id, Certificate.course_id == course_id
    ).first()
    if existing:
        return existing

    course = db.query(Course).filter(Course.id == course_id).first()
    cred_id = f"LMS-{uuid.uuid4().hex[:8].upper()}"
    cert = Certificate(
        user_id=user.id,
        course_id=course_id,
        credential_id=cred_id,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    pdf_path = generate_pdf(cert, user, course)
    cert.pdf_path = pdf_path
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/download/{credential_id}")
def download_certificate(credential_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.credential_id == credential_id).first()
    if not cert or not cert.pdf_path:
        raise HTTPException(404, "Certificate not found")
    if not os.path.exists(cert.pdf_path):
        raise HTTPException(404, "PDF file not found")
    return FileResponse(cert.pdf_path, media_type="application/pdf", filename=f"{cert.credential_id}.pdf")
