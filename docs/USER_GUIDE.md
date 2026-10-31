# CyberSentinel User Guide

## 1. Getting Started

### 1.1 Accessing the Platform
Open your browser and navigate to:
`http://localhost:5173` (or port 80 if running via Docker, or `http://localhost/cybersentinel` if running via XAMPP)

### 1.2 Default User Accounts & Offline Demo Mode
CyberSentinel provides four pre-configured role-based user accounts:

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| **Super Administrator** | `admin` | `CyberAdmin2026!` | Full platform configuration, user management, policy creation |
| **Security Administrator** | `secadmin` | `SecAdmin2026!` | Scans, vulnerability triage, incident handling, firewall containment |
| **Security Analyst** | `analyst` | `Analyst2026!` | Event monitoring, traffic analysis, alert investigation, reporting |
| **Viewer** | `viewer` | `Viewer2026!` | Read-only executive dashboards and compliance audit views |

* **Offline Demo Access**: If the Python backend isn't running yet, click **"OFFLINE DEMO ACCESS"** directly on the login screen to enter the full SOC dashboard immediately with simulated enterprise telemetry.
* **Live Engine Access**: Run `scripts\run_xampp_backend.bat`, then sign in with any of the credentials above for live network discovery, real Nmap scanning, and real-time packet feeds.

---

## 2. Platform Navigation

### 2.1 SOC Dashboard
- Review high-level security metrics: total devices, open ports, critical vulnerabilities, and active alerts.
- Monitor live network bandwidth utilization and weekly security alert trends.
- Check distinct **Network Health Score** (94%) vs **Security Posture Score** (84%).

### 2.2 Network Discovery
- Select an authorized subnet CIDR (e.g., `192.168.1.0/24`) and click **Run Discovery**.
- Review discovered devices, MAC addresses, manufacturers (OUI), and operating systems.
- Toggle device authorization to flag rogue assets (e.g., unauthorized Raspberry Pi on VLAN 10).

### 2.3 Port Scanner & Service Detection
- Enter an authorized target IP (e.g., `192.168.1.10`) and select a scan profile:
  - **Quick Scan**: Rapid audit of top 100 ports.
  - **Standard Scan**: Comprehensive audit of top 1000 ports with service detection (`-sV`).
  - **Full Port Scan**: Exhaustive scan across ports 1-10000.
  - **Service Detection Scan**: Deep probe with version banners.
- Adjust the safe rate-limiting slider and click **Launch Authorized Scan**.
- Inspect discovered ports, service versions, risk levels, and raw Nmap terminal output.

### 2.4 Traffic Analyzer
- Monitor real-time packets across TCP, UDP, TLS, HTTP, DNS, and ICMP protocols.
- Filter by source or destination IP, protocol, or check **Suspicious Only** to isolate anomalies.
- Click any packet in the table to open the detailed packet dissection inspector.

### 2.5 Intrusion Detection System
- Review active Suricata and Zeek rule matches.
- Click an alert to inspect raw telemetry, signature IDs, and recommended investigation steps.
- Use **Simulate IDS Event** to inject a test detection and watch it broadcast in real-time.
- Update alert status to *Acknowledged* or *Resolved*.

### 2.6 Vulnerability Assessment
- Review detected service versions mapped against the National Vulnerability Database (NVD).
- Click any finding to inspect CVSS 3.1 base score, attack vectors, and vendor remediation steps.
- Click **Trigger Vulnerability Scan** to re-correlate all active services across the network.

### 2.7 Threat Intelligence
- Query external reputation feeds for any IP address, domain name, or file hash.
- Test with known indicators:
  - `185.220.101.5` (Tor Exit / C2 Node)
  - `darknet-sync.cc` (DGA Domain)
  - `44d88612fea8a8f36de82e1278abb02f` (WannaCry Ransomware Hash)

### 2.8 Cisco Infrastructure Monitoring
- Monitor Cisco Catalyst switches and ISR routers via SNMPv2c/SNMPv3.
- Track interface status, utilization, CRC/FCS frame errors, discards, and link flaps.
- Review automated Cisco Configuration Security Audit findings (e.g., Telnet removal, STP BPDU guard).

### 2.9 Network Topology Map
- Visualize the logical relationship between Core Gateways, Subnets (VLANs), and connected assets.
- Suspicious and rogue devices are highlighted in red with an active warning glow.
- Click any node to open its asset inspector panel.

### 2.10 AI Security Copilot
- Click the **AI Security Copilot** button in the header at any time.
- Ask questions in natural language:
  - *"Explain the high-risk SYN port scan alert on 192.168.1.105"*
  - *"Explain Apache CVE-2021-41773 and remediation steps"*
  - *"What investigation playbook is recommended for a rogue device?"*
- Review grounded investigation steps and remediation playbooks.

### 2.11 Automated Security Response
- Review proposed containment actions (Firewall IP blocks, switchport isolation).
- Click **Approve** to execute an action, **Reject** to dismiss, or **Rollback** to revert changes.
- All actions maintain an immutable audit trail and explicit administrator approval requirement.

### 2.12 Security Report Generator
- Select from 10 comprehensive report types (Executive Assessment, Vulnerability Report, Cisco Audit, etc.).
- Choose **PDF** or **CSV** format and click **Compile & Export Report**.
- Download and review the compiled document immediately.

---

## 3. Running with XAMPP (Apache & MySQL)

### 3.1 Architecture in XAMPP
When running with XAMPP:
- **Apache (Port 80):** Serves the built frontend from `C:\xampp\htdocs\cybersentinel\` and reverse-proxies API calls and WebSockets to the Python backend.
- **MySQL / MariaDB (Port 3306):** Optional database managed via phpMyAdmin.
- **Python FastAPI (Port 8000):** Executes network probing, packet captures, and IDS rules.

### 3.2 Quick Setup
1. **Enable Apache Proxy in `C:\xampp\apache\conf\httpd.conf`:**
   ```apache
   LoadModule proxy_http_module modules/mod_proxy_http.so
   LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
   ```
2. **Deploy to XAMPP:**
   Double-click `scripts\deploy_to_xampp.bat`.
3. **Run the Backend:**
   Double-click `scripts\run_xampp_backend.bat`.
4. **Access in Browser:**
   Navigate to [http://localhost/cybersentinel](http://localhost/cybersentinel).
