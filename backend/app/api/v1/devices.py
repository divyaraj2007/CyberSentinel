from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.core.ws_manager import ws_manager
from app.models.models import Device, Network, User, AuditLog
from app.schemas.schemas import DeviceOut, DeviceUpdate
from app.scanners.network_discovery import discover_subnet

router = APIRouter(prefix="/devices", tags=["Devices"])

@router.get("/", response_model=List[DeviceOut])
def get_devices(
    search: Optional[str] = None,
    device_type: Optional[str] = None,
    network_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    authorized_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Device)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Device.ip_address.like(s)) |
            (Device.hostname.like(s)) |
            (Device.mac_address.like(s)) |
            (Device.manufacturer.like(s))
        )
    if device_type:
        query = query.filter(Device.device_type == device_type)
    if network_id:
        query = query.filter(Device.network_id == network_id)
    if status_filter:
        query = query.filter(Device.status == status_filter)
    if authorized_only is not None:
        query = query.filter(Device.is_authorized == authorized_only)

    return query.order_by(Device.last_seen.desc()).all()

@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dev = db.query(Device).filter(Device.id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    return dev

@router.put("/{device_id}", response_model=DeviceOut)
def update_device(
    device_id: int,
    dev_update: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    dev = db.query(Device).filter(Device.id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")

    if dev_update.hostname is not None:
        dev.hostname = dev_update.hostname
    if dev_update.device_type is not None:
        dev.device_type = dev_update.device_type
    if dev_update.is_authorized is not None:
        dev.is_authorized = dev_update.is_authorized
    if dev_update.notes is not None:
        dev.notes = dev_update.notes
    if dev_update.custom_tags is not None:
        dev.custom_tags = dev_update.custom_tags

    db.commit()
    db.refresh(dev)
    return dev

@router.post("/discover")
async def run_discovery(
    cidr: str = Query("192.168.1.0/24", description="CIDR subnet to discover"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    # Verify CIDR is in authorized networks
    network = db.query(Network).filter(Network.cidr == cidr).first()
    if not network:
        # Check if any network matches prefix
        network = db.query(Network).first()

    net_id = network.id if network else None
    discovered = discover_subnet(cidr)
    new_count = 0
    updated_count = 0

    for item in discovered:
        dev = db.query(Device).filter(Device.ip_address == item["ip_address"]).first()
        if dev:
            dev.last_seen = datetime.now(timezone.utc)
            dev.status = item["status"]
            updated_count += 1
        else:
            new_dev = Device(
                ip_address=item["ip_address"],
                mac_address=item["mac_address"],
                hostname=item["hostname"],
                manufacturer=item["manufacturer"],
                os_name=item["os_name"],
                device_type=item["device_type"],
                status=item["status"],
                is_authorized=item["is_authorized"],
                network_id=net_id,
                notes=item["notes"]
            )
            db.add(new_dev)
            new_count += 1

    db.commit()

    # Broadcast discovery update via WebSocket
    await ws_manager.broadcast({
        "type": "DISCOVERY_COMPLETED",
        "cidr": cidr,
        "new_devices": new_count,
        "updated_devices": updated_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "status": "success",
        "cidr": cidr,
        "total_discovered": len(discovered),
        "new_devices_added": new_count,
        "devices_refreshed": updated_count
    }
