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

SOPHOS_AUDIT_RULES = [
    {
        "category": "Perimeter Security",
        "severity": "Low",
        "finding": "Sophos Sandstorm Zero-Day Threat Cloud Connected",
        "recommendation": "Ensure behavioral detonation policy is set to 'Block until analysis complete'.",
        "rule_code": "SOPHOS-SEC-001"
    },
    {
        "category": "Inspection",
        "severity": "Medium",
        "finding": "SSL/TLS Decryption Bypass Active for Banking/Health Categories",
        "recommendation": "Audit exemption list quarterly to prevent C2 domain tunneling.",
        "rule_code": "SOPHOS-SEC-002"
    },
    {
        "category": "High Availability",
        "severity": "Info",
        "finding": "HA Cluster Mode: Active-Passive Link Synchronized",
        "recommendation": "Auxiliary unit heartbeats healthy across Dedicated HA Port 8.",
        "rule_code": "SOPHOS-SEC-003"
    }
]

def generate_cisco_telemetry(hostname: str = "cisco-core-sw01") -> Dict[str, Any]:
    """Generates telemetry for the primary Campus Core Switch (Catalyst 9300-48P)."""
    interfaces = []
    # Generate 48 ports for LibreNMS chassis matrix
    for p in range(1, 49):
        is_uplink = p in [47, 48]
        is_active = p in [1, 2, 3, 4, 5, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 47, 48]
        speed = 10000000000 if is_uplink else 1000000000
        port_name = f"TenGigabitEthernet1/1/{p-46}" if is_uplink else f"GigabitEthernet1/0/{p}"
        desc = "Core Fiber Uplink" if is_uplink else (f"Distribution Link (VLAN {10 if p%2==0 else 20})" if is_active else "Available Access Port")
        admin = "up" if is_active else "down"
        oper = "up" if is_active else "down"

        interfaces.append({
            "if_index": p,
            "name": port_name,
            "description": desc,
            "admin_status": admin,
            "oper_status": oper,
            "speed_bps": speed,
            "in_octets": random.randint(1000000, 15000000) if is_active else 0,
            "out_octets": random.randint(1200000, 20000000) if is_active else 0,
            "in_errors": random.randint(0, 2) if is_active else 0,
            "out_errors": 0,
            "crc_errors": random.randint(0, 1) if (is_active and p == 3) else 0,
            "link_flaps": 1 if p == 4 else 0,
            "utilization_percent": round(random.uniform(15.0, 68.0), 1) if is_active else 0.0,
            "vlan_id": 99 if is_uplink else (10 if p % 2 == 0 else 20),
            "port_mode": "Trunk" if is_uplink else "Access"
        })

    return {
        "hostname": hostname,
        "ip_address": "192.168.1.1",
        "model": "Cisco Catalyst 9300-48P",
        "device_type": "switch",
        "vendor": "Cisco",
        "location": "Central Campus Server Room - Rack A1",
        "snmp_version": "v3 (authPriv - SHA-256/AES-128)",
        "sys_descr": "Cisco IOS Software, Catalyst L3 Switch Software (CAT9K_IOSXE), Version 17.06.04",
        "uptime_seconds": 1245820,
        "cpu_usage": round(random.uniform(18.2, 34.5), 1),
        "memory_usage": round(random.uniform(42.0, 54.0), 1),
        "temperature_celsius": round(random.uniform(36.5, 41.2), 1),
        "status": "online",
        "last_poll": datetime.now(timezone.utc),
        "interfaces": interfaces,
        "audit_findings": CISCO_AUDIT_RULES
    }

def generate_college_switch_telemetry(
    hostname: str = "clg-lab-sw01",
    ip: str = "192.168.10.1",
    port_count: int = 24,
    vendor: str = "Cisco",
    model: str = "Catalyst 2960-24TT",
    location: str = "Computer Engineering Lab 1 - Rack 3"
) -> Dict[str, Any]:
    """Generates LibreNMS-style telemetry for a campus/college lab switch."""
    interfaces = []
    for p in range(1, port_count + 1):
        is_uplink = p >= (port_count - 1)
        is_active = is_uplink or (p in [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 14, 15, 16, 19, 20])
        speed = 1000000000
        port_name = f"GigabitEthernet0/{p}"
        desc = "Uplink to Campus Core" if is_uplink else (f"Lab Workstation PC-{p:02d} (Student VLAN)" if is_active else "Empty Patch Panel")
        admin = "up"
        oper = "up" if is_active else "down"

        interfaces.append({
            "if_index": p,
            "name": port_name,
            "description": desc,
            "admin_status": admin,
            "oper_status": oper,
            "speed_bps": speed,
            "in_octets": random.randint(400000, 8000000) if is_active else 0,
            "out_octets": random.randint(500000, 12000000) if is_active else 0,
            "in_errors": 1 if p == 8 else 0,
            "out_errors": 0,
            "crc_errors": 2 if p == 8 else 0,
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(12.0, 48.0), 1) if is_active else 0.0,
            "vlan_id": 99 if is_uplink else 20,
            "port_mode": "Trunk" if is_uplink else "Access"
        })

    return {
        "hostname": hostname,
        "ip_address": ip,
        "model": model,
        "device_type": "switch",
        "vendor": vendor,
        "location": location,
        "snmp_version": "v2c",
        "sys_descr": f"{vendor} IOS C2960 Software, Release 15.2(2)E8 - College Campus Network",
        "uptime_seconds": 684200,
        "cpu_usage": round(random.uniform(14.0, 26.0), 1),
        "memory_usage": round(random.uniform(32.0, 44.0), 1),
        "temperature_celsius": round(random.uniform(32.0, 36.5), 1),
        "status": "online",
        "last_poll": datetime.now(timezone.utc),
        "interfaces": interfaces,
        "audit_findings": CISCO_AUDIT_RULES[:3]
    }

