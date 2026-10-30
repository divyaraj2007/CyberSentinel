import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text, DateTime,
    ForeignKey, Table, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255))
    permissions = Column(JSON, default=list)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100))
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    is_2fa_enabled = Column(Boolean, default=False)
    totp_secret = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    role = relationship("Role", back_populates="users")
    scans = relationship("Scan", back_populates="user")
    incidents = relationship("Incident", back_populates="assignee", foreign_keys="Incident.assigned_to_id")
    actions = relationship("ResponseAction", back_populates="approved_by", foreign_keys="ResponseAction.approved_by_id")

class Network(Base):
    __tablename__ = "networks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    cidr = Column(String(50), unique=True, nullable=False)
    vlan_id = Column(Integer, nullable=True)
    gateway = Column(String(50), nullable=True)
    description = Column(String(255), nullable=True)
    is_authorized = Column(Boolean, default=True)
    scan_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    devices = relationship("Device", back_populates="network", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(50), index=True, nullable=False)
    mac_address = Column(String(50), index=True, nullable=True)
    hostname = Column(String(100), index=True, nullable=True)
    manufacturer = Column(String(100), nullable=True)
    os_name = Column(String(100), nullable=True)
    os_version = Column(String(50), nullable=True)
    device_type = Column(String(50), default="Endpoint") # Router, Switch, Server, Endpoint, IoT, Firewall
    status = Column(String(20), default="online") # online, offline
    is_authorized = Column(Boolean, default=True)
    network_id = Column(Integer, ForeignKey("networks.id"), nullable=True)
    first_seen = Column(DateTime, default=utcnow)
    last_seen = Column(DateTime, default=utcnow)
    custom_tags = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    network = relationship("Network", back_populates="devices")
    ports = relationship("Port", back_populates="device", cascade="all, delete-orphan")
    vulnerabilities = relationship("Vulnerability", back_populates="device", cascade="all, delete-orphan")
    interfaces = relationship("DeviceInterface", back_populates="device", cascade="all, delete-orphan")

class DeviceInterface(Base):
    __tablename__ = "device_interfaces"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    name = Column(String(50))
    mac_address = Column(String(50))
    ip_address = Column(String(50))
    speed_mbps = Column(Integer, default=1000)
    status = Column(String(20), default="up")

    device = relationship("Device", back_populates="interfaces")

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    target = Column(String(100), nullable=False)
    scan_type = Column(String(50), default="Standard Scan") # Quick Scan, Standard Scan, Full Port Scan, Service Detection Scan
    status = Column(String(20), default="queued") # queued, running, completed, failed
    ports_scanned = Column(Integer, default=0)
    open_ports_count = Column(Integer, default=0)
    rate_limit = Column(Integer, default=1000)
    started_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)
    raw_output = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="scans")
    ports = relationship("Port", back_populates="scan", cascade="all, delete-orphan")

class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=True)
    port_number = Column(Integer, nullable=False)
    protocol = Column(String(10), default="TCP") # TCP, UDP
    state = Column(String(20), default="open") # open, closed, filtered
    service_name = Column(String(50), nullable=True)
    service_version = Column(String(100), nullable=True)
    service_product = Column(String(100), nullable=True)
    risk_level = Column(String(20), default="Low") # Critical, High, Medium, Low, Info
    banner = Column(String(255), nullable=True)

    device = relationship("Device", back_populates="ports")
    scan = relationship("Scan", back_populates="ports")
    vulnerabilities = relationship("Vulnerability", back_populates="port")

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String(50), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    cvss_score = Column(Float, default=0.0)
    severity = Column(String(20), default="Medium") # Critical, High, Medium, Low, Informational
    affected_service = Column(String(100), nullable=True)
    affected_version = Column(String(50), nullable=True)
    remediation = Column(Text, nullable=True)
    status = Column(String(30), default="Open") # Open, Investigating, Remediated, False Positive
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    port_id = Column(Integer, ForeignKey("ports.id"), nullable=True)
    is_potential = Column(Boolean, default=True) # Clearly labeled version-based CVE matches as potential findings until validated
    detected_at = Column(DateTime, default=utcnow)

    device = relationship("Device", back_populates="vulnerabilities")
    port = relationship("Port", back_populates="vulnerabilities")

class ThreatIndicator(Base):
    __tablename__ = "threat_indicators"

    id = Column(Integer, primary_key=True, index=True)
    indicator = Column(String(255), unique=True, index=True, nullable=False)
    indicator_type = Column(String(20), default="ip") # ip, domain, file_hash, url
    threat_score = Column(Integer, default=0) # 0 to 100
    severity = Column(String(20), default="Low") # Critical, High, Medium, Low, Clean
    source = Column(String(50), default="VirusTotal") # VirusTotal, AbuseIPDB, AlienVault OTX
    malicious_count = Column(Integer, default=0)
    total_engines = Column(Integer, default=0)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utcnow)

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False) # Port Scan, ARP Spoofing, DNS Anomaly, SYN Flood, Brute Force, Exfiltration, Malicious IP, C2 Beaconing
    severity = Column(String(20), default="Medium") # Critical, High, Medium, Low
    source_ip = Column(String(50), index=True, nullable=True)
    destination_ip = Column(String(50), index=True, nullable=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String(20), default="TCP")
    detection_engine = Column(String(50), default="Suricata") # Suricata, Zeek, Heuristic
    status = Column(String(30), default="New") # New, Acknowledged, Investigating, Resolved
    evidence_json = Column(JSON, default=dict)
    recommendation = Column(Text, nullable=True)
    is_escalated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    acknowledged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(20), default="Medium") # Critical, High, Medium, Low
    status = Column(String(30), default="New") # New, Investigating, Contained, Resolved, Closed
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    assignee = relationship("User", back_populates="incidents", foreign_keys=[assigned_to_id])
    evidences = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")

