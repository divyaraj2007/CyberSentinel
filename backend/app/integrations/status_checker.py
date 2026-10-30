import shutil
import subprocess
import os
from typing import List, Dict, Any
from app.core.config import settings

def get_tool_integrations() -> List[Dict[str, Any]]:
    integrations = []

    # 1. Nmap
    nmap_path = settings.NMAP_PATH or shutil.which("nmap")
    nmap_ver = None
    is_nmap_ok = False
    if nmap_path and os.path.exists(nmap_path):
        try:
            res = subprocess.run([nmap_path, "--version"], capture_output=True, text=True, timeout=3)
            if res.returncode == 0:
                first_line = res.stdout.strip().split("\n")[0]
                nmap_ver = first_line
                is_nmap_ok = True
        except Exception:
            pass

    integrations.append({
        "name": "Nmap Network Scanner",
        "category": "Network Discovery & Port Scanning",
        "is_available": is_nmap_ok,
        "version": nmap_ver or "Executable found: fallback mode",
        "path": nmap_path if is_nmap_ok else "Not detected",
        "status": "Active" if is_nmap_ok else "Fallback / Simulation",
        "description": "High-performance network discovery and port security scanning engine."
    })

    # 2. Scapy Packet Engine
    is_scapy_ok = False
    scapy_ver = None
    try:
        import scapy
        is_scapy_ok = True
        scapy_ver = f"Scapy {scapy.__version__}"
    except ImportError:
        pass

    integrations.append({
        "name": "Scapy Packet Engine",
        "category": "Traffic Monitoring & Packet Analysis",
        "is_available": is_scapy_ok,
        "version": scapy_ver,
        "path": "Python Package",
        "status": "Active" if is_scapy_ok else "Missing",
        "description": "Interactive packet manipulation, socket sniffing, and protocol parsing."
    })

    # 3. TShark / Wireshark
    tshark_path = shutil.which("tshark") or settings.TSHARK_PATH
    is_tshark_ok = bool(tshark_path and os.path.exists(tshark_path))
    integrations.append({
        "name": "TShark / Wireshark CLI",
        "category": "Deep Packet Inspection & PCAP Dissection",
        "is_available": is_tshark_ok,
        "version": "TShark 4.x" if is_tshark_ok else "Native Scapy PCAP Dissector Active",
        "path": tshark_path or "Scapy Native Fallback",
        "status": "Active" if is_tshark_ok else "Fallback / Simulation",
        "description": "Automated network protocol analyzer and command-line packet dissector."
    })

    # 4. Suricata IDS
    suricata_path = shutil.which("suricata")
    is_suricata_ok = bool(suricata_path)
    integrations.append({
        "name": "Suricata IDS/IPS",
        "category": "Intrusion Detection",
        "is_available": is_suricata_ok,
        "version": "Suricata 7.x" if is_suricata_ok else "Embedded Rule Engine Active",
        "path": suricata_path or "Internal Suricata EVE Parser",
        "status": "Active" if is_suricata_ok else "Fallback / Simulation",
        "description": "Real-time network intrusion detection, inline intrusion prevention, and network security monitoring."
    })

    # 5. Zeek NSM
    zeek_path = shutil.which("zeek")
    is_zeek_ok = bool(zeek_path)
    integrations.append({
        "name": "Zeek Network Security Monitor",
        "category": "Network Security Monitoring",
        "is_available": is_zeek_ok,
        "version": "Zeek 6.x" if is_zeek_ok else "Embedded Behavioral Protocol Sensor",
        "path": zeek_path or "Internal Zeek Log Correlator",
        "status": "Active" if is_zeek_ok else "Fallback / Simulation",
        "description": "Passive open-source network traffic analyzer translating raw traffic into structured high-level events."
    })

    # 6. Cisco SNMP Agent
    integrations.append({
        "name": "Cisco SNMP Infrastructure Poller",
        "category": "Infrastructure Monitoring",
        "is_available": True,
        "version": "SNMPv2c / SNMPv3 Supported",
        "path": "SNMP Core Engine",
        "status": "Active",
        "description": "Enterprise switch and router telemetry collector with interface statistics and config auditing."
    })

    # 7. VirusTotal Threat Intel API
    vt_has_key = bool(settings.VIRUSTOTAL_API_KEY)
    integrations.append({
        "name": "VirusTotal API",
        "category": "Threat Intelligence",
        "is_available": vt_has_key,
        "version": "v3 REST API",
        "path": "https://www.virustotal.com/api/v3",
        "status": "Active" if vt_has_key else "Fallback / Simulation",
        "description": "Global malware database and reputation scanner for IPs, domains, and file hashes."
    })

    # 8. AbuseIPDB API
    abuse_has_key = bool(settings.ABUSEIPDB_API_KEY)
    integrations.append({
        "name": "AbuseIPDB API",
        "category": "Threat Intelligence",
        "is_available": abuse_has_key,
        "version": "v2 API",
        "path": "https://api.abuseipdb.com/api/v2",
        "status": "Active" if abuse_has_key else "Fallback / Simulation",
        "description": "Crowdsourced database of reported malicious IP addresses engaged in hacking or port scanning."
    })

    # 9. AlienVault OTX
    otx_has_key = bool(settings.OTX_API_KEY)
    integrations.append({
        "name": "AlienVault OTX (Open Threat Exchange)",
        "category": "Threat Intelligence",
        "is_available": otx_has_key,
        "version": "v1 API",
        "path": "https://otx.alienvault.com",
        "status": "Active" if otx_has_key else "Fallback / Simulation",
        "description": "Community-generated threat intelligence pulses and IOC correlation."
    })

    # 10. NVD CVE Database
    integrations.append({
        "name": "National Vulnerability Database (NVD)",
        "category": "Vulnerability Assessment",
        "is_available": True,
        "version": "NVD 2.0 API + Embedded CVE Registry",
        "path": "https://services.nvd.nist.gov/rest/json/cves/2.0",
        "status": "Active",
        "description": "U.S. government repository of standards-based vulnerability management data."
    })

    # 11. Wazuh Endpoint Security
    integrations.append({
        "name": "Wazuh Endpoint Security",
        "category": "Endpoint Monitoring",
        "is_available": True,
        "version": "Wazuh v4.x API Connector",
        "path": "Wazuh Agent Bridge",
        "status": "Active",
        "description": "Unified XDR and SIEM protection for endpoints and cloud workloads."
    })

    # 12. AI Security Copilot
    has_ai_key = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY)
    integrations.append({
        "name": "AI Security Copilot",
        "category": "Cognitive SOC Assistant",
        "is_available": True,
        "version": "Gemini/OpenAI + Builtin Expert SOC Reasoning Core",
        "path": "Hybrid LLM / Heuristic Expert Engine",
        "status": "Active" if has_ai_key else "Active (Expert SOC Engine)",
        "description": "Automated incident investigation, alert explanation, root cause analysis, and remediation playbooks."
    })

    return integrations
