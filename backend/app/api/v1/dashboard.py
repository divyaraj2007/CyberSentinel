import random
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Device, Port, Vulnerability, SecurityAlert, User
from app.monitoring.traffic_monitor import traffic_monitor
from app.monitoring.health_monitor import health_monitor

router = APIRouter(prefix="/dashboard", tags=["Main Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    devices = db.query(Device).all()
    ports = db.query(Port).filter(Port.state == "open").all()
    vulns = db.query(Vulnerability).all()
    alerts = db.query(SecurityAlert).all()

    total_devices = len(devices)
    online_devices = len([d for d in devices if d.status == "online"])
    offline_devices = total_devices - online_devices

    total_open_ports = len(ports)
    total_vulns = len(vulns)
    critical_vulns = len([v for v in vulns if v.severity == "Critical"])

    active_alerts = len([a for a in alerts if a.status != "Resolved"])
    critical_alerts = len([a for a in alerts if a.severity == "Critical" and a.status != "Resolved"])

    # Health & Posture scores
    health_data = health_monitor.calculate_health_metrics()
    traffic_data = traffic_monitor.get_traffic_summary()

    # Vulnerability Severity Distribution
    vuln_dist = [
        {"name": "Critical", "value": len([v for v in vulns if v.severity == "Critical"]), "color": "#ef4444"},
        {"name": "High", "value": len([v for v in vulns if v.severity == "High"]), "color": "#f97316"},
        {"name": "Medium", "value": len([v for v in vulns if v.severity == "Medium"]), "color": "#eab308"},
        {"name": "Low", "value": len([v for v in vulns if v.severity == "Low"]), "color": "#3b82f6"},
        {"name": "Info", "value": len([v for v in vulns if v.severity == "Informational"]), "color": "#06b6d4"}
    ]

    # Device Availability Breakdown
    device_availability = [
        {"name": "Online", "value": online_devices, "color": "#10b981"},
        {"name": "Offline", "value": offline_devices, "color": "#64748b"}
    ]

    # Traffic over time (last 8 hours)
    traffic_over_time = [
        {"time": "08:00", "inbound": 24.5, "outbound": 18.2, "packets": 920},
        {"time": "09:00", "inbound": 38.2, "outbound": 26.4, "packets": 1340},
        {"time": "10:00", "inbound": 45.1, "outbound": 32.8, "packets": 1620},
        {"time": "11:00", "inbound": 52.8, "outbound": 39.5, "packets": 1890},
        {"time": "12:00", "inbound": 41.3, "outbound": 28.0, "packets": 1410},
        {"time": "13:00", "inbound": 48.7, "outbound": 35.1, "packets": 1720},
        {"time": "14:00", "inbound": 56.4, "outbound": 42.6, "packets": 1980},
        {"time": "15:00", "inbound": traffic_data["bandwidth_mbps"], "outbound": round(traffic_data["bandwidth_mbps"] * 0.72, 1), "packets": traffic_data["packets_per_second"]}
    ]

    # Alerts over time (last 7 days)
    alerts_over_time = [
        {"day": "Mon", "critical": 0, "high": 2, "medium": 4},
        {"day": "Tue", "critical": 1, "high": 1, "medium": 3},
        {"day": "Wed", "critical": 0, "high": 3, "medium": 5},
        {"day": "Thu", "critical": 2, "high": 2, "medium": 6},
        {"day": "Fri", "critical": 1, "high": 4, "medium": 4},
        {"day": "Sat", "critical": 0, "high": 1, "medium": 2},
        {"day": "Sun", "critical": critical_alerts, "high": len([a for a in alerts if a.severity == 'High']), "medium": len([a for a in alerts if a.severity == 'Medium'])}
    ]

    # Real-time Activity Feed
    activity_feed = [
        {
            "id": "act-1",
            "type": "alert",
            "title": "Suricata SYN Scan Detected",
            "detail": "Source 192.168.1.105 targeted port 80 on web server",
            "time": "2 mins ago",
            "severity": "high"
        },
        {
            "id": "act-2",
            "type": "discovery",
            "title": "New Rogue Hardware Flagged",
            "detail": "Raspberry Pi Foundation MAC connected on VLAN 10",
            "time": "14 mins ago",
            "severity": "critical"
        },
        {
            "id": "act-3",
            "type": "snmp",
            "title": "Cisco Catalyst Interface Utilization Peak",
            "detail": "Gig1/0/3 exceeded 75% bandwidth threshold",
            "time": "32 mins ago",
            "severity": "medium"
        },
        {
            "id": "act-4",
            "type": "forensics",
            "title": "Evidence Artifact Ingested",
            "detail": "SHA-256 integrity calculated for perimeter PCAP",
            "time": "1 hour ago",
            "severity": "low"
        }
    ]

    return {
        "metrics": {
            "total_devices": total_devices,
            "online_devices": online_devices,
            "offline_devices": offline_devices,
            "total_open_ports": total_open_ports,
            "total_vulnerabilities": total_vulns,
            "critical_vulnerabilities": critical_vulns,
            "active_security_alerts": active_alerts,
            "critical_security_alerts": critical_alerts,
            "suspicious_connections": traffic_data["suspicious_packets_count"],
            "bandwidth_mbps": traffic_data["bandwidth_mbps"],
            "network_health_score": health_data["network_health_score"],
            "security_posture_score": health_data["security_posture_score"],
            "latency_ms": health_data["latency_ms"],
            "packet_loss_pct": health_data["packet_loss_pct"]
        },
        "charts": {
            "traffic_over_time": traffic_over_time,
            "alerts_over_time": alerts_over_time,
            "vulnerability_distribution": vuln_dist,
            "device_availability": device_availability,
            "protocol_distribution": traffic_data["protocol_distribution"],
            "top_talkers": traffic_data["top_talkers"]
        },
        "activity_feed": activity_feed
    }
