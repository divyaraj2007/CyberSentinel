from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Device, Network, SecurityAlert, User

router = APIRouter(prefix="/topology", tags=["Network Topology"])

@router.get("/")
def get_topology(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    devices = db.query(Device).all()
    networks = db.query(Network).all()
    active_alerts = db.query(SecurityAlert).filter(SecurityAlert.status != "Resolved").all()
    suspicious_ips = {a.source_ip for a in active_alerts if a.source_ip}

    nodes = []
    links = []

    # 1. Gateway Core Node
    gateway_id = "node-core-gw"
    nodes.append({
        "id": gateway_id,
        "name": "Cisco Core Gateway (192.168.1.1)",
        "ip": "192.168.1.1",
        "type": "Router",
        "category": "core",
        "status": "online",
        "is_suspicious": False,
        "vlan": "VLAN 10 (Management)"
    })

    # 2. Subnet Zones
    for net in networks:
        net_node_id = f"subnet-{net.id}"
        nodes.append({
            "id": net_node_id,
            "name": f"{net.name} ({net.cidr})",
            "ip": net.cidr,
            "type": "Subnet",
            "category": "subnet",
            "status": "online",
            "is_suspicious": False,
            "vlan": f"VLAN {net.vlan_id or 1}"
        })
        # Link subnet to core gateway
        links.append({
            "source": gateway_id,
            "target": net_node_id,
            "relationship": "Routed Inferred Link",
            "speed": "10 Gbps Trunk"
        })

    # 3. Discovered Devices
    for dev in devices:
        if dev.ip_address == "192.168.1.1":
            continue # already added as core gateway

        dev_node_id = f"device-{dev.id}"
        is_susp = dev.ip_address in suspicious_ips or not dev.is_authorized
        
        nodes.append({
            "id": dev_node_id,
            "name": dev.hostname or dev.ip_address,
            "ip": dev.ip_address,
            "mac": dev.mac_address,
            "type": dev.device_type,
            "category": "device",
            "status": dev.status,
            "is_authorized": dev.is_authorized,
            "is_suspicious": is_susp,
            "os": dev.os_name,
            "vlan": f"VLAN {dev.network.vlan_id}" if dev.network else "Unassigned"
        })

        # Connect device to its Subnet or Core
        target_subnet_id = f"subnet-{dev.network_id}" if dev.network_id else f"subnet-{networks[0].id if networks else gateway_id}"
        links.append({
            "source": target_subnet_id,
            "target": dev_node_id,
            "relationship": "Switchport Access Association",
            "speed": "1 Gbps Full Duplex"
        })

    return {
        "nodes": nodes,
        "links": links,
        "metadata": {
            "total_nodes": len(nodes),
            "total_links": len(links),
            "suspicious_nodes_count": len([n for n in nodes if n.get("is_suspicious")]),
            "inference_mode": "Logical Topology with Inferred Layer-2 Associations"
        }
    }
