# CyberSentinel API Documentation

The CyberSentinel platform exposes a modular REST API adhering to OpenAPI 3.0 standards alongside a bidirectional WebSocket endpoint for live telemetry.

Interactive Swagger documentation is available at:
`http://localhost:8000/docs`

## 1. Authentication (`/api/v1/auth`)
- `POST /login`: Authenticates user credentials and optional 2FA code. Returns JWT access token and refresh token.
- `POST /refresh`: Issues a new access token using a valid refresh token.
- `GET /me`: Returns details and permissions for the currently authenticated user.
- `POST /register`: Registers a new platform user (requires Super Administrator role).
- `POST /logout`: Invalidates session and records audit entry.

## 2. Dashboard (`/api/v1/dashboard`)
- `GET /summary`: Aggregates all SOC metrics, time-series charts, and recent activity feeds into a single payload.

## 3. Networks & Discovery (`/api/v1/networks`, `/api/v1/devices`)
- `GET /networks`: Lists all administrator-authorized network CIDR subnets.
- `POST /networks`: Registers a new authorized CIDR subnet.
- `GET /devices`: Lists discovered network devices with filtering by type, subnet, status, and authorization.
- `GET /devices/{id}`: Detailed asset breakdown with associated open ports and vulnerabilities.
- `PUT /devices/{id}`: Updates asset metadata, authorization status, or notes.
- `POST /devices/discover?cidr={cidr}`: Launches an automatic subnet discovery sweep.

## 4. Port Scanner (`/api/v1/scans`)
- `POST /scans/start`: Launches an Nmap port audit against an authorized target.
- `GET /scans`: Retrieves chronological scan history.
- `GET /scans/{id}`: Returns scan completion details and terminal output.
- `GET /scans/{id}/ports`: Lists discovered ports, services, and risk classifications.

## 5. Traffic Analyzer (`/api/v1/traffic`)
- `GET /traffic/summary`: Returns bandwidth utilization, packet rates, and protocol distribution.
- `GET /traffic/packets`: Retrieves recent packet capture history with filtering.
- `POST /traffic/pulse`: Ingests and broadcasts a real-time network packet.

## 6. Intrusion Detection (`/api/v1/ids`)
- `GET /ids/alerts`: Lists IDS security alerts with severity and category filtering.
- `GET /ids/alerts/{id}`: Full alert details with correlated raw evidence.
- `PUT /ids/alerts/{id}`: Acknowledges, escalates, or resolves an alert.
- `POST /ids/simulate`: Generates a simulated Suricata/Zeek security event for testing.

## 7. Vulnerabilities (`/api/v1/vulnerabilities`)
- `GET /vulnerabilities`: Lists detected vulnerabilities across monitored assets.
- `GET /vulnerabilities/{id}`: Detailed CVE findings and NIST NVD query data.
- `PUT /vulnerabilities/{id}/status`: Updates status (Open, Investigating, Remediated, False Positive).
- `POST /vulnerabilities/scan`: Re-runs vulnerability correlation against all active services.

## 8. Threat Intelligence (`/api/v1/threat-intel`)
- `POST /threat-intel/lookup`: Queries VirusTotal, AbuseIPDB, and AlienVault OTX for an indicator.
- `GET /threat-intel/indicators`: Lists all tracked threat indicators in the IOC vault.

## 9. Cisco Monitoring (`/api/v1/cisco`)
- `GET /cisco/devices`: Returns telemetry for monitored switches and routers.
- `GET /cisco/devices/{id}/interfaces`: Interface bandwidth, errors, and link flapping statistics.
- `GET /cisco/devices/{id}/audit`: Configuration security audit findings.

## 10. Topology (`/api/v1/topology`)
- `GET /topology`: Returns nodes and links representing network topology.

## 11. Incidents (`/api/v1/incidents`)
- `GET /incidents`: Lists incident response cases.
- `POST /incidents`: Creates a new incident case with linked alerts.
- `GET /incidents/{id}`: Retrieves incident timeline, notes, and evidence binder.
- `PUT /incidents/{id}/status`: Updates incident state (New, Investigating, Contained, Resolved, Closed).

## 12. Forensics (`/api/v1/forensics`)
- `POST /forensics/upload-pcap`: Uploads a PCAP file, calculates SHA-256 hash, and extracts metadata.
- `GET /forensics/captures`: Lists forensic evidence captures in the vault.

## 13. Automated Response (`/api/v1/response`)
- `GET /response/actions`: Lists staged response actions.
- `POST /response/stage`: Proposes a containment action (Firewall block, isolation).
- `POST /response/decision`: Approves, rejects, or rolls back a staged action.

## 14. Network Health (`/api/v1/health`)
- `GET /health/metrics`: Returns network health score vs security posture score, latency, and packet loss.

## 15. Reports (`/api/v1/reports`)
- `POST /reports/generate`: Compiles a downloadable PDF or CSV report for any of the 10 report types.
- `GET /reports/download/{filename}`: Downloads the compiled report file.

## 16. AI Security Copilot (`/api/v1/ai`)
- `POST /ai/copilot`: Triage query endpoint for alert explanation and investigation steps.

## 17. Tool Integrations (`/api/v1/integrations`)
- `GET /integrations/status`: Returns the live status of all 12 cybersecurity tools.
