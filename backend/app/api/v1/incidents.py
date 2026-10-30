from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Incident, IncidentEvidence, SecurityAlert, User
from app.schemas.schemas import IncidentCreate, IncidentOut

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("/", response_model=List[IncidentOut])
def get_incidents(
    status_filter: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity:
        query = query.filter(Incident.severity == severity)
    
    incidents = query.order_by(Incident.created_at.desc()).all()
    results = []
    for inc in incidents:
        results.append({
            "id": inc.id,
            "incident_id": inc.incident_id,
            "title": inc.title,
            "severity": inc.severity,
            "status": inc.status,
            "assigned_to_id": inc.assigned_to_id,
            "assignee_name": inc.assignee.full_name if inc.assignee else "Unassigned",
            "description": inc.description,
            "root_cause": inc.root_cause,
            "resolution_notes": inc.resolution_notes,
            "created_at": inc.created_at,
            "updated_at": inc.updated_at,
            "evidence_count": len(inc.evidences)
        })
    return results

@router.post("/", response_model=IncidentOut)
def create_incident(
    req: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Security Analyst"]))
):
    import random
    inc_id = f"INC-{datetime.now(timezone.utc).strftime('%Y%m')}-{random.randint(100, 999)}"
    new_inc = Incident(
        incident_id=inc_id,
        title=req.title,
        severity=req.severity,
        status="New",
        assigned_to_id=req.assigned_to_id or current_user.id,
        description=req.description
    )
    db.add(new_inc)
    db.flush()

    # Link related alerts as evidence
    if req.alert_ids:
        for aid in req.alert_ids:
            alert = db.query(SecurityAlert).filter(SecurityAlert.id == aid).first()
            if alert:
                ev = IncidentEvidence(
                    incident_id=new_inc.id,
                    evidence_type="Alert",
                    title=f"Linked Alert: {alert.title}",
                    content_json={
                        "alert_id": alert.alert_id,
                        "source_ip": alert.source_ip,
                        "destination_ip": alert.destination_ip,
                        "severity": alert.severity,
                        "engine": alert.detection_engine
                    }
                )
                db.add(ev)

    db.commit()
    db.refresh(new_inc)
    return {
        "id": new_inc.id,
        "incident_id": new_inc.incident_id,
        "title": new_inc.title,
        "severity": new_inc.severity,
        "status": new_inc.status,
        "assigned_to_id": new_inc.assigned_to_id,
        "assignee_name": new_inc.assignee.full_name if new_inc.assignee else current_user.full_name,
        "description": new_inc.description,
        "root_cause": new_inc.root_cause,
        "resolution_notes": new_inc.resolution_notes,
        "created_at": new_inc.created_at,
        "updated_at": new_inc.updated_at,
        "evidence_count": len(new_inc.evidences)
    }

@router.get("/{incident_id}")
def get_incident_detail(incident_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    evidence_list = []
    for ev in inc.evidences:
        evidence_list.append({
            "id": ev.id,
            "evidence_type": ev.evidence_type,
            "title": ev.title,
            "content_json": ev.content_json,
            "created_at": ev.created_at.isoformat()
        })

    return {
        "id": inc.id,
        "incident_id": inc.incident_id,
        "title": inc.title,
        "severity": inc.severity,
        "status": inc.status,
        "assigned_to_id": inc.assigned_to_id,
        "assignee_name": inc.assignee.full_name if inc.assignee else "Unassigned",
        "description": inc.description,
        "root_cause": inc.root_cause,
        "resolution_notes": inc.resolution_notes,
        "created_at": inc.created_at,
        "updated_at": inc.updated_at,
        "evidence": evidence_list
    }

@router.put("/{incident_id}/status")
def update_incident_status(
    incident_id: int,
    status_val: str,
    root_cause: Optional[str] = None,
    resolution_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Security Analyst"]))
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    inc.status = status_val
    if root_cause:
        inc.root_cause = root_cause
    if resolution_notes:
        inc.resolution_notes = resolution_notes
    inc.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": f"Incident {inc.incident_id} updated to {inc.status}"}
