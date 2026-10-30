from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Network, Device, User
from app.schemas.schemas import NetworkCreate, NetworkOut

router = APIRouter(prefix="/networks", tags=["Networks"])

@router.get("/", response_model=List[NetworkOut])
def get_networks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    networks = db.query(Network).all()
    results = []
    for net in networks:
        net_dict = {
            "id": net.id,
            "name": net.name,
            "cidr": net.cidr,
            "vlan_id": net.vlan_id,
            "gateway": net.gateway,
            "description": net.description,
            "is_authorized": net.is_authorized,
            "scan_enabled": net.scan_enabled,
            "created_at": net.created_at,
            "device_count": len(net.devices)
        }
        results.append(net_dict)
    return results

@router.post("/", response_model=NetworkOut)
def create_network(
    net_in: NetworkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    existing = db.query(Network).filter(Network.cidr == net_in.cidr).first()
    if existing:
        raise HTTPException(status_code=400, detail="Network with this CIDR already registered")

    new_net = Network(
        name=net_in.name,
        cidr=net_in.cidr,
        vlan_id=net_in.vlan_id,
        gateway=net_in.gateway,
        description=net_in.description,
        is_authorized=net_in.is_authorized,
        scan_enabled=net_in.scan_enabled
    )
    db.add(new_net)
    db.commit()
    db.refresh(new_net)
    return {
        "id": new_net.id,
        "name": new_net.name,
        "cidr": new_net.cidr,
        "vlan_id": new_net.vlan_id,
        "gateway": new_net.gateway,
        "description": new_net.description,
        "is_authorized": new_net.is_authorized,
        "scan_enabled": new_net.scan_enabled,
        "created_at": new_net.created_at,
        "device_count": 0
    }

@router.delete("/{network_id}")
def delete_network(
    network_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator"]))
):
    net = db.query(Network).filter(Network.id == network_id).first()
    if not net:
        raise HTTPException(status_code=404, detail="Network not found")
    db.delete(net)
    db.commit()
    return {"message": f"Network {net.cidr} deleted successfully"}
