from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Token schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    totp_code: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# User schemas
class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role_id: int

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_2fa_enabled: bool
    role: Optional[RoleOut]
    created_at: datetime

    class Config:
        from_attributes = True

# Network schemas
class NetworkCreate(BaseModel):
    name: str
    cidr: str
    vlan_id: Optional[int] = None
    gateway: Optional[str] = None
    description: Optional[str] = None
    is_authorized: bool = True
    scan_enabled: bool = True

class NetworkOut(BaseModel):
    id: int
    name: str
    cidr: str
    vlan_id: Optional[int]
    gateway: Optional[str]
    description: Optional[str]
    is_authorized: bool
    scan_enabled: bool
    created_at: datetime
    device_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Device & Port schemas
class PortOut(BaseModel):
    id: int
    port_number: int
    protocol: str
    state: str
    service_name: Optional[str]
    service_version: Optional[str]
    service_product: Optional[str]
    risk_level: str
    banner: Optional[str]

    class Config:
        from_attributes = True

class DeviceOut(BaseModel):
    id: int
    ip_address: str
    mac_address: Optional[str]
    hostname: Optional[str]
    manufacturer: Optional[str]
    os_name: Optional[str]
    os_version: Optional[str]
    device_type: str
    status: str
    is_authorized: bool
    network_id: Optional[int]
    first_seen: datetime
    last_seen: datetime
    custom_tags: Optional[str]
    notes: Optional[str]
    ports: List[PortOut] = []

    class Config:
        from_attributes = True

class DeviceUpdate(BaseModel):
    hostname: Optional[str] = None
    device_type: Optional[str] = None
    is_authorized: Optional[bool] = None
    notes: Optional[str] = None
    custom_tags: Optional[str] = None

# Scan schemas
class ScanRequest(BaseModel):
    target: str
    scan_type: str = "Standard Scan" # Quick Scan, Standard Scan, Full Port Scan, Service Detection Scan
    rate_limit: int = 1000

class ScanOut(BaseModel):
    id: int
    target: str
    scan_type: str
    status: str
    ports_scanned: int
    open_ports_count: int
    rate_limit: int
    started_at: datetime
    completed_at: Optional[datetime]
    raw_output: Optional[str]

    class Config:
        from_attributes = True

# Vulnerability schemas
class VulnerabilityOut(BaseModel):
    id: int
    cve_id: str
    title: str
    description: Optional[str]
    cvss_score: float
    severity: str
    affected_service: Optional[str]
    affected_version: Optional[str]
    remediation: Optional[str]
    status: str
    is_potential: bool
    device_id: Optional[int]
    port_id: Optional[int]
    detected_at: datetime
    device_ip: Optional[str] = None

    class Config:
        from_attributes = True

class VulnerabilityStatusUpdate(BaseModel):
    status: str # Open, Investigating, Remediated, False Positive

# Threat Intel schemas
class ThreatIndicatorOut(BaseModel):
    id: int
    indicator: str
    indicator_type: str
    threat_score: int
    severity: str
    source: str
    malicious_count: int
    total_engines: int
    details_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class ThreatLookupRequest(BaseModel):
    indicator: str

# Security Alert schemas
class SecurityAlertOut(BaseModel):
    id: int
    alert_id: str
    title: str
    category: str
    severity: str
    source_ip: Optional[str]
    destination_ip: Optional[str]
    source_port: Optional[int]
    destination_port: Optional[int]
    protocol: str
    detection_engine: str
    status: str
    evidence_json: Dict[str, Any]
    recommendation: Optional[str]
    is_escalated: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    is_escalated: Optional[bool] = None

# Incident schemas
class IncidentCreate(BaseModel):
    title: str
    severity: str = "Medium"
    description: Optional[str] = None
    assigned_to_id: Optional[int] = None
    alert_ids: Optional[List[int]] = []

class IncidentOut(BaseModel):
    id: int
    incident_id: str
    title: str
    severity: str
    status: str
    assigned_to_id: Optional[int]
    assignee_name: Optional[str] = None
    description: Optional[str]
    root_cause: Optional[str]
    resolution_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0

    class Config:
        from_attributes = True

# Cisco schemas
class CiscoInterfaceOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    admin_status: str
    oper_status: str
    speed_bps: int
    in_octets: int
    out_octets: int
    in_errors: int
    out_errors: int
    crc_errors: int
    link_flaps: int
    utilization_percent: float

    class Config:
        from_attributes = True

class CiscoAuditFindingOut(BaseModel):
    id: int
    category: str
    severity: str
    finding: str
    recommendation: str
    rule_code: Optional[str]
    checked_at: datetime

    class Config:
        from_attributes = True

class CiscoDeviceOut(BaseModel):
    id: int
    hostname: str
    ip_address: str
    model: str
    snmp_version: str
    sys_descr: Optional[str]
    uptime_seconds: int
    cpu_usage: float
    memory_usage: float
    temperature_celsius: float
    status: str
    last_poll: datetime
    interfaces: List[CiscoInterfaceOut] = []
    audit_findings: List[CiscoAuditFindingOut] = []

    class Config:
        from_attributes = True

# Response Action schemas
class ResponseActionOut(BaseModel):
    id: int
    action_type: str
    target: str
    status: str
    reason: str
    rollback_command: Optional[str]
    requested_by_id: Optional[int]
    approved_by_id: Optional[int]
    executed_at: Optional[datetime]

    class Config:
        from_attributes = True

class ResponseActionDecision(BaseModel):
    action_id: int
    decision: str # "approve" or "reject" or "rollback"

# AI Copilot schemas
class AICopilotQuery(BaseModel):
    prompt: str
    context_type: Optional[str] = "general" # alert, vulnerability, incident, traffic, general
    context_id: Optional[str] = None

class AICopilotResponse(BaseModel):
    answer: str
    confidence: float
    investigation_steps: List[str]
    remediation_recommendations: List[str]
    involved_indicators: List[str]
    evidence_sources: List[str]

# Tool Integration schemas
class ToolIntegrationStatus(BaseModel):
    name: str
    category: str
    is_available: bool
    version: Optional[str] = None
    path: Optional[str] = None
    status: str # "Active", "Fallback / Simulation", "Missing"
    description: str
