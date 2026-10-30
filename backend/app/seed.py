import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    Role, User, Network, Device, Port, Vulnerability,
    SecurityAlert, Incident, IncidentEvidence, CiscoDevice,
    CiscoInterface, CiscoAuditFinding, ThreatIndicator,
    ResponseAction, NotificationSetting
)

logger = logging.getLogger(__name__)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Role).first():
            logger.info("Database already seeded. Skipping initial seed.")
            return

        logger.info("Seeding CyberSentinel database...")

        # 1. Roles
        roles = {
            "Super Administrator": Role(
                name="Super Administrator",
                description="Complete platform access, manages users, configurations, and network policies.",
                permissions=["*"]
            ),
            "Security Administrator": Role(
                name="Security Administrator",
                description="Monitors networks, performs scans, manages vulnerabilities and incidents.",
                permissions=["networks:*", "scans:*", "vulnerabilities:*", "incidents:*", "alerts:*"]
            ),
            "Security Analyst": Role(
                name="Security Analyst",
                description="Views security events, analyzes traffic, investigates alerts and generates reports.",
                permissions=["events:read", "traffic:read", "alerts:read", "alerts:update", "reports:*"]
            ),
            "Viewer": Role(
                name="Viewer",
                description="Read-only dashboard and reporting access.",
                permissions=["dashboard:read", "reports:read", "networks:read"]
            )
        }

        for r in roles.values():
            db.add(r)
        db.flush()

        # 2. Users
        admin_user = User(
            username="admin",
            email="admin@cybersentinel.local",
            full_name="Chief Information Security Officer",
            hashed_password=get_password_hash("CyberAdmin2026!"),
            role_id=roles["Super Administrator"].id,
            is_active=True
        )
        secadmin_user = User(
            username="secadmin",
            email="secadmin@cybersentinel.local",
            full_name="Lead Security Engineer",
            hashed_password=get_password_hash("SecAdmin2026!"),
            role_id=roles["Security Administrator"].id,
            is_active=True
        )
        analyst_user = User(
            username="analyst",
            email="analyst@cybersentinel.local",
            full_name="SOC Tier-2 Analyst",
            hashed_password=get_password_hash("Analyst2026!"),
            role_id=roles["Security Analyst"].id,
            is_active=True
        )
        viewer_user = User(
            username="viewer",
            email="viewer@cybersentinel.local",
            full_name="Audit Compliance Officer",
            hashed_password=get_password_hash("Viewer2026!"),
            role_id=roles["Viewer"].id,
            is_active=True
        )

        db.add_all([admin_user, secadmin_user, analyst_user, viewer_user])
        db.flush()

        # 3. Authorized Networks
        net_corp = Network(
            name="Corporate Management LAN",
            cidr="192.168.1.0/24",
            vlan_id=10,
            gateway="192.168.1.1",
            description="Primary secure operational subnet for enterprise servers and admin consoles.",
            is_authorized=True,
            scan_enabled=True
        )
        net_dmz = Network(
            name="DMZ Public Services",
            cidr="10.0.0.0/24",
            vlan_id=20,
            gateway="10.0.0.1",
            description="Demilitarized perimeter zone hosting public reverse proxies and APIs.",
            is_authorized=True,
            scan_enabled=True
        )
        net_wifi = Network(
            name="Corporate Secure Wireless",
            cidr="172.16.10.0/24",
            vlan_id=30,
            gateway="172.16.10.1",
            description="802.1X WPA3 Enterprise wireless network for staff laptops.",
            is_authorized=True,
            scan_enabled=True
        )

        db.add_all([net_corp, net_dmz, net_wifi])
        db.flush()

        # 4. Devices
        dev_router = Device(
            ip_address="192.168.1.1",
            mac_address="00:00:0C:4A:88:01",
            hostname="cisco-edge-gw01.corp.local",
            manufacturer="Cisco Systems",
            os_name="Cisco IOS-XE 17.6.4",
            device_type="Router",
            status="online",
            is_authorized=True,
            network_id=net_corp.id,
            notes="Border gateway routing internal traffic to ISP"
        )
        dev_web = Device(
            ip_address="192.168.1.10",
            mac_address="18:66:DA:5F:88:10",
            hostname="srv-web-prod-10.corp.local",
            manufacturer="Dell Inc.",
            os_name="Ubuntu Linux 22.04 LTS",
            device_type="Server",
            status="online",
            is_authorized=True,
            network_id=net_corp.id,
            notes="Hosts internal customer portal backend"
        )
        dev_ad = Device(
            ip_address="192.168.1.20",
            mac_address="00:50:56:8C:3D:20",
            hostname="ad-dc01.corp.local",
            manufacturer="VMware, Inc.",
            os_name="Microsoft Windows Server 2022",
            device_type="Server",
            status="online",
            is_authorized=True,
            network_id=net_corp.id,
            notes="Primary Domain Controller & Active Directory Kerberos KDC"
        )
        dev_db = Device(
            ip_address="192.168.1.25",
            mac_address="18:66:DA:99:A1:25",
            hostname="db-postgres-cluster.corp.local",
            manufacturer="Dell Inc.",
            os_name="Red Hat Enterprise Linux 9",
            device_type="Server",
            status="online",
            is_authorized=True,
            network_id=net_corp.id,
            notes="High availability PostgreSQL database cluster"
        )
        dev_cam = Device(
            ip_address="192.168.1.50",
            mac_address="24:F5:A2:33:44:50",
            hostname="iot-camera-surveillance-50",
            manufacturer="Ubiquiti Networks",
            os_name="Embedded Linux",
            device_type="IoT",
            status="online",
            is_authorized=True,
            network_id=net_corp.id,
            notes="Lobby building physical security camera"
        )
        dev_rogue = Device(
            ip_address="192.168.1.105",
            mac_address="B8:27:EB:AA:19:88",
            hostname="kali-attacker-box.local",
            manufacturer="Raspberry Pi Foundation",
            os_name="Kali Linux 2024.1",
            device_type="Endpoint",
            status="online",
            is_authorized=False, # UNAUTHORIZED ROGUE DEVICE!
            network_id=net_corp.id,
            notes="FLAGGED: Unrecognized hardware connected to switchport Gig1/0/4 conducting port scans."
        )

        db.add_all([dev_router, dev_web, dev_ad, dev_db, dev_cam, dev_rogue])
        db.flush()

        # 5. Open Ports & Services
        ports = [
            # Router
            Port(device_id=dev_router.id, port_number=22, protocol="TCP", state="open", service_name="ssh", service_product="Cisco SSH", service_version="Cisco IOS SSH 2.0", risk_level="Low", banner="SSH-2.0-Cisco-1.25"),
            Port(device_id=dev_router.id, port_number=23, protocol="TCP", state="open", service_name="telnet", service_product="Cisco Telnet", service_version="Cisco Telnet Daemon", risk_level="Critical", banner="Cisco IOS Telnet"),
            Port(device_id=dev_router.id, port_number=161, protocol="UDP", state="open", service_name="snmp", service_product="Cisco SNMP", service_version="SNMPv2c/v3 Agent", risk_level="High", banner="Cisco SNMPv3 Engine"),
            # Web Server
            Port(device_id=dev_web.id, port_number=22, protocol="TCP", state="open", service_name="ssh", service_product="OpenSSH", service_version="OpenSSH 8.9p1 Ubuntu", risk_level="Low", banner="SSH-2.0-OpenSSH_8.9p1"),
            Port(device_id=dev_web.id, port_number=80, protocol="TCP", state="open", service_name="http", service_product="Apache httpd", service_version="Apache 2.4.49", risk_level="Critical", banner="Apache/2.4.49 (Ubuntu)"),
            Port(device_id=dev_web.id, port_number=443, protocol="TCP", state="open", service_name="https", service_product="Apache httpd", service_version="Apache 2.4.49 TLS", risk_level="Critical", banner="Apache/2.4.49 (TLS 1.3)"),
            # Active Directory
            Port(device_id=dev_ad.id, port_number=53, protocol="TCP", state="open", service_name="domain", service_product="Microsoft DNS", service_version="Windows Server 2022 DNS", risk_level="Low", banner="Microsoft DNS"),
            Port(device_id=dev_ad.id, port_number=88, protocol="TCP", state="open", service_name="kerberos-sec", service_product="Microsoft Kerberos", service_version="Windows 2022 KDC", risk_level="Low", banner="Kerberos v5"),
            Port(device_id=dev_ad.id, port_number=389, protocol="TCP", state="open", service_name="ldap", service_product="Active Directory LDAP", service_version="AD DS LDAP", risk_level="High", banner="Active Directory LDAP"),
            Port(device_id=dev_ad.id, port_number=445, protocol="TCP", state="open", service_name="microsoft-ds", service_product="Windows SMB", service_version="SMBv2/v3", risk_level="Critical", banner="Windows Server SMB"),
            Port(device_id=dev_ad.id, port_number=3389, protocol="TCP", state="open", service_name="ms-wbt-server", service_product="Microsoft Terminal Services", service_version="RDP", risk_level="High", banner="RDP"),
            # Database
            Port(device_id=dev_db.id, port_number=5432, protocol="TCP", state="open", service_name="postgresql", service_product="PostgreSQL", service_version="PostgreSQL 15.3", risk_level="Medium", banner="PostgreSQL Database")
        ]
        db.add_all(ports)
        db.flush()

        # 6. Real Vulnerabilities mapped to CVEs
        vulns = [
            Vulnerability(
                cve_id="CVE-2021-41773",
                title="Apache HTTP Server 2.4.49 Path Traversal and RCE",
                description="A flaw in path normalization in Apache HTTP Server 2.4.49 allows an unauthenticated attacker to map URLs to files outside configured directories via path traversal.",
                cvss_score=9.8,
                severity="Critical",
                affected_service="Apache HTTP Server 2.4.49",
                affected_version="2.4.49",
                remediation="Immediately upgrade Apache HTTP Server to version 2.4.51 or higher. Verify mod_alias configurations.",
                status="Open",
                device_id=dev_web.id,
                is_potential=False
            ),
            Vulnerability(
                cve_id="CVE-PLAIN-TELNET",
                title="Insecure Plaintext Telnet Protocol Administrative Access",
                description="Telnet service exposes cleartext credentials across network switches, easily sniffed by local unauthorized taps.",
                cvss_score=7.5,
                severity="High",
                affected_service="Cisco Telnet Daemon",
                affected_version="Cisco IOS 15.x",
                remediation="Disable 'transport input telnet' on line vty. Configure SSHv2 exclusively.",
                status="Open",
                device_id=dev_router.id,
                is_potential=False
            ),
            Vulnerability(
                cve_id="CVE-2020-15778",
                title="OpenSSH 8.9p1 scp Command Injection Vector",
                description="Potential command injection via shell metacharacters in SCP command pathways if scp is permitted without restrictive shell wrappers.",
                cvss_score=7.8,
                severity="High",
                affected_service="OpenSSH",
                affected_version="8.9p1",
                remediation="Migrate internal scripts from SCP to SFTP or rsync. Enforce forced-commands in authorized_keys.",
                status="Investigating",
                device_id=dev_web.id,
                is_potential=True
            ),
            Vulnerability(
                cve_id="CVE-2017-0144",
                title="Microsoft SMBv1 Remote Code Execution (EternalBlue)",
                description="Remote code execution vulnerability in SMBv1 protocol handling specially crafted requests.",
                cvss_score=9.8,
                severity="Critical",
                affected_service="Windows SMB",
                affected_version="SMBv1/SMBv2",
                remediation="Ensure SMBv1 is disabled completely via PowerShell: Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol.",
                status="Remediated",
                device_id=dev_ad.id,
                is_potential=False
            )
        ]
        db.add_all(vulns)
        db.flush()

        # 7. Security Alerts (Suricata / Zeek)
        alerts = [
            SecurityAlert(
                alert_id="ALT-20261030-001",
                title="ET SCAN Suspicious Rapid TCP SYN Scan Across Multi-Port Targets",
                category="Port Scan",
                severity="High",
                source_ip="192.168.1.105",
                destination_ip="192.168.1.10",
                source_port=48921,
                destination_port=80,
                protocol="TCP",
                detection_engine="Suricata",
                status="Investigating",
                evidence_json={
                    "signature_id": 2000341,
                    "packets_per_sec": 480,
                    "scanned_ports": [21, 22, 23, 80, 443, 3306, 8080],
                    "flag": "SYN"
                },
                recommendation="Isolate unauthorized source host 192.168.1.105 from the subnet immediately.",
                is_escalated=True
            ),
            SecurityAlert(
                alert_id="ALT-20261030-002",
                title="ZEEK_ARP_SPOOF Inconsistent MAC-to-IP Binding Detected on Local Segment",
                category="ARP Spoofing",
                severity="Critical",
                source_ip="192.168.1.105",
                destination_ip="192.168.1.1",
                source_port=None,
                destination_port=None,
                protocol="ARP",
                detection_engine="Zeek",
                status="New",
                evidence_json={
                    "claimed_ip": "192.168.1.1",
                    "rogue_mac": "B8:27:EB:AA:19:88",
                    "original_mac": "00:00:0C:4A:88:01",
                    "detection": "Gratuitous ARP Reply Flood"
                },
                recommendation="Enable Dynamic ARP Inspection (DAI) on the core switch and disable port Gig1/0/4.",
                is_escalated=True
            ),
            SecurityAlert(
                alert_id="ALT-20261030-003",
                title="ET DROP Known Cobalt Strike C2 Listener Outbound Beacon Connection",
                category="Malicious IP",
                severity="Critical",
                source_ip="192.168.1.105",
                destination_ip="185.220.101.5",
                source_port=53210,
                destination_port=443,
                protocol="TCP",
                detection_engine="Suricata",
                status="New",
                evidence_json={
                    "signature_id": 2049102,
                    "c2_ip": "185.220.101.5",
                    "ja3_fingerprint": "a0e9f5d64349fb13191bc781f81f42e1",
                    "beacon_interval": "60s"
                },
                recommendation="Submit automated firewall block rule for external IP 185.220.101.5.",
                is_escalated=True
            )
        ]
        db.add_all(alerts)
        db.flush()

        # 8. Incident Investigation
        inc = Incident(
            incident_id="INC-2026-001",
            title="Unauthorized Rogue Hardware Performing Internal Reconnaissance and C2 Beaconing",
            severity="Critical",
            status="Investigating",
            assigned_to_id=secadmin_user.id,
            description="A rogue endpoint with MAC B8:27:EB:AA:19:88 was detected on switchport Gig1/0/4. The device initiated aggressive SYN scanning against srv-web-prod-10 and broadcast spoofed ARP responses targeting the default gateway.",
            root_cause="Physical unauthorized tap connected in building conference room wall jack without 802.1X port security.",
            resolution_notes="Port Gig1/0/4 staged for administrative shutdown. Firewall block staged for destination C2 node."
        )
        db.add(inc)
        db.flush()

        # Evidence
        ev1 = IncidentEvidence(
            incident_id=inc.id,
            evidence_type="Alert",
            title="Suricata SYN Port Scan Detection",
            content_json={"alert_id": "ALT-20261030-001", "engine": "Suricata", "packets": 480}
        )
        ev2 = IncidentEvidence(
            incident_id=inc.id,
            evidence_type="Alert",
            title="Zeek ARP Poisoning Signature",
            content_json={"alert_id": "ALT-20261030-002", "rogue_mac": "B8:27:EB:AA:19:88"}
        )
        db.add_all([ev1, ev2])

        # 9. Cisco Device & Telemetry
        cisco = CiscoDevice(
            hostname="cisco-core-sw01",
            ip_address="192.168.1.1",
            model="Cisco Catalyst 9300-48P",
            snmp_version="v3",
            sys_descr="Cisco IOS Software, Catalyst L3 Switch Software (CAT9K_IOSXE), Version 17.06.04",
            uptime_seconds=1245820,
            cpu_usage=28.4,
            memory_usage=46.2,
            temperature_celsius=38.5,
            status="online"
        )
        db.add(cisco)
        db.flush()

        cisco_if1 = CiscoInterface(
            cisco_device_id=cisco.id,
            if_index=1,
            name="GigabitEthernet1/0/1",
            description="Uplink to Edge Firewall",
            admin_status="up",
            oper_status="up",
            speed_bps=1000000000,
            in_octets=8420000,
            out_octets=9850000,
            in_errors=1,
            out_errors=0,
            crc_errors=0,
            link_flaps=0,
            utilization_percent=34.2
        )
        cisco_if2 = CiscoInterface(
            cisco_device_id=cisco.id,
            if_index=4,
            name="GigabitEthernet1/0/4",
            description="Conference Room Port (Rogue Host Detected)",
            admin_status="up",
            oper_status="up",
            speed_bps=1000000000,
            in_octets=3210000,
            out_octets=1200000,
            in_errors=4,
            out_errors=0,
            crc_errors=3,
            link_flaps=2,
            utilization_percent=68.5
        )
        db.add_all([cisco_if1, cisco_if2])

        audit1 = CiscoAuditFinding(
            cisco_device_id=cisco.id,
            category="Authentication",
            severity="Critical",
            finding="Telnet Administrative Access Enabled on VTY lines",
            recommendation="Configure 'transport input ssh' and remove telnet.",
            rule_code="CISCO-SEC-001"
        )
        audit2 = CiscoAuditFinding(
            cisco_device_id=cisco.id,
            category="Spanning Tree Security",
            severity="High",
            finding="STP BPDU Guard Not Configured on Access Switchports",
            recommendation="Execute 'spanning-tree portfast bpduguard default'.",
            rule_code="CISCO-SEC-004"
        )
        db.add_all([audit1, audit2])

        # 10. Threat Indicators
        ti1 = ThreatIndicator(
            indicator="185.220.101.5",
            indicator_type="ip",
            threat_score=98,
            severity="Critical",
            source="VirusTotal & AbuseIPDB",
            malicious_count=68,
            total_engines=72,
            details_json={
                "country": "Germany",
                "isp": "Tor Exit Relay Network",
                "abuse_score": 100,
                "categories": ["Tor Exit Node", "Cobalt Strike C2", "Port Scan"]
            }
        )
        ti2 = ThreatIndicator(
            indicator="darknet-sync.cc",
            indicator_type="domain",
            threat_score=95,
            severity="Critical",
            source="VirusTotal",
            malicious_count=36,
            total_engines=40,
            details_json={
                "categories": ["DGA Domain", "DNS Tunneling", "Malware C2"],
                "resolved_ips": ["185.220.101.5"]
            }
        )
        db.add_all([ti1, ti2])

        # 11. Response Action (Pending Admin Approval)
        resp1 = ResponseAction(
            action_type="Firewall Block IP",
            target="185.220.101.5",
            status="Pending Approval",
            reason="Confirmed C2 beacon destination detected by Suricata rule 2049102.",
            rollback_command="iptables -D INPUT -s 185.220.101.5 -j DROP",
            requested_by_id=analyst_user.id
        )
        resp2 = ResponseAction(
            action_type="Isolate Device",
            target="192.168.1.105 (Port Gig1/0/4)",
            status="Pending Approval",
            reason="Unauthorized rogue Raspberry Pi conducting active ARP spoofing and reconnaissance.",
            rollback_command="cisco_switch(config-if)# no shutdown",
            requested_by_id=secadmin_user.id
        )
        db.add_all([resp1, resp2])

        # 12. Notification Settings
        notif1 = NotificationSetting(
            channel="Email",
            is_enabled=True,
            min_severity="High",
            config_json={"recipient": "soc-alerts@cybersentinel.local"}
        )
        notif2 = NotificationSetting(
            channel="Telegram",
            is_enabled=False,
            min_severity="Critical",
            config_json={"chat_id": "@cybersentinel_soc"}
        )
        db.add_all([notif1, notif2])

        db.commit()
        logger.info("Database successfully seeded with realistic enterprise cybersecurity assets.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
