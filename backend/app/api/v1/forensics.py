import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import PacketCapture, User, AuditLog
from app.services.forensics_service import ForensicsService, CAPTURES_DIR

router = APIRouter(prefix="/forensics", tags=["Digital Forensics"])

@router.get("/captures")
def get_captures(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PacketCapture).order_by(PacketCapture.upload_timestamp.desc()).all()

@router.post("/upload-pcap")
async def upload_pcap(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Security Analyst"]))
):
    if not file.filename.endswith((".pcap", ".pcapng", ".cap")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .pcap, .pcapng, and .cap files are accepted.")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Save to disk
    safe_name = f"{int(os.path.getmtime('.'))}_{file.filename}"
    save_path = os.path.join(CAPTURES_DIR, safe_name)
    with open(save_path, "wb") as f:
        f.write(contents)

    analysis = ForensicsService.analyze_pcap(contents, file.filename)

    # Save in DB
    pcap_record = PacketCapture(
        filename=file.filename,
        file_path=save_path,
        file_size_bytes=analysis["file_size_bytes"],
        sha256_hash=analysis["sha256_hash"],
        packet_count=analysis["packet_count"],
        duration_seconds=analysis["duration_seconds"],
        protocols_json=analysis["protocols_json"],
        top_talkers_json=analysis["top_talkers_json"],
        investigator_id=current_user.id
    )
    db.add(pcap_record)

    # Audit log entry for digital forensics chain of custody
    audit = AuditLog(
        user_id=current_user.id,
        action="FORENSICS_PCAP_INGEST",
        resource="EVIDENCE",
        details_json={
            "filename": file.filename,
            "sha256": analysis["sha256_hash"],
            "packet_count": analysis["packet_count"]
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(pcap_record)

    return {
        "status": "success",
        "capture_id": pcap_record.id,
        "filename": pcap_record.filename,
        "sha256_hash": pcap_record.sha256_hash,
        "packet_count": pcap_record.packet_count,
        "protocols": pcap_record.protocols_json,
        "top_talkers": pcap_record.top_talkers_json,
        "suspicious_indicators": analysis.get("suspicious_indicators", [])
    }
