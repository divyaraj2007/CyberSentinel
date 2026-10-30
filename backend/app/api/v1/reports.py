import os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import (
    ReportRecord, Device, Port, Vulnerability, SecurityAlert,
    Incident, CiscoDevice, ThreatIndicator, User
)
from app.reports.report_generator import generate_pdf_report, generate_csv_report, REPORTS_DIR

router = APIRouter(prefix="/reports", tags=["Report Generator"])

@router.get("/")
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ReportRecord).order_by(ReportRecord.created_at.desc()).all()

@router.post("/generate")
def create_report(
    report_type: str = "complete_assessment",
    format_type: str = "PDF", # "PDF" or "CSV"
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Security Analyst"]))
):
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    file_ext = "pdf" if format_type.upper() == "PDF" else "csv"
    filename = f"{report_type}_{timestamp}.{file_ext}"
    out_path = os.path.join(REPORTS_DIR, filename)

    # Gather data from database
    devices = db.query(Device).all()
    vulns = db.query(Vulnerability).all()
    alerts = db.query(SecurityAlert).all()
    incidents = db.query(Incident).all()

    table_data = [["Target / Entity", "Classification", "Severity", "Finding / Status"]]
    for d in devices:
        table_data.append([d.ip_address, f"Device ({d.device_type})", "Info" if d.is_authorized else "High", d.status])
    for v in vulns[:5]:
        table_data.append([v.cve_id, v.affected_service or "Service", v.severity, v.status])
    for a in alerts[:5]:
        table_data.append([a.alert_id, a.category, a.severity, a.status])

    report_payload = {
        "report_type": report_type,
        "executive_summary": (
            f"CyberSentinel enterprise security report. Total active inventory: {len(devices)} assets, "
            f"{len(vulns)} vulnerability findings, {len(alerts)} intrusion detection alerts, and "
            f"{len(incidents)} active incident cases tracked."
        ),
        "table_data": table_data,
        "recommendations": [
            "1. Enforce strict 802.1X Network Access Control across all building switch access ports.",
            "2. Expedite patching for high & critical CVEs identified on production servers.",
            "3. Enforce multi-factor authentication (MFA) and decommission obsolete plaintext management protocols."
        ]
    }

    if format_type.upper() == "PDF":
        generate_pdf_report(report_type, report_payload, out_path)
    else:
        generate_csv_report(report_type, table_data, out_path)

    # Save record
    rec = ReportRecord(
        report_type=report_type,
        title=f"Security Report - {report_type.replace('_', ' ').title()}",
        format=format_type.upper(),
        file_path=out_path,
        status="Completed",
        generated_by_id=current_user.id
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return {
        "status": "success",
        "report_id": rec.id,
        "title": rec.title,
        "filename": filename,
        "format": rec.format,
        "download_url": f"/api/v1/reports/download/{filename}"
    }

@router.get("/download/{filename}")
def download_report(filename: str):
    file_path = os.path.join(REPORTS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    media_type = "application/pdf" if filename.endswith(".pdf") else "text/csv"
    return FileResponse(file_path, media_type=media_type, filename=filename)
