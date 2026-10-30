from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.core.ws_manager import ws_manager
from app.models.models import User
from app.monitoring.traffic_monitor import traffic_monitor

router = APIRouter(prefix="/traffic", tags=["Traffic Analyzer"])

@router.get("/summary")
def get_traffic_summary(current_user: User = Depends(get_current_user)):
    return traffic_monitor.get_traffic_summary()

@router.get("/packets")
def get_packets(
    protocol: Optional[str] = None,
    ip: Optional[str] = None,
    suspicious_only: Optional[bool] = None,
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user)
):
    # Ensure fresh packets in history
    if len(traffic_monitor.packet_history) < 30:
        for _ in range(30):
            traffic_monitor.generate_live_packet()

    packets = traffic_monitor.packet_history[-limit:]
    filtered = []
    for p in reversed(packets):
        if protocol and p["protocol"].upper() != protocol.upper():
            continue
        if ip and (p["source_ip"] != ip and p["destination_ip"] != ip):
            continue
        if suspicious_only and not p["is_suspicious"]:
            continue
        filtered.append(p)
    return filtered

@router.post("/pulse")
async def pulse_packet(current_user: User = Depends(get_current_user)):
    """Generates a live packet and broadcasts it to connected WebSocket clients."""
    pkt = traffic_monitor.generate_live_packet()
    await ws_manager.broadcast({
        "type": "NEW_PACKET",
        "packet": pkt
    })
    return pkt
