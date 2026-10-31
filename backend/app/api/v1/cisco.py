from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import CiscoDevice, CiscoInterface, CiscoAuditFinding, User
from app.schemas.schemas import CiscoDeviceOut, CiscoInterfaceOut, CiscoAuditFindingOut, InfrastructureDeviceCreate
from app.monitoring.cisco_snmp import (
    generate_cisco_telemetry,
    generate_college_switch_telemetry,
    generate_sophos_firewall_telemetry,
    poll_device_telemetry
)

router = APIRouter(prefix="/cisco", tags=["Infrastructure, College Switches & Sophos Firewall"])

def _init_default_infrastructure(db: Session) -> List[CiscoDevice]:
    """Auto-seeds the 3 essential infrastructure devices if table is empty."""
    devices_data = [
        generate_cisco_telemetry("cisco-core-sw01"),
        generate_college_switch_telemetry(
            hostname="clg-lab-sw01",
            ip="192.168.10.1",
            port_count=24,
            vendor="Cisco",
            model="Catalyst 2960-24TT",
            location="Computer Engineering Lab 1 - Rack 3"
        ),
        generate_sophos_firewall_telemetry(
            hostname="sophos-xgs3300-clg",
            ip="172.16.16.16",
            location="College Main Border Perimeter Rack"
        )
    ]

    created = []
    for telemetry in devices_data:
        c = CiscoDevice(
            hostname=telemetry["hostname"],
            ip_address=telemetry["ip_address"],
            model=telemetry["model"],
            device_type=telemetry.get("device_type", "switch"),
            vendor=telemetry.get("vendor", "Cisco"),
            location=telemetry.get("location", "Main Campus"),
            snmp_version=telemetry["snmp_version"],
            sys_descr=telemetry["sys_descr"],
            uptime_seconds=telemetry["uptime_seconds"],
            cpu_usage=telemetry["cpu_usage"],
            memory_usage=telemetry["memory_usage"],
            temperature_celsius=telemetry["temperature_celsius"],
            status=telemetry["status"],
            extra_data_json=telemetry.get("extra_data_json", {})
        )
        db.add(c)
        db.flush()

        for iface in telemetry["interfaces"]:
            ci = CiscoInterface(cisco_device_id=c.id, **iface)
            db.add(ci)

        for finding in telemetry.get("audit_findings", []):
            af = CiscoAuditFinding(cisco_device_id=c.id, **finding)
            db.add(af)

        created.append(c)

    db.commit()
    return created

@router.get("/devices", response_model=List[CiscoDeviceOut])
def get_cisco_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    devices = db.query(CiscoDevice).all()
    if not devices:
        devices = _init_default_infrastructure(db)
    return devices

@router.post("/devices", response_model=CiscoDeviceOut, status_code=status.HTTP_201_CREATED)
def add_infrastructure_device(
    payload: InfrastructureDeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adds a new Campus Switch (LibreNMS style) or Sophos Firewall to monitoring."""
    existing = db.query(CiscoDevice).filter(CiscoDevice.hostname == payload.hostname).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Device with hostname '{payload.hostname}' already exists")

    if payload.device_type == "firewall" or "sophos" in payload.vendor.lower() or "sophos" in payload.model.lower():
        telemetry = generate_sophos_firewall_telemetry(
            hostname=payload.hostname,
            ip=payload.ip_address,
            location=payload.location or "College Firewall Perimeter"
        )
    else:
        telemetry = generate_college_switch_telemetry(
            hostname=payload.hostname,
            ip=payload.ip_address,
            port_count=payload.port_count or 24,
            vendor=payload.vendor or "Cisco",
            model=payload.model or "Catalyst 2960-24TT",
            location=payload.location or "Campus Switch Cabinet"
        )

    device = CiscoDevice(
        hostname=telemetry["hostname"],
        ip_address=telemetry["ip_address"],
        model=telemetry["model"],
        device_type=telemetry.get("device_type", payload.device_type),
        vendor=telemetry.get("vendor", payload.vendor),
        location=telemetry.get("location", payload.location or "Campus"),
        snmp_version=payload.snmp_version or telemetry["snmp_version"],
        snmp_community=payload.snmp_community or "public",
        sys_descr=telemetry["sys_descr"],
        uptime_seconds=telemetry["uptime_seconds"],
        cpu_usage=telemetry["cpu_usage"],
        memory_usage=telemetry["memory_usage"],
        temperature_celsius=telemetry["temperature_celsius"],
        status=telemetry["status"],
        extra_data_json=telemetry.get("extra_data_json", {})
    )
    db.add(device)
    db.flush()

    for iface in telemetry["interfaces"]:
        ci = CiscoInterface(cisco_device_id=device.id, **iface)
        db.add(ci)

    for finding in telemetry.get("audit_findings", []):
        af = CiscoAuditFinding(cisco_device_id=device.id, **finding)
        db.add(af)

    db.commit()
    db.refresh(device)
    return device

@router.get("/devices/{device_id}", response_model=CiscoDeviceOut)
def get_cisco_device(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(CiscoDevice).filter(CiscoDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.post("/devices/{device_id}/poll", response_model=CiscoDeviceOut)
def poll_device_realtime(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Triggers instant SNMP poll & real-time telemetry update."""
    device = db.query(CiscoDevice).filter(CiscoDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    poll_device_telemetry(device)
    db.commit()
    db.refresh(device)
    return device

@router.get("/devices/{device_id}/interfaces", response_model=List[CiscoInterfaceOut])
def get_device_interfaces(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CiscoInterface).filter(CiscoInterface.cisco_device_id == device_id).all()

@router.get("/devices/{device_id}/audit", response_model=List[CiscoAuditFindingOut])
def get_device_audit(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CiscoAuditFinding).filter(CiscoAuditFinding.cisco_device_id == device_id).all()

@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(CiscoDevice).filter(CiscoDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return None
