import random
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

CISCO_AUDIT_RULES = [
    {
        "category": "Authentication",
        "severity": "Critical",
        "finding": "Telnet Administrative Service is Enabled (Port 23)",
        "recommendation": "Configure 'line vty 0 15' with 'transport input ssh' and disable telnet.",
        "rule_code": "CISCO-SEC-001"
    },
    {
        "category": "Management",
        "severity": "High",
        "finding": "Default or Weak SNMP Community String in Use ('public')",
        "recommendation": "Remove SNMPv2 community 'public'. Upgrade to SNMPv3 with authPriv (SHA/AES encryption).",
        "rule_code": "CISCO-SEC-002"
    },
    {
        "category": "Encryption",
        "severity": "Medium",
        "finding": "Enable Password Configured Using Weak Type 7 Encryption",
        "recommendation": "Migrate enable password to PBKDF2 Type 9 or Scrypt encryption via 'enable algorithm-type sha256 secret'.",
        "rule_code": "CISCO-SEC-003"
    },
    {
        "category": "Spanning Tree Security",
        "severity": "High",
        "finding": "STP BPDU Guard Not Configured on Access Switchports",
        "recommendation": "Execute 'spanning-tree portfast bpduguard default' globally to prevent rogue switch loops.",
        "rule_code": "CISCO-SEC-004"
    },
    {
        "category": "Control Plane",
        "severity": "Medium",
        "finding": "Cisco Discovery Protocol (CDP) Enabled on Internet-Facing Interfaces",
        "recommendation": "Execute 'no cdp enable' on all perimeter interfaces to stop device topology reconnaissance.",
        "rule_code": "CISCO-SEC-005"
    }
]

def generate_cisco_telemetry(hostname: str = "cisco-core-sw01") -> Dict[str, Any]:
    """
    Simulates / polls real-time SNMP telemetry for a Cisco Enterprise Switch/Router.
    """
    interfaces = [
        {
            "if_index": 1,
            "name": "GigabitEthernet1/0/1",
            "description": "Uplink to Edge Firewall (Active)",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(5000000, 12000000),
            "out_octets": random.randint(6000000, 15000000),
            "in_errors": random.randint(0, 3),
            "out_errors": 0,
            "crc_errors": random.randint(0, 2),
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(22.4, 45.1), 1)
        },
        {
            "if_index": 2,
            "name": "GigabitEthernet1/0/2",
            "description": "Trunk to Distribution Switch 02",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(2000000, 8000000),
            "out_octets": random.randint(2500000, 9000000),
            "in_errors": 0,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(14.2, 28.6), 1)
        },
        {
            "if_index": 3,
            "name": "GigabitEthernet1/0/3",
            "description": "DMZ Web Server Farm (srv-web-prod-10)",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(8000000, 25000000),
            "out_octets": random.randint(12000000, 35000000),
            "in_errors": random.randint(1, 5),
            "out_errors": 0,
            "crc_errors": random.randint(1, 4),
            "link_flaps": random.randint(0, 1),
            "utilization_percent": round(random.uniform(55.0, 78.4), 1)
        },
        {
            "if_index": 4,
            "name": "GigabitEthernet1/0/4",
            "description": "Engineering Workstations Subnet",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(3000000, 7000000),
            "out_octets": random.randint(3500000, 8000000),
            "in_errors": 0,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 2,
            "utilization_percent": round(random.uniform(18.0, 32.5), 1)
        },
        {
            "if_index": 5,
            "name": "TenGigabitEthernet1/1/1",
            "description": "Core Fiber Interconnect to Backup DC",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 10000000000,
            "in_octets": random.randint(50000000, 150000000),
            "out_octets": random.randint(45000000, 120000000),
            "in_errors": 0,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(8.5, 15.2), 1)
        }
    ]

    return {
        "hostname": hostname,
        "ip_address": "192.168.1.1",
        "model": "Cisco Catalyst 9300-48P",
        "snmp_version": "v3 (authPriv - SHA-256/AES-128)",
        "sys_descr": "Cisco IOS Software, Catalyst L3 Switch Software (CAT9K_IOSXE), Version 17.06.04",
        "uptime_seconds": 1245820, # ~14.4 days
        "cpu_usage": round(random.uniform(18.2, 34.5), 1),
        "memory_usage": round(random.uniform(42.0, 54.0), 1),
        "temperature_celsius": round(random.uniform(36.5, 41.2), 1),
        "status": "online",
        "last_poll": datetime.now(timezone.utc),
        "interfaces": interfaces,
        "audit_findings": CISCO_AUDIT_RULES
    }
