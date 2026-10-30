import os
import csv
import io
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

REPORTS_DIR = "generated_reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

REPORT_TITLES = {
    "network_discovery": "CyberSentinel - Network Discovery Report",
    "port_scanning": "CyberSentinel - Port Scanning & Service Audit Report",
    "vulnerability_assessment": "CyberSentinel - Vulnerability Assessment Report",
    "network_traffic": "CyberSentinel - Network Traffic Analysis Report",
    "intrusion_detection": "CyberSentinel - Intrusion Detection & IDS Report",
    "cisco_infrastructure": "CyberSentinel - Cisco Infrastructure & SNMP Audit Report",
    "security_incident": "CyberSentinel - Incident Investigation Report",
    "network_health": "CyberSentinel - Network Health & Telemetry Report",
    "threat_intelligence": "CyberSentinel - Threat Intelligence & IOC Report",
    "complete_assessment": "CyberSentinel - Complete Enterprise Security Assessment"
}

def generate_pdf_report(report_type: str, data: Dict[str, Any], output_path: str) -> str:
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#475569"),
        spaceAfter=20
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=colors.HexColor("#0284c7"),
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=8,
        leading=14
    )

    story = []

    # Title & Metadata
    report_name = REPORT_TITLES.get(report_type, "CyberSentinel Enterprise Security Report")
    story.append(Paragraph(report_name, title_style))
    story.append(Paragraph(
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | "
        f"Classification: RESTRICTED / SOC INTERNAL | Platform: CyberSentinel v1.0",
        subtitle_style
    ))

    # Executive Summary
    story.append(Paragraph("1. Executive Summary", heading_style))
    exec_summary = data.get("executive_summary", (
        "This security assessment report summarizes real-time telemetry gathered by the CyberSentinel platform. "
        "The findings represent network assets, active port services, behavioral intrusion detection alerts, "
        "and potential vulnerability vectors mapped against the National Vulnerability Database (NVD)."
    ))
    story.append(Paragraph(exec_summary, body_style))

    # Findings Table
    story.append(Spacer(1, 10))
    story.append(Paragraph("2. Technical Findings Summary", heading_style))

    table_data = data.get("table_data", [
        ["Asset / Target", "Category", "Severity", "Status"],
        ["192.168.1.1", "Cisco Router (SNMP/SSH)", "Medium", "Operational"],
        ["192.168.1.10", "Apache 2.4.49 (CVE-2021-41773)", "Critical", "Pending Patch"],
        ["192.168.1.20", "Windows DC (SMB/Kerberos)", "High", "Monitored"],
        ["192.168.1.105", "Rogue Endpoint (Port Scan)", "High", "Under Triage"]
    ])

    t = Table(table_data, colWidths=[150, 180, 80, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ]))
    story.append(t)

    # Remediation Recommendations
    story.append(Spacer(1, 15))
    story.append(Paragraph("3. Remediation & Action Items", heading_style))
    recommendations = data.get("recommendations", [
        "1. Isolate rogue host 192.168.1.105 until device ownership and MAC identity can be validated.",
        "2. Apply urgent patch for Apache HTTP Server (upgrade from 2.4.49 to >= 2.4.51).",
        "3. Disable Telnet administrative access on Cisco switches; enforce SSHv2 with 2048-bit RSA keys.",
        "4. Enforce Dynamic ARP Inspection (DAI) and DHCP Snooping across all edge access VLANs."
    ])
    for rec in recommendations:
        story.append(Paragraph(rec, body_style))

    doc.build(story)
    return output_path

def generate_csv_report(report_type: str, rows: List[List[str]], output_path: str) -> str:
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["# CyberSentinel Security Assessment Report"])
        writer.writerow(["# Generated At", datetime.now(timezone.utc).isoformat()])
        writer.writerow(["# Report Type", report_type])
        writer.writerow([])
        for row in rows:
            writer.writerow(row)
    return output_path