def generate_sophos_firewall_telemetry(
    hostname: str = "sophos-xgs3300-clg",
    ip: str = "172.16.16.16",
    location: str = "College Main Border Perimeter Rack"
) -> Dict[str, Any]:
    """Generates telemetry for Sophos XGS Next-Gen Firewall."""
    interfaces = [
        {
            "if_index": 1,
            "name": "Port 1 (LAN)",
            "description": "Internal Campus Backbone (172.16.16.16/24)",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(45000000, 95000000),
            "out_octets": random.randint(85000000, 180000000),
            "in_errors": 0,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(42.0, 68.0), 1),
            "vlan_id": 1,
            "port_mode": "Routed"
        },
        {
            "if_index": 2,
            "name": "Port 2 (WAN 1 - Primary Fiber)",
            "description": "Airtel Leased Line 1Gbps (203.0.113.45)",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(70000000, 160000000),
            "out_octets": random.randint(50000000, 110000000),
            "in_errors": 0,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(48.5, 74.0), 1),
            "vlan_id": 0,
            "port_mode": "Gateway"
        },
        {
            "if_index": 3,
            "name": "Port 3 (WAN 2 - Backup Fiber)",
            "description": "Jio Business Backup 500Mbps (198.51.100.12)",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 500000000,
            "in_octets": random.randint(2000000, 8000000),
            "out_octets": random.randint(1500000, 6000000),
            "in_errors": 0,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(4.0, 12.0), 1),
            "vlan_id": 0,
            "port_mode": "Gateway-Standby"
        },
        {
            "if_index": 4,
            "name": "Port 4 (DMZ - Web/ERP)",
            "description": "College ERP & Web Portals (192.168.100.1/24)",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(12000000, 35000000),
            "out_octets": random.randint(22000000, 65000000),
            "in_errors": 0,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(22.0, 38.0), 1),
            "vlan_id": 100,
            "port_mode": "Routed"
        },
        {
            "if_index": 5,
            "name": "Port 5 (Campus WiFi)",
            "description": "Student & Faculty WiFi APs (10.50.0.1/16)",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(30000000, 80000000),
            "out_octets": random.randint(55000000, 140000000),
            "in_errors": 1,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 0,
            "utilization_percent": round(random.uniform(52.0, 78.0), 1),
            "vlan_id": 50,
            "port_mode": "Routed"
        },
        {
            "if_index": 6,
            "name": "Port 8 (HA Dedicated Sync)",
            "description": "Heartbeat & State Table Sync to Secondary Node",
            "admin_status": "up",
            "oper_status": "up",
            "speed_bps": 1000000000,
            "in_octets": random.randint(500000, 2000000),
            "out_octets": random.randint(500000, 2000000),
            "in_errors": 0,
            "out_errors": 0,
            "crc_errors": 0,
            "link_flaps": 0,
            "utilization_percent": 1.2,
            "vlan_id": 999,
            "port_mode": "HA-Sync"
        }
    ]

    extra_data = {
        "active_sessions": random.randint(4200, 5600),
        "sessions_limit": 1000000,
        "bandwidth_in_mbps": round(random.uniform(280.0, 440.0), 1),
        "bandwidth_out_mbps": round(random.uniform(110.0, 220.0), 1),
        "ha_status": "Active-Passive (Auxiliary Node Synchronized)",
        "firmware_version": "SFOS 20.0.1 MR-1-Build342",
        "atp_status": "Active (14 C2 Botnet requests dropped today)",
        "ips_status": "Active (18,420 Signatures, Engine 4.2.1)",
        "web_protection": "Zero-Day Sandstorm Cloud Sandbox Active (0 Malicious Payloads Allowed)",
        "ssl_inspection": "Hardware Accelerated (Xstream Architecture, 88% Encrypted Streams Inspected)",
        "vpn_tunnels": [
            {
                "name": "IPsec-Campus-Hostel-Branch",
                "type": "Site-to-Site IPsec",
                "remote_ip": "103.21.244.10",
                "status": "UP",
                "uptime": "28 days",
                "rx_bytes": "48.2 GB",
                "tx_bytes": "82.5 GB"
            },
            {
                "name": "IPsec-University-Central-DC",
                "type": "Site-to-Site IPsec",
                "remote_ip": "14.139.120.2",
                "status": "UP",
                "uptime": "64 days",
                "rx_bytes": "142.1 GB",
                "tx_bytes": "98.4 GB"
            },
            {
                "name": "Remote-Access-SSL-VPN",
                "type": "Client SSL VPN",
                "connected_users": random.randint(34, 48),
                "status": "UP",
                "pool": "10.81.234.0/24"
            }
        ],
        "wan_links": [
            {
                "name": "Airtel Leased Line (Primary)",
                "interface": "Port 2",
                "ip": "203.0.113.45",
                "gateway": "203.0.113.1",
                "speed": "1 Gbps",
                "status": "Active",
                "latency_ms": round(random.uniform(2.8, 4.2), 1),
                "packet_loss": "0%"
            },
            {
                "name": "Jio Fiber Commercial (Backup)",
                "interface": "Port 3",
                "ip": "198.51.100.12",
                "gateway": "198.51.100.1",
                "speed": "500 Mbps",
                "status": "Standby (Auto-Failover)",
                "latency_ms": round(random.uniform(4.5, 6.2), 1),
                "packet_loss": "0%"
            }
        ],
        "firewall_rules_summary": [
            {"id": 1, "name": "LAN to WAN - Web Browsing (HTTP/HTTPS)", "action": "ACCEPT", "log": "ENABLE", "hits": "1.42M hits"},
            {"id": 2, "name": "College ERP & Portal Access", "action": "ACCEPT", "log": "ENABLE", "hits": "285k hits"},
            {"id": 3, "name": "Block P2P, BitTorrent & Crypto Miners (L7 App Control)", "action": "DROP", "log": "ENABLE", "hits": "19.8k drops"},
            {"id": 4, "name": "Block Malicious Botnet & C2 Domains (Sophos ATP)", "action": "DROP", "log": "ALERT", "hits": "164 drops"},
            {"id": 5, "name": "Default Drop Perimeter Rule", "action": "DROP", "log": "ENABLE", "hits": "92.4k drops"}
        ]
    }

    return {
        "hostname": hostname,
        "ip_address": ip,
        "model": "Sophos XGS 3300",
        "device_type": "firewall",
        "vendor": "Sophos",
        "location": location,
        "snmp_version": "v3 (authPriv)",
        "sys_descr": "Sophos SFOS 20.0.1 MR-1 (XGS3300) Security Gateway Appliance",
        "uptime_seconds": 2184000,
        "cpu_usage": round(random.uniform(24.5, 38.2), 1),
        "memory_usage": round(random.uniform(52.0, 61.5), 1),
        "temperature_celsius": round(random.uniform(41.0, 45.2), 1),
        "status": "online",
        "last_poll": datetime.now(timezone.utc),
        "interfaces": interfaces,
        "audit_findings": SOPHOS_AUDIT_RULES,
        "extra_data_json": extra_data
    }

