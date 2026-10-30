from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Vulnerability, Device, Port, User
from app.schemas.schemas import VulnerabilityOut, VulnerabilityStatusUpdate
from app.vulnerability.cve_matcher import match_vulnerabilities_for_service, query_nvd_cve

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerability Assessment"])

@router.get("/", response_model=List[VulnerabilityOut])
def get_vulnerabilities(
    severity: Optional[str] = None,
    status_filter: Optional[str] = None,
    device_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Vulnerability)
    if severity:
        query = query.filter(Vulnerability.severity == severity)
    if status_filter:
        query = query.filter(Vulnerability.status == status_filter)
    if device_id:
        query = query.filter(Vulnerability.device_id == device_id)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Vulnerability.cve_id.like(s)) |
            (Vulnerability.title.like(s)) |
            (Vulnerability.affected_service.like(s))
        )
    
    vulns = query.order_by(Vulnerability.cvss_score.desc()).all()
    results = []
    for v in vulns:
        dev_ip = v.device.ip_address if v.device else None
        results.append({
            "id": v.id,
            "cve_id": v.cve_id,
            "title": v.title,
            "description": v.description,
            "cvss_score": v.cvss_score,
            "severity": v.severity,
            "affected_service": v.affected_service,
            "affected_version": v.affected_version,
            "remediation": v.remediation,
            "status": v.status,
            "is_potential": v.is_potential,
            "device_id": v.device_id,
            "port_id": v.port_id,
            "detected_at": v.detected_at,
            "device_ip": dev_ip
        })
    return results

@router.get("/{vuln_id}", response_model=VulnerabilityOut)
async def get_vulnerability(vuln_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    # Try querying official NVD API if detailed vector is needed
    nvd_info = await query_nvd_cve(v.cve_id)
    desc = nvd_info.get("description") if nvd_info else v.description

    return {
        "id": v.id,
        "cve_id": v.cve_id,
        "title": v.title,
        "description": desc or v.description,
        "cvss_score": v.cvss_score,
        "severity": v.severity,
        "affected_service": v.affected_service,
        "affected_version": v.affected_version,
        "remediation": v.remediation,
        "status": v.status,
        "is_potential": v.is_potential,
        "device_id": v.device_id,
        "port_id": v.port_id,
        "detected_at": v.detected_at,
        "device_ip": v.device.ip_address if v.device else None
    }

@router.put("/{vuln_id}/status")
def update_vulnerability_status(
    vuln_id: int,
    status_update: VulnerabilityStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    v = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    v.status = status_update.status
    if status_update.status == "Remediated":
        v.is_potential = False
    db.commit()
    return {"message": f"Vulnerability {v.cve_id} status updated to {v.status}"}

@router.post("/scan")
def trigger_vulnerability_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    """Correlates all discovered open ports and services with the CVE knowledgebase."""
    ports = db.query(Port).filter(Port.state == "open").all()
    new_findings = 0

    for p in ports:
        matches = match_vulnerabilities_for_service(p.service_name or "", p.service_version or "")
        for m in matches:
            existing = db.query(Vulnerability).filter(
                Vulnerability.cve_id == m["cve_id"],
                Vulnerability.device_id == p.device_id
            ).first()
            if not existing:
                vuln = Vulnerability(
                    cve_id=m["cve_id"],
                    title=m["title"],
                    description=m["description"],
                    cvss_score=m["cvss_score"],
                    severity=m["severity"],
                    affected_service=m["affected_service"],
                    affected_version=m["affected_version"],
                    remediation=m["remediation"],
                    status="Open",
                    device_id=p.device_id,
                    port_id=p.id,
                    is_potential=m["is_potential"]
                )
                db.add(vuln)
                new_findings += 1

    db.commit()
    return {
        "status": "completed",
        "services_analyzed": len(ports),
        "new_vulnerabilities_identified": new_findings
    }
