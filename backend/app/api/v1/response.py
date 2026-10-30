from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import ResponseAction, User, AuditLog
from app.schemas.schemas import ResponseActionOut, ResponseActionDecision
from app.services.response_service import ResponseAutomationService

router = APIRouter(prefix="/response", tags=["Automated Security Response"])

@router.get("/actions", response_model=List[ResponseActionOut])
def get_actions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ResponseAction).order_by(ResponseAction.id.desc()).all()

@router.post("/stage", response_model=ResponseActionOut)
def stage_action(
    action_type: str,
    target: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Security Analyst"]))
):
    action_data = ResponseAutomationService.generate_containment_action(
        action_type=action_type,
        target=target,
        reason=reason,
        requester_id=current_user.id
    )
    action = ResponseAction(**action_data)
    db.add(action)
    db.commit()
    db.refresh(action)
    return action

@router.post("/decision")
def make_decision(
    req: ResponseActionDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    action = db.query(ResponseAction).filter(ResponseAction.id == req.action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Response action not found")

    if req.decision == "approve":
        ResponseAutomationService.execute_action(action, current_user.id)
    elif req.decision == "reject":
        action.status = "Rejected"
        action.approved_by_id = current_user.id
    elif req.decision == "rollback":
        ResponseAutomationService.rollback_action(action, current_user.id)
    else:
        raise HTTPException(status_code=400, detail="Invalid decision. Choose 'approve', 'reject', or 'rollback'.")

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action=f"RESPONSE_ACTION_{req.decision.upper()}",
        resource=f"{action.action_type}:{action.target}",
        details_json={"action_id": action.id, "status": action.status}
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "action_id": action.id,
        "new_status": action.status,
        "operator": current_user.username
    }
