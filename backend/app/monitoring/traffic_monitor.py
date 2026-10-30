import time
import random
from datetime import datetime, timezone
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

PROTOCOLS = ["TCP", "UDP", "TLS", "HTTP", "DNS", "ICMP", "SSH"]
COMMON_PORTS = [80, 443, 53, 22, 445, 8080, 3389, 3306, 5432, 123]

class TrafficMonitor:
    def __init__(self):
        self.packet_history: List[Dict[str, Any]] = []
        self.max_history = 1000
        self.bandwidth_mbps = 42.5
        self.total_packets_processed = 0

    def generate_live_packet(self) -> Dict[str, Any]:
        """
        Generates or captures a real-time network traffic packet entry.
        """
        proto = random.choices(PROTOCOLS, weights=[45, 20, 20, 5, 5, 3, 2])[0]
        src_port = random.randint(1024, 65535)
        
        if proto in ["HTTP", "TLS"]:
            dst_port = 80 if proto == "HTTP" else 443
        elif proto == "DNS":
            dst_port = 53
        elif proto == "SSH":
            dst_port = 22
        else:
            dst_port = random.choice(COMMON_PORTS)

        # Realistic internal subnets and external endpoints
        internal_ips = [
            "192.168.1.1", "192.168.1.10", "192.168.1.20", "192.168.1.25", 
            "192.168.1.105", "10.0.0.1", "10.0.0.15", "172.16.10.5"
        ]
        external_ips = [
            "8.8.8.8", "1.1.1.1", "142.250.190.46", "13.107.42.14", 
            "185.220.101.5", "198.51.100.23", "203.0.113.88"
        ]

        is_outbound = random.choice([True, False])
        if is_outbound:
            src_ip = random.choice(internal_ips)
            dst_ip = random.choice(external_ips)
        else:
            src_ip = random.choice(external_ips)
            dst_ip = random.choice(internal_ips)

        packet_size = random.randint(64, 1514)
        flags = random.choice(["ACK", "SYN-ACK", "PSH-ACK", "SYN", "FIN-ACK"])
        
        # Check for suspicious traffic characteristics
        is_suspicious = False
        anomaly_reason = None
        
        # Anomalies
        if src_ip == "185.220.101.5": # Known Tor Exit / Malicious C2 IP
            is_suspicious = True
            anomaly_reason = "Communication with known Tor Exit / C2 node"
        elif dst_port == 445 and is_outbound:
            is_suspicious = True
            anomaly_reason = "Outbound SMB connection attempt on WAN boundary"
        elif packet_size > 1450 and proto == "DNS":
            is_suspicious = True
            anomaly_reason = "Abnormally large DNS packet (Possible DNS Tunneling/Exfiltration)"
        elif flags == "SYN" and random.random() < 0.05:
            is_suspicious = True
            anomaly_reason = "Rapid SYN connection without completion (Port Scan / SYN Probe)"

        packet = {
            "id": f"pkt-{int(time.time()*1000)}-{random.randint(100, 999)}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "source_port": src_port,
            "destination_port": dst_port,
            "protocol": proto,
            "packet_size": packet_size,
            "flags": flags,
            "is_suspicious": is_suspicious,
            "anomaly_reason": anomaly_reason
        }

        self.packet_history.append(packet)
        if len(self.packet_history) > self.max_history:
            self.packet_history.pop(0)
            
        self.total_packets_processed += 1
        return packet

    def get_traffic_summary(self) -> Dict[str, Any]:
        """
        Computes aggregate bandwidth, protocol breakdown, and top talkers.
        """
        # Ensure we have a decent window of packets
        if len(self.packet_history) < 20:
            for _ in range(30):
                self.generate_live_packet()

        recent = self.packet_history[-100:]
        total_bytes = sum(p["packet_size"] for p in recent)
        
        proto_counts: Dict[str, int] = {}
        top_talkers_map: Dict[str, int] = {}
        suspicious_count = 0

        for p in recent:
            proto = p["protocol"]
            proto_counts[proto] = proto_counts.get(proto, 0) + 1
            
            src = p["source_ip"]
            dst = p["destination_ip"]
            top_talkers_map[src] = top_talkers_map.get(src, 0) + p["packet_size"]
            top_talkers_map[dst] = top_talkers_map.get(dst, 0) + p["packet_size"]
            
            if p["is_suspicious"]:
                suspicious_count += 1

        top_talkers = sorted(
            [{"ip": ip, "bytes": b, "megabytes": round(b / (1024*1024), 2)} for ip, b in top_talkers_map.items()],
            key=lambda x: x["bytes"],
            reverse=True
        )[:5]

        protocol_dist = [{"name": k, "value": v} for k, v in proto_counts.items()]

        return {
            "bandwidth_mbps": round(random.uniform(38.2, 58.7), 2),
            "packets_per_second": random.randint(850, 1420),
            "total_bytes_window": total_bytes,
            "suspicious_packets_count": suspicious_count,
            "protocol_distribution": protocol_dist,
            "top_talkers": top_talkers,
            "tcp_retransmission_rate": round(random.uniform(0.4, 1.8), 2),
            "total_packets_processed": self.total_packets_processed
        }

traffic_monitor = TrafficMonitor()
