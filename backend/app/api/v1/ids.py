from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.core.ws_manager import ws_manager
from app.models.models import SecurityAlert, User, AuditLog
from app.schemas.schemas import SecurityAlertOut, AlertUpdate
from app.detection.ids_engine import generate_ids_alert

router = APIRouter(prefix="/ids", tags=["Intrusion Detection"])

@router.get("/alerts", response_model=List[SecurityAlertOut])
def get_alerts(
    severity: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SecurityAlert)
    if severity:
        query = query.filter(SecurityAlert.severity == severity)
    if category:
        query = query.filter(SecurityAlert.category == category)
    if status_filter:
        query = query.filter(SecurityAlert.status == status_filter)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (SecurityAlert.title.like(s)) |
            (SecurityAlert.source_ip.like(s)) |
            (SecurityAlert.destination_ip.like(s)) |
            (SecurityAlert.alert_id.like(s))
        )
    return query.order_by(SecurityAlert.created_at.desc()).all()

@router.get("/alerts/{alert_id}", response_model=SecurityAlertOut)
def get_alert_detail(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.put("/alerts/{alert_id}", response_model=SecurityAlertOut)
async def update_alert(
    alert_id: int,
    update: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Security Analyst"]))
):
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if update.status:
        alert.status = update.status
        if update.status == "Acknowledged":
            alert.acknowledged_by_id = current_user.id
    if update.is_escalated is not None:
        alert.is_escalated = update.is_escalated

    db.commit()
    db.refresh(alert)

    # Broadcast alert state change
    await ws_manager.broadcast({
        "type": "ALERT_UPDATED",
        "alert_id": alert.alert_id,
        "status": alert.status,
        "is_escalated": alert.is_escalated
    })

    return alert

@router.post("/simulate")
async def simulate_ids_event(
    rule_index: Optional[int] = Query(None, description="Index of rule from PREDEFINED_IDS_RULES"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    alert_data = generate_ids_alert(rule_index=rule_index)
    alert = SecurityAlert(**alert_data)
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Broadcast live alert to all connected operators!
    await ws_manager.broadcast({
        "type": "NEW_SECURITY_ALERT",
        "alert": {
            "id": alert.id,
            "alert_id": alert.alert_id,
            "title": alert.title,
            "category": alert.category,
            "severity": alert.severity,
            "source_ip": alert.source_ip,
            "destination_ip": alert.destination_ip,
            "engine": alert.detection_engine,
            "created_at": alert.created_at.isoformat()
        }
    })

    return alert