def poll_device_telemetry(device: Any) -> Dict[str, Any]:
    """Generates updated real-time telemetry pulse for any infrastructure device."""
    # Slightly vary CPU, Memory, Temp, and interface octets
    device.cpu_usage = max(5.0, min(95.0, round(device.cpu_usage + random.uniform(-4.0, 4.0), 1)))
    device.memory_usage = max(10.0, min(90.0, round(device.memory_usage + random.uniform(-1.5, 1.5), 1)))
    device.temperature_celsius = max(28.0, min(65.0, round(device.temperature_celsius + random.uniform(-0.4, 0.4), 1)))
    device.uptime_seconds += 5
    device.last_poll = datetime.now(timezone.utc)

    for iface in device.interfaces:
        if iface.oper_status == "up":
            iface.in_octets += random.randint(15000, 250000)
            iface.out_octets += random.randint(20000, 350000)
            iface.utilization_percent = max(1.0, min(99.0, round(iface.utilization_percent + random.uniform(-3.0, 3.0), 1)))

    if device.device_type == "firewall" and device.extra_data_json:
        data = dict(device.extra_data_json)
        data["active_sessions"] = max(100, min(20000, data.get("active_sessions", 4500) + random.randint(-50, 50)))
        data["bandwidth_in_mbps"] = max(10.0, round(data.get("bandwidth_in_mbps", 320.0) + random.uniform(-15.0, 15.0), 1))
        data["bandwidth_out_mbps"] = max(5.0, round(data.get("bandwidth_out_mbps", 140.0) + random.uniform(-8.0, 8.0), 1))
        device.extra_data_json = data

    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