class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    evidence_type = Column(String(50), default="Alert") # Alert, Device, PCAP, Log, Artifact
    title = Column(String(255), nullable=False)
    content_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utcnow)

    incident = relationship("Incident", back_populates="evidences")

class TrafficLog(Base):
    __tablename__ = "traffic_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    source_ip = Column(String(50), index=True)
    destination_ip = Column(String(50), index=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String(20), index=True)
    packet_size = Column(Integer, default=64)
    flags = Column(String(20), nullable=True)
    is_suspicious = Column(Boolean, default=False)
    anomaly_reason = Column(String(255), nullable=True)

class PacketCapture(Base):
    __tablename__ = "packet_captures"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    sha256_hash = Column(String(64), nullable=False)
    packet_count = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    protocols_json = Column(JSON, default=dict)
    top_talkers_json = Column(JSON, default=list)
    upload_timestamp = Column(DateTime, default=utcnow)
    investigator_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class CiscoDevice(Base):
    __tablename__ = "cisco_devices"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(100), unique=True, nullable=False)
    ip_address = Column(String(50), nullable=False)
    model = Column(String(100), default="Cisco Catalyst 9300")
    snmp_version = Column(String(20), default="v3") # v2c, v3
    snmp_community = Column(String(50), default="public")
    sys_descr = Column(String(255), nullable=True)
    uptime_seconds = Column(Integer, default=0)
    cpu_usage = Column(Float, default=0.0) # percentage
    memory_usage = Column(Float, default=0.0) # percentage
    temperature_celsius = Column(Float, default=38.5)
    status = Column(String(20), default="online")
    last_poll = Column(DateTime, default=utcnow)

    interfaces = relationship("CiscoInterface", back_populates="device", cascade="all, delete-orphan")
    audit_findings = relationship("CiscoAuditFinding", back_populates="device", cascade="all, delete-orphan")

class CiscoInterface(Base):
    __tablename__ = "cisco_interfaces"

    id = Column(Integer, primary_key=True, index=True)
    cisco_device_id = Column(Integer, ForeignKey("cisco_devices.id"))
    if_index = Column(Integer)
    name = Column(String(50)) # e.g. GigabitEthernet1/0/1
    description = Column(String(255), nullable=True)
    if_type = Column(String(50), default="ethernetCsmacd")
    admin_status = Column(String(20), default="up")
    oper_status = Column(String(20), default="up")
    speed_bps = Column(Integer, default=1000000000) # 1 Gbps
    in_octets = Column(Integer, default=0)
    out_octets = Column(Integer, default=0)
    in_errors = Column(Integer, default=0)
    out_errors = Column(Integer, default=0)
    crc_errors = Column(Integer, default=0)
    in_discards = Column(Integer, default=0)
    out_discards = Column(Integer, default=0)
    link_flaps = Column(Integer, default=0)
    utilization_percent = Column(Float, default=0.0)

    device = relationship("CiscoDevice", back_populates="interfaces")

class CiscoAuditFinding(Base):
    __tablename__ = "cisco_audit_findings"

    id = Column(Integer, primary_key=True, index=True)
    cisco_device_id = Column(Integer, ForeignKey("cisco_devices.id"))
    category = Column(String(50), default="Hardening") # Authentication, Encryption, Management, Service
    severity = Column(String(20), default="High") # Critical, High, Medium, Low
    finding = Column(String(255), nullable=False)
    recommendation = Column(Text, nullable=False)
    rule_code = Column(String(50))
    checked_at = Column(DateTime, default=utcnow)

    device = relationship("CiscoDevice", back_populates="audit_findings")

class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(50), nullable=False) # Firewall Block IP, Isolate Device, Rate Limit, Generate Ticket
    target = Column(String(100), nullable=False)
    status = Column(String(30), default="Pending Approval") # Pending Approval, Approved, Executed, Rejected, Rolled Back
    reason = Column(Text, nullable=False)
    rollback_command = Column(Text, nullable=True)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    executed_at = Column(DateTime, nullable=True)

    approved_by = relationship("User", back_populates="actions", foreign_keys=[approved_by_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    ip_address = Column(String(50), nullable=True)
    details_json = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=utcnow)

class ReportRecord(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(100), nullable=False) # Network Discovery, Port Scanning, Vulnerability Assessment, etc.
    title = Column(String(255), nullable=False)
    format = Column(String(20), default="PDF") # PDF, CSV
    file_path = Column(String(255), nullable=False)
    status = Column(String(20), default="Completed")
    created_at = Column(DateTime, default=utcnow)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(50), nullable=False) # Email, Telegram, Webhook
    is_enabled = Column(Boolean, default=True)
    min_severity = Column(String(20), default="High")
    config_json = Column(JSON, default=dict)
