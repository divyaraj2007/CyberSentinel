from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.core.ws_manager import ws_manager
from app.models.models import Scan, Port, Device, Network, User
from app.schemas.schemas import ScanRequest, ScanOut, PortOut
from app.scanners.nmap_scanner import execute_nmap_scan, is_target_in_authorized_networks
from app.vulnerability.cve_matcher import match_vulnerabilities_for_service
from app.models.models import Vulnerability

router = APIRouter(prefix="/scans", tags=["Port Scanner"])

@router.get("/", response_model=List[ScanOut])
def get_scans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Scan).order_by(Scan.started_at.desc()).limit(50).all()

@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.get("/{scan_id}/ports", response_model=List[PortOut])
def get_scan_ports(scan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Port).filter(Port.scan_id == scan_id).all()

@router.post("/start", response_model=ScanOut)
async def start_scan(
    req: ScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    # Enforce scan safety: check target belongs to authorized networks
    authorized_cidrs = [n.cidr for n in db.query(Network).filter(Network.is_authorized == True).all()]
    if not is_target_in_authorized_networks(req.target, authorized_cidrs):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Target {req.target} is not in administrator-authorized network CIDRs. Scans on unapproved assets are rejected."
        )

    # Create initial Scan record
    scan_record = Scan(
        target=req.target,
        scan_type=req.scan_type,
        status="running",
        rate_limit=req.rate_limit,
        user_id=current_user.id
    )
    db.add(scan_record)
    db.commit()
    db.refresh(scan_record)

    # Notify via WebSocket that scan started
    await ws_manager.broadcast({
        "type": "SCAN_STARTED",
        "scan_id": scan_record.id,
        "target": req.target,
        "scan_type": req.scan_type
    })

    # Execute Scan
    scan_result = execute_nmap_scan(req.target, req.scan_type, req.rate_limit)

    # Associate with existing Device if found
    device = db.query(Device).filter(Device.ip_address == req.target).first()
    if device and scan_result.get("os_match") and scan_result["os_match"] != "Unknown":
        device.os_name = scan_result["os_match"]

    # Persist discovered ports and auto-match vulnerabilities
    ports_created = []
    for p in scan_result["ports"]:
        port_obj = Port(
            device_id=device.id if device else None,
            scan_id=scan_record.id,
            port_number=p["port_number"],
            protocol=p["protocol"],
            state=p["state"],
            service_name=p["service_name"],
            service_version=p["service_version"],
            service_product=p["service_product"],
            risk_level=p["risk_level"],
            banner=p["banner"]
        )
        db.add(port_obj)
        ports_created.append(port_obj)

        # Vulnerability mapping
        cve_matches = match_vulnerabilities_for_service(p["service_name"], p["service_version"])
        for cve in cve_matches:
            # Check if already recorded
            existing_vuln = db.query(Vulnerability).filter(
                Vulnerability.cve_id == cve["cve_id"],
                Vulnerability.device_id == (device.id if device else None)
            ).first()
            if not existing_vuln:
                vuln = Vulnerability(
                    cve_id=cve["cve_id"],
                    title=cve["title"],
                    description=cve["description"],
                    cvss_score=cve["cvss_score"],
                    severity=cve["severity"],
                    affected_service=cve["affected_service"],
                    affected_version=cve["affected_version"],
                    remediation=cve["remediation"],
                    status="Open",
                    device_id=device.id if device else None,
                    port_id=port_obj.id,
                    is_potential=cve["is_potential"]
                )
                db.add(vuln)

    scan_record.status = "completed"
    scan_record.ports_scanned = scan_result["ports_scanned"]
    scan_record.open_ports_count = scan_result["open_ports_count"]
    scan_record.raw_output = scan_result["raw_output"]
    scan_record.completed_at = scan_result["completed_at"]
    db.commit()
    db.refresh(scan_record)

    # Notify via WebSocket that scan completed
    await ws_manager.broadcast({
        "type": "SCAN_COMPLETED",
        "scan_id": scan_record.id,
        "target": req.target,
        "open_ports": scan_record.open_ports_count,
        "status": "completed"
    })

    return scan_record
