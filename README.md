# CyberSentinel

> **"Discover. Monitor. Detect. Defend."**

CyberSentinel is an all-in-one Network Security Monitoring (NSM), Intrusion Detection (IDS), Vulnerability Assessment, Threat Intelligence, Cisco Infrastructure Monitoring, and Incident Management platform designed for enterprise Security Operations Centers (SOCs).

It combines the capabilities of an **NMS** (Network Management System), **SIEM** (Security Information and Event Management), **IDS** (Intrusion Detection System), and **Vulnerability Management** platform into a modern, unified cybersecurity interface.

---

## Key Capabilities

* **Modern Dark SOC Dashboard:** Real-time metrics, bandwidth utilization, alert timelines, vulnerability donuts, top talkers, and activity streams.
* **Network Discovery:** CIDR subnet sweeping, IP/MAC identification, MAC OUI vendor resolution, OS fingerprinting, and rogue device detection.
* **Port Scanner & Service Audit:** Real Nmap integration with Quick, Standard, Full, and Service Detection profiles, safe rate-limiting, and port risk classification.
* **Network Traffic Analyzer:** Scapy-powered live packet monitoring across TCP, UDP, TLS, HTTP, DNS, and ICMP, with bandwidth gauges and packet dissection.
* **Intrusion Detection System:** Suricata rule matching and Zeek behavioral heuristics for SYN floods, ARP spoofing, DNS exfiltration, brute force, and C2 beaconing.
* **Vulnerability Assessment:** Automated service banner correlation with known CVEs, CVSS 3.1 scoring, and live NIST NVD REST API integration.
* **Multi-Source Threat Intelligence:** Reputation lookups against VirusTotal, AbuseIPDB, and AlienVault OTX with offline IOC vault caching.
* **Cisco SNMP Infrastructure Monitoring:** Switch and router telemetry (CPU, memory, temperature, interface bandwidth, CRC errors, link flapping) and configuration hardening audits.
* **Interactive Network Topology:** Visual graph displaying routers, VLAN subnets, endpoints, and highlighted rogue nodes.
* **Security Alert & Incident Response:** Triage alerts, escalate to incidents, maintain evidence timelines, and generate resolution notes.
* **Digital Forensics:** PCAP upload, cryptographic SHA-256 integrity verification, packet dissection, and chain-of-custody audit logs.
* **Automated Security Response:** Staged firewall block rules and device isolation with strict administrator dual-authorization and rollback workflows.
* **Network Health Center:** Distinct separation between operational **Network Health Score** (latency, packet loss, bandwidth) and **Security Posture Score** (CVEs, threats).
* **AI Security Copilot:** Grounded SOC assistant explaining alerts, investigating CVEs, and recommending remediation playbooks without hallucinations.
* **Security Report Generator:** Instant downloadable PDF and CSV export across 10 specialized report types.
* **Role-Based Access Control (RBAC):** Super Administrator, Security Administrator, Security Analyst, and Viewer roles with JWT tokens and 2FA.

---

## Technology Stack

### Frontend
- **Framework:** React.js (v18+) with TypeScript
- **Styling:** Tailwind CSS (v4) with dark cybersecurity surfaces
- **Icons:** Lucide React
- **Charts:** Recharts
- **Routing:** React Router v6
- **Real-Time Updates:** WebSockets (`/api/ws`)

### Backend
- **Framework:** Python FastAPI (Async REST API)
- **Data Validation:** Pydantic v2
- **ORM & Database:** SQLAlchemy with SQLite (zero-config local dev), MySQL / MariaDB (XAMPP), and PostgreSQL (Docker)
- **Security:** Bcrypt password hashing, PyJWT, OAuth2 Bearer, RBAC
- **Packet Engine:** Scapy & Python-Nmap
- **Reporting:** ReportLab PDF Generation & CSV engine

### Cybersecurity Tools
- **Nmap:** Real port scanning and service detection
- **Scapy:** Packet analysis and network discovery sweeps
- **Suricata & Zeek:** Signature rules and behavioral heuristics
- **SNMP:** Cisco Catalyst switches and ISR routers
- **NVD API:** NIST CVE vulnerability intelligence
- **Threat Intel:** VirusTotal, AbuseIPDB, and AlienVault OTX

---

## Default User Accounts

