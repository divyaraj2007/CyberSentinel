from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import CiscoDevice, CiscoInterface, CiscoAuditFinding, User
from app.schemas.schemas import CiscoDeviceOut, CiscoInterfaceOut, CiscoAuditFindingOut
from app.monitoring.cisco_snmp import generate_cisco_telemetry

router = APIRouter(prefix="/cisco", tags=["Cisco Infrastructure Monitoring"])

@router.get("/devices", response_model=List[CiscoDeviceOut])
def get_cisco_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    devices = db.query(CiscoDevice).all()
    # If none, generate fresh telemetry
    if not devices:
        telemetry = generate_cisco_telemetry()
        c = CiscoDevice(
            hostname=telemetry["hostname"],
            ip_address=telemetry["ip_address"],
            model=telemetry["model"],
            snmp_version=telemetry["snmp_version"],
            sys_descr=telemetry["sys_descr"],
            uptime_seconds=telemetry["uptime_seconds"],
            cpu_usage=telemetry["cpu_usage"],
            memory_usage=telemetry["memory_usage"],
            temperature_celsius=telemetry["temperature_celsius"],
            status=telemetry["status"]
        )
        db.add(c)
        db.flush()
        for iface in telemetry["interfaces"]:
            ci = CiscoInterface(cisco_device_id=c.id, **iface)
            db.add(ci)
        for finding in telemetry["audit_findings"]:
            af = CiscoAuditFinding(cisco_device_id=c.id, **finding)
            db.add(af)
        db.commit()
        devices = [c]
    return devices

@router.get("/devices/{device_id}", response_model=CiscoDeviceOut)
def get_cisco_device(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(CiscoDevice).filter(CiscoDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cisco device not found")
    return device

@router.get("/devices/{device_id}/interfaces", response_model=List[CiscoInterfaceOut])
def get_device_interfaces(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CiscoInterface).filter(CiscoInterface.cisco_device_id == device_id).all()

@router.get("/devices/{device_id}/audit", response_model=List[CiscoAuditFindingOut])
def get_device_audit(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CiscoAuditFinding).filter(CiscoAuditFinding.cisco_device_id == device_id).all()
