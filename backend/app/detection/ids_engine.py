import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

PREDEFINED_IDS_RULES = [
    {
        "category": "Port Scan",
        "title": "ET SCAN Suspicious Rapid TCP SYN Scan Across Multi-Port Targets",
        "severity": "High",
        "engine": "Suricata",
        "sid": 2000341,
        "recommendation": "Inspect source host for port scanning utility (nmap/masscan). Check firewall drop logs and evaluate host containment.",
        "evidence_template": {"packets_per_sec": 450, "unique_dst_ports": 84, "flag": "SYN"}
    },
    {
        "category": "ARP Spoofing",
        "title": "ZEEK_ARP_SPOOF Inconsistent MAC-to-IP Binding Detected on Local Segment",
        "severity": "Critical",
        "engine": "Zeek",
        "sid": 4001920,
        "recommendation": "Check switch port security and Dynamic ARP Inspection (DAI). Isolate rogue host issuing conflicting ARP replies.",
        "evidence_template": {"claimed_ip": "192.168.1.1", "rogue_mac": "B8:27:EB:AA:19:88", "original_mac": "00:00:0C:4A:88:01"}
    },
    {
        "category": "DNS Anomaly",
        "title": "ET TROJAN High Entropy Subdomain Query Stream (Possible DNS Exfiltration/C2)",
        "severity": "High",
        "engine": "Suricata",
        "sid": 2024810,
        "recommendation": "Block malicious parent domain on recursive resolvers. Capture DNS query payloads to inspect base64 encoded data chunks.",
        "evidence_template": {"query_domain": "x9a8f2k01.tunnel.darknet-sync.cc", "entropy_score": 4.82, "query_type": "TXT"}
    },
    {
        "category": "SYN Flood",
        "title": "ET DOS Possible SYN Flood Exhaustion Attack on Web Cluster",
        "severity": "Critical",
        "engine": "Suricata",
        "sid": 2011299,
        "recommendation": "Enable TCP SYN Cookies on border edge firewall and rate-limit incomplete TCP handshakes.",
        "evidence_template": {"syn_rate": "8,200 syn/sec", "ratio_syn_ack": 0.04, "target_cluster": "srv-web-prod-10"}
    },
    {
        "category": "Brute Force",
        "title": "ZEEK_SSH_BRUTE Excessive Failed SSH Authentication Attempts (Threshold Exceeded)",
        "severity": "Medium",
        "engine": "Zeek",
        "sid": 4005112,
        "recommendation": "Temporarily block source IP at edge firewall, review SSH auth logs, and verify whether public key auth is strictly enforced.",
        "evidence_template": {"failed_attempts": 65, "duration_sec": 45, "usernames_tried": ["root", "admin", "cisco", "ubuntu"]}
    },
    {
        "category": "Exfiltration",
        "title": "ET POLICY Unusual Outbound Data Burst to Unclassified External Cloud IP",
        "severity": "High",
        "engine": "Suricata",
        "sid": 2031140,
        "recommendation": "Determine process initiating large outbound upload. Isolate workstation and review endpoint file access telemetry.",
        "evidence_template": {"bytes_transferred": "4.2 GB", "destination_geo": "Netherlands", "protocol": "HTTPS (Port 8443)"}
    },
    {
        "category": "Malicious IP",
        "title": "ET DROP Known Cobalt Strike C2 Listener Outbound Beacon Connection",
        "severity": "Critical",
        "engine": "Suricata",
        "sid": 2049102,
        "recommendation": "Immediately sever network connection of source host. Collect memory dump and triage running processes for DLL injection.",
        "evidence_template": {"ja3_fingerprint": "a0e9f5d64349fb13191bc781f81f42e1", "beacon_interval": "60s (jitter 15%)"}
    },
    {
        "category": "Lateral Movement",
        "title": "ZEEK_SMB_PSEXEC Remote Service Execution Detected Over SMB Pipe (Possible PsExec)",
        "severity": "High",
        "engine": "Zeek",
        "sid": 4008101,
        "recommendation": "Verify whether administrative action was authorized. Check Event ID 7045/4697 on destination domain controller.",
        "evidence_template": {"pipe_name": "\\PIPE\\svcctl", "service_name": "PSEXESVC", "src_host": "ws-eng-user-105"}
    }
]

def generate_ids_alert(rule_index: int = None, src_ip: str = None, dst_ip: str = None) -> Dict[str, Any]:
    import random
    if rule_index is not None and 0 <= rule_index < len(PREDEFINED_IDS_RULES):
        rule = PREDEFINED_IDS_RULES[rule_index]
    else:
        rule = random.choice(PREDEFINED_IDS_RULES)

    s_ip = src_ip or f"192.168.1.{random.choice([10, 20, 25, 105, 110])}"
    d_ip = dst_ip or f"192.168.1.{random.choice([1, 10, 20])}" if rule["category"] in ["ARP Spoofing", "Lateral Movement", "Port Scan"] else random.choice(["185.220.101.5", "198.51.100.23", "203.0.113.88", "142.250.190.46"])

    alert_id = f"ALT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    
    return {
        "alert_id": alert_id,
        "title": rule["title"],
        "category": rule["category"],
        "severity": rule["severity"],
        "source_ip": s_ip,
        "destination_ip": d_ip,
        "source_port": random.randint(1024, 65535),
        "destination_port": 445 if rule["category"] == "Lateral Movement" else (53 if rule["category"] == "DNS Anomaly" else (22 if rule["category"] == "Brute Force" else 443)),
        "protocol": "UDP" if rule["category"] == "DNS Anomaly" else "TCP",
        "detection_engine": rule["engine"],
        "status": "New",
        "evidence_json": {
            "signature_id": rule["sid"],
            "rule_engine": rule["engine"],
            "telemetry_metrics": rule["evidence_template"],
            "detection_type": "Confirmed Rule Match" if rule["engine"] == "Suricata" else "Behavioral Heuristic"
        },
        "recommendation": rule["recommendation"],
        "is_escalated": False,
        "created_at": datetime.now(timezone.utc)
    }