CyberSentinel comes pre-seeded with four role-based user accounts:

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Super Administrator** | `admin` | `CyberAdmin2026!` | Complete platform access, user management, and policies |
| **Security Administrator** | `secadmin` | `SecAdmin2026!` | Scans, vulnerability management, incident investigation, containment |
| **Security Analyst** | `analyst` | `Analyst2026!` | Event viewing, traffic analysis, alert triage, reports |
| **Viewer** | `viewer` | `Viewer2026!` | Read-only dashboard access and compliance review |

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.10+ (Tested up to Python 3.14)
- Node.js 18+ and npm
- Nmap (optional, automatic fallback available)

### Step 1: Clone and Set Up Virtual Environment
```bash
# Set up Python virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/Mac

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 2: Seed Database
```bash
set PYTHONPATH=backend
python backend/app/seed.py
```

### Step 3: Set Up Frontend
```bash
cd frontend
npm install
npm run build # or npm run dev
cd ..
```

### Step 4: Run Application
Windows one-click launcher:
```bat
scripts\run_dev.bat
```
Or run separately in two terminals:
```bash
# Terminal 1: Backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open your browser at:
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Running with XAMPP (Apache & MySQL)

CyberSentinel can be hosted directly inside your local **XAMPP** environment (`C:\xampp`), serving the frontend on Apache (port 80) and optionally connecting to XAMPP's MySQL/MariaDB database.

### 1. Enable Apache Proxy in XAMPP (One-time Setup)
Open `C:\xampp\apache\conf\httpd.conf` and uncomment these two lines (remove the `#`):
```apache
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
```
Then restart Apache in the XAMPP Control Panel.

### 2. (Optional) Connect to XAMPP MySQL Database
1. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin) and create a database named `cybersentinel`.
2. In `.env`, set:
   ```ini
   DATABASE_URL="mysql+pymysql://root:@localhost:3306/cybersentinel"
   ```
3. Run the seed script:
   ```bash
   python backend/app/seed.py
   ```

### 3. Deploy Frontend to XAMPP
Run the automated deployment script:
```bat
scripts\deploy_to_xampp.bat
```
This builds the frontend and copies all assets to `C:\xampp\htdocs\cybersentinel` along with an optimized `.htaccess` for SPA routing and API reverse-proxying.

### 4. Run the Python Backend
```bat
scripts\run_xampp_backend.bat
```

### 5. Access CyberSentinel in XAMPP
Open your browser at:
👉 **[http://localhost/cybersentinel](http://localhost/cybersentinel)**

---

## Docker Deployment

To launch the full production stack (PostgreSQL, Redis, Backend, and Nginx Frontend):

```bash
docker-compose up --build -d
```

The application will be available at:
- **Frontend:** [http://localhost](http://localhost) (port 80)
- **Backend API:** [http://localhost:8000](http://localhost:8000)

---

## Running Automated Tests

Run backend unit and integration tests:

```bash
set PYTHONPATH=backend
python -m pytest backend/tests/test_api.py -v
```

---

## Project Structure

```
CyberSentinel/
├── frontend/
│   ├── src/
│   │   ├── api/            # API client with token interceptor
│   │   ├── components/     # AppLayout, Sidebar, Header, Copilot, StatusBadge
│   │   ├── context/        # AuthContext and WebSocketContext
│   │   ├── pages/          # 15 SOC modules + Login
│   │   └── types/          # Full TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/v1/         # 18 Modular REST routers
│   │   ├── core/           # Security, config, database, ws_manager
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── scanners/       # Nmap and network discovery engines
│   │   ├── monitoring/     # Traffic analyzer, Cisco SNMP, health monitor
│   │   ├── detection/      # Suricata & Zeek IDS engines
│   │   ├── vulnerability/  # CVE matcher and NVD client
│   │   ├── threat_intelligence/ # VT, AbuseIPDB, and OTX integrations
│   │   ├── ai/             # AI Security Copilot
│   │   ├── reports/        # PDF and CSV report generators
│   │   ├── integrations/   # Tool integration status checker
│   │   └── seed.py         # Initial database seeder
│   ├── tests/              # Pytest test suite
│   └── requirements.txt
├── docker/                 # Dockerfiles and Nginx configuration
├── docs/                   # Architecture, API, and User Guide
├── scripts/                # Development, XAMPP, and launch scripts
│   ├── run_dev.bat         # Standalone Vite + FastAPI dev launcher
│   ├── deploy_to_xampp.bat # Deploys frontend to C:\xampp\htdocs\cybersentinel
│   └── run_xampp_backend.bat # Runs FastAPI backend for XAMPP proxy
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## License

Enterprise Security Platform - Proprietary & Confidential.
Developed for Security Operations Centers (SOCs) and Cybersecurity Professionals.
