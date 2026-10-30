from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import SecurityAlert, Vulnerability, Incident, User
from app.schemas.schemas import AICopilotQuery, AICopilotResponse
from app.ai.security_copilot import AISecurityCopilot

router = APIRouter(prefix="/ai", tags=["AI Security Copilot"])

@router.post("/copilot", response_model=AICopilotResponse)
async def ask_copilot(
    query: AICopilotQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    extra_context = {}
    if query.context_type == "alert" and query.context_id:
        alert = db.query(SecurityAlert).filter(
            (SecurityAlert.alert_id == query.context_id) | (SecurityAlert.id == int(query.context_id if query.context_id.isdigit() else -1))
        ).first()
        if alert:
            extra_context = {
                "alert_id": alert.alert_id,
                "title": alert.title,
                "category": alert.category,
                "severity": alert.severity,
                "source_ip": alert.source_ip,
                "destination_ip": alert.destination_ip,
                "detection_engine": alert.detection_engine,
                "evidence": alert.evidence_json
            }
    elif query.context_type == "vulnerability" and query.context_id:
        vuln = db.query(Vulnerability).filter(
            (Vulnerability.cve_id == query.context_id) | (Vulnerability.id == int(query.context_id if query.context_id.isdigit() else -1))
        ).first()
        if vuln:
            extra_context = {
                "cve_id": vuln.cve_id,
                "title": vuln.title,
                "affected_service": vuln.affected_service,
                "cvss_score": vuln.cvss_score,
                "severity": vuln.severity,
                "device_ip": vuln.device.ip_address if vuln.device else None
            }

    result = await AISecurityCopilot.analyze_query(
        prompt=query.prompt,
        context_type=query.context_type,
        context_id=query.context_id,
        extra_context=extra_context
    )
    return result
