export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  permissions: string[];
}

export interface Network {
  id: number;
  name: string;
  cidr: string;
  vlan_id?: number;
  gateway?: string;
  description?: string;
  is_authorized: boolean;
  scan_enabled: boolean;
  created_at: string;
  device_count: number;
}

export interface Port {
  id: number;
  port_number: number;
  protocol: string;
  state: string;
  service_name?: string;
  service_version?: string;
  service_product?: string;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  banner?: string;
}

export interface Device {
  id: number;
  ip_address: string;
  mac_address?: string;
  hostname?: string;
  manufacturer?: string;
  os_name?: string;
  os_version?: string;
  device_type: 'Router' | 'Switch' | 'Server' | 'Endpoint' | 'IoT' | 'Firewall';
  status: 'online' | 'offline';
  is_authorized: boolean;
  network_id?: number;
  first_seen: string;
  last_seen: string;
  custom_tags?: string;
  notes?: string;
  ports?: Port[];
}

export interface Scan {
  id: number;
  target: string;
  scan_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  ports_scanned: number;
  open_ports_count: number;
  rate_limit: number;
  started_at: string;
  completed_at?: string;
  raw_output?: string;
}

export interface Vulnerability {
  id: number;
  cve_id: string;
  title: string;
  description?: string;
  cvss_score: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  affected_service?: string;
  affected_version?: string;
  remediation?: string;
  status: 'Open' | 'Investigating' | 'Remediated' | 'False Positive';
  is_potential: boolean;
  device_id?: number;
  port_id?: number;
  detected_at: string;
  device_ip?: string;
}

export interface SecurityAlert {
  id: number;
  alert_id: string;
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  source_ip?: string;
  destination_ip?: string;
  source_port?: number;
  destination_port?: number;
  protocol: string;
  detection_engine: string;
  status: 'New' | 'Acknowledged' | 'Investigating' | 'Resolved';
  evidence_json: Record<string, any>;
  recommendation?: string;
  is_escalated: boolean;
  created_at: string;
}

export interface Incident {
  id: number;
  incident_id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Investigating' | 'Contained' | 'Resolved' | 'Closed';
  assigned_to_id?: number;
  assignee_name?: string;
  description?: string;
  root_cause?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  evidence_count: number;
}

export interface CiscoInterface {
  id: number;
  name: string;
  description?: string;
  admin_status: string;
  oper_status: string;
  speed_bps: number;
  in_octets: number;
  out_octets: number;
  in_errors: number;
  out_errors: number;
  crc_errors: number;
  link_flaps: number;
  utilization_percent: number;
  vlan_id?: number;
  port_mode?: string;
}

export interface CiscoAuditFinding {
  id: number;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  finding: string;
  recommendation: string;
  rule_code?: string;
  checked_at: string;
}

export interface CiscoDevice {
  id: number;
  hostname: string;
  ip_address: string;
  model: string;
  snmp_version: string;
  sys_descr?: string;
  uptime_seconds: number;
  cpu_usage: number;
  memory_usage: number;
  temperature_celsius: number;
  status: string;
  device_type?: 'switch' | 'firewall' | 'router';
  vendor?: string;
  location?: string;
  extra_data_json?: Record<string, any>;
  last_poll: string;
  interfaces: CiscoInterface[];
  audit_findings: CiscoAuditFinding[];
}

export interface ThreatIndicator {
  id: number;
  indicator: string;
  indicator_type: string;
  threat_score: number;
  severity: string;
  source: string;
  malicious_count: number;
  total_engines: number;
  details_json: Record<string, any>;
  created_at: string;
}

export interface ResponseAction {
  id: number;
  action_type: string;
  target: string;
  status: 'Pending Approval' | 'Approved' | 'Executed' | 'Rejected' | 'Rolled Back';
  reason: string;
  rollback_command?: string;
  requested_by_id?: number;
  approved_by_id?: number;
  executed_at?: string;
}

export interface Packet {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  source_port: number;
  destination_port: number;
  protocol: string;
  packet_size: number;
  flags?: string;
  is_suspicious: boolean;
  anomaly_reason?: string;
}

export interface ToolIntegrationStatus {
  name: string;
  category: string;
  is_available: boolean;
  version?: string;
  path?: string;
  status: string;
  description: string;
}

export interface AICopilotResponse {
  answer: string;
  confidence: number;
  investigation_steps: string[];
  remediation_recommendations: string[];
  involved_indicators: string[];
  evidence_sources: string[];
}
