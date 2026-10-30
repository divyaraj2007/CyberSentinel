from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import ThreatIndicator, User
from app.schemas.schemas import ThreatIndicatorOut, ThreatLookupRequest
from app.threat_intelligence.service import ThreatIntelligenceService

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence"])

@router.get("/indicators", response_model=List[ThreatIndicatorOut])
def get_indicators(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ThreatIndicator).order_by(ThreatIndicator.threat_score.desc()).all()

@router.post("/lookup", response_model=ThreatIndicatorOut)
async def lookup_threat(
    req: ThreatLookupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clean = req.indicator.strip()
    result = await ThreatIntelligenceService.lookup_indicator(clean)

    # Save to history if not exists
    existing = db.query(ThreatIndicator).filter(ThreatIndicator.indicator == clean).first()
    if not existing:
        ti = ThreatIndicator(
            indicator=result["indicator"],
            indicator_type=result["indicator_type"],
            threat_score=result["threat_score"],
            severity=result["severity"],
            source=result["source"],
            malicious_count=result["malicious_count"],
            total_engines=result["total_engines"],
            details_json=result["details_json"]
        )
        db.add(ti)
        db.commit()
        db.refresh(ti)
        return ti
    else:
        existing.threat_score = result["threat_score"]
        existing.severity = result["severity"]
        existing.malicious_count = result["malicious_count"]
        existing.details_json = result["details_json"]
        db.commit()
        db.refresh(existing)
        return existing
