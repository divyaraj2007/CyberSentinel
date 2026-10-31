import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Server,
  Bug,
  Activity,
  HeartPulse,
  Radio,
  Layers,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Play,
  FileText,
  Bot,
  Zap,
  Globe2,
  CheckCircle2,
  XCircle,
  Wifi,
  Cpu,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ApiClient } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';

// Comprehensive default telemetry so the dashboard is ALWAYS fully rendered and functional
const DEFAULT_TELEMETRY = {
  metrics: {
    total_devices: 6,
    online_devices: 5,
    offline_devices: 1,
    total_open_ports: 12,
    total_vulnerabilities: 4,
    critical_vulnerabilities: 1,
    active_security_alerts: 3,
    critical_security_alerts: 2,
    suspicious_connections: 3,
    bandwidth_mbps: 45.8,
    network_health_score: 94,
    security_posture_score: 84,
    latency_ms: 6.4,
    packet_loss_pct: 0.02,
  },
  charts: {
    traffic_over_time: [
      { time: '09:00', inbound: 38.2, outbound: 26.4, packets: 1340 },
      { time: '10:00', inbound: 45.1, outbound: 32.8, packets: 1620 },
      { time: '11:00', inbound: 52.8, outbound: 39.5, packets: 1890 },
      { time: '12:00', inbound: 41.3, outbound: 28.0, packets: 1410 },
      { time: '13:00', inbound: 48.7, outbound: 35.1, packets: 1720 },
      { time: '14:00', inbound: 56.4, outbound: 42.6, packets: 1980 },
      { time: '15:00', inbound: 51.2, outbound: 36.8, packets: 1810 },
      { time: '16:00', inbound: 45.8, outbound: 33.2, packets: 1650 },
    ],
    alerts_over_time: [
      { day: 'Mon', critical: 0, high: 2, medium: 4 },
      { day: 'Tue', critical: 1, high: 1, medium: 3 },
      { day: 'Wed', critical: 0, high: 3, medium: 5 },
      { day: 'Thu', critical: 2, high: 2, medium: 6 },
      { day: 'Fri', critical: 1, high: 4, medium: 4 },
      { day: 'Sat', critical: 0, high: 1, medium: 2 },
      { day: 'Sun', critical: 2, high: 3, medium: 3 },
    ],
    vulnerability_distribution: [
      { name: 'Critical', value: 1, color: '#ef4444' },
      { name: 'High', value: 2, color: '#f97316' },
      { name: 'Medium', value: 1, color: '#eab308' },
      { name: 'Low', value: 0, color: '#3b82f6' },
      { name: 'Info', value: 0, color: '#06b6d4' },
    ],
    device_availability: [
      { name: 'Online', value: 5, color: '#10b981' },
      { name: 'Offline', value: 1, color: '#64748b' },
    ],
    protocol_distribution: [
      { name: 'TCP', value: 45 },
      { name: 'TLS', value: 22 },
      { name: 'UDP', value: 18 },
      { name: 'HTTP', value: 8 },
      { name: 'DNS', value: 5 },
      { name: 'ICMP', value: 2 },
    ],
    top_talkers: [
      { ip: '192.168.1.105', bytes: 145000, megabytes: 14.5, role: 'Rogue Endpoint' },
      { ip: '192.168.1.10', bytes: 98000, megabytes: 9.8, role: 'Web Server' },
      { ip: '185.220.101.5', bytes: 64000, megabytes: 6.4, role: 'External C2' },
      { ip: '192.168.1.20', bytes: 48000, megabytes: 4.8, role: 'Domain Controller' },
      { ip: '192.168.1.1', bytes: 32000, megabytes: 3.2, role: 'Core Gateway' },
    ],
  },
  activity_feed: [
    {
      id: 'act-1',
      type: 'alert',
      title: 'Suricata SYN Scan Detected',
      detail: 'Source 192.168.1.105 targeted port 80 on web server',
      time: '2 mins ago',
      severity: 'high',
    },
    {
      id: 'act-2',
      type: 'discovery',
      title: 'New Rogue Hardware Flagged',
      detail: 'Raspberry Pi Foundation MAC connected on VLAN 10',
      time: '14 mins ago',
      severity: 'critical',
    },
    {
      id: 'act-3',
      type: 'snmp',
      title: 'Cisco Catalyst Interface Utilization Peak',
      detail: 'Gig1/0/3 exceeded 75% bandwidth threshold',
      time: '32 mins ago',
      severity: 'medium',
    },
    {
      id: 'act-4',
      type: 'forensics',
      title: 'Evidence Artifact Ingested',
      detail: 'SHA-256 integrity calculated for perimeter PCAP',
      time: '1 hour ago',
      severity: 'low',
    },
  ],
};

const CRITICAL_ASSETS = [
  { name: 'Cisco Catalyst 9300 Core Gateway', ip: '192.168.1.1', type: 'Router / Switch', status: 'online', latency: '2.1 ms', cpu: '28%', temp: '38.5°C' },
  { name: 'Ubuntu Web Server (Apache 2.4.49)', ip: '192.168.1.10', type: 'Server', status: 'online', latency: '3.4 ms', cpu: '42%', temp: '41.0°C' },
  { name: 'Windows 2022 Domain Controller (DC01)', ip: '192.168.1.20', type: 'Server', status: 'online', latency: '1.8 ms', cpu: '18%', temp: '36.2°C' },
  { name: 'Enterprise PostgreSQL Cluster', ip: '192.168.1.25', type: 'Server', status: 'online', latency: '1.2 ms', cpu: '24%', temp: '35.0°C' },
  { name: 'Surveillance IoT Camera #50', ip: '192.168.1.50', type: 'IoT Device', status: 'online', latency: '5.6 ms', cpu: '12%', temp: '34.0°C' },
  { name: 'Unauthorized Rogue Hardware (Raspberry Pi)', ip: '192.168.1.105', type: 'Rogue Endpoint', status: 'unauthorized', latency: '8.4 ms', cpu: '88%', temp: '48.0°C' },
];

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(DEFAULT_TELEMETRY);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [timeWindow, setTimeWindow] = useState('24H');

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const summary = await ApiClient.request<any>('/dashboard/summary');
      if (summary && summary.metrics) {
        setData(summary);
        setIsBackendConnected(true);
      }
    } catch (e: any) {
      console.warn('Backend unavailable, using cached enterprise telemetry:', e?.message);
      setIsBackendConnected(false);
      // Fallback data ensures dashboard is ALWAYS fully populated and interactive
      setData((prev: any) => prev || DEFAULT_TELEMETRY);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 12000);
    return () => clearInterval(interval);
  }, []);

  const m = data?.metrics || DEFAULT_TELEMETRY.metrics;
  const charts = data?.charts || DEFAULT_TELEMETRY.charts;
  const feed = data?.activity_feed || DEFAULT_TELEMETRY.activity_feed;

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1920px] mx-auto">
      {/* Backend Offline / Info Banner */}
      {!isBackendConnected && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-600/50 bg-amber-950/40 text-amber-200 text-xs font-mono shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>STANDALONE DEMO MODE:</strong> Python backend at <code className="bg-amber-900/60 px-1 py-0.5 rounded text-white">http://127.0.0.1:8000</code> is offline. Displaying cached SOC telemetry.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-300">Run <code className="text-white font-bold">scripts\run_dev.bat</code> to connect live</span>
            <button
              onClick={fetchSummary}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Top SOC Command Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-800/90 bg-gradient-to-r from-slate-950 via-[#0d1322] to-slate-950 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.1)_0,transparent_70%)] pointer-events-none" />

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono uppercase">
              SECURITY OPERATIONS CENTER (SOC) COMMAND CENTER
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              DEFCON 3 • ELEVATED
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans max-w-3xl">
            Unified live sensor telemetry, deep packet inspection, automated intrusion detection, CVE vulnerability correlation, and Cisco infrastructure health.
          </p>
        </div>

        {/* Action Controls & Engine Status */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          {/* Time range selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
            {['1H', '6H', '24H', '7D'].map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  timeWindow === tw ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tw}
              </button>
            ))}
          </div>

          <button
            onClick={fetchSummary}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs text-cyan-300 font-mono font-semibold transition-all shadow-md"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            SYNC SENSORS
          </button>
        </div>
      </div>

      {/* Primary SOC Metrics Grid (Expanded Mega-Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Discovered Assets */}
        <div className="p-5 rounded-2xl border border-blue-900/40 bg-gradient-to-b from-blue-950/30 to-slate-950 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
            <span>Discovered Assets</span>
            <Server className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{m.total_devices}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +1 Rogue
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="text-emerald-400 font-bold">{m.online_devices} Online</span>
            <span className="text-slate-400">{m.offline_devices} Offline</span>
          </div>
        </div>

        {/* Monitored Ports */}
        <div className="p-5 rounded-2xl border border-cyan-900/40 bg-gradient-to-b from-cyan-950/30 to-slate-950 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
            <span>Audited Ports</span>
            <Radio className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{m.total_open_ports}</span>
            <span className="text-xs font-semibold text-cyan-400">Open Services</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Nmap Scan Profile</span>
            <span className="text-cyan-300 font-bold">Standard -sV</span>
          </div>
        </div>

        {/* CVE Vulnerabilities */}
        <div className="p-5 rounded-2xl border border-amber-900/40 bg-gradient-to-b from-amber-950/30 to-slate-950 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
            <span>Vulnerabilities</span>
            <Bug className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{m.total_vulnerabilities}</span>
            <span className="text-xs font-bold text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
              {m.critical_vulnerabilities} CRITICAL
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <span>NVD CVSS Max</span>
            <span className="text-red-400 font-bold">9.8 Base</span>
          </div>
        </div>

        {/* Active IDS Alerts */}
        <div className="p-5 rounded-2xl border border-red-900/50 bg-gradient-to-b from-red-950/30 to-slate-950 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
            <span>Active Alerts</span>
            <ShieldAlert className="h-4 w-4 text-red-400 animate-pulse" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-400 font-mono">{m.active_security_alerts}</span>
            <span className="text-xs font-semibold text-slate-400">Under Triage</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Suricata / Zeek</span>
            <span className="text-red-400 font-bold">{m.critical_security_alerts} Critical Escalated</span>
          </div>
        </div>

        {/* Operational Network Health */}
        <div className="p-5 rounded-2xl border border-emerald-900/40 bg-gradient-to-b from-emerald-950/30 to-slate-950 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
            <span>Network Health</span>
            <HeartPulse className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {m.network_health_score}%
            </span>
            <span className="text-xs font-semibold text-emerald-400">Optimal</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Latency</span>
            <span className="text-white font-bold">{m.latency_ms} ms</span>
          </div>
        </div>

        {/* Security Posture Score */}
        <div className="p-5 rounded-2xl border border-cyan-900/40 bg-gradient-to-b from-cyan-950/30 to-slate-950 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase">
            <span>Security Posture</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-300 font-mono">
              {m.security_posture_score}%
            </span>
            <span className="text-xs font-semibold text-cyan-400">Hardened</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Deductions</span>
            <span className="text-amber-400 font-bold">-16 pts (CVE/Rogue)</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row: Expanded Deep Visualizations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Network Bandwidth & Throughput Over Time (Enlarged to 340px) */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                NETWORK BANDWIDTH & THROUGHPUT SPECTRUM (MBPS)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time full-duplex traffic curves, packet frequency & peak utilization
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-3 py-1 rounded-full">
                {m.bandwidth_mbps} Mbps Peak
              </span>
            </div>
          </div>

          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.traffic_over_time || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12, fontFamily: 'monospace' }} unit="M" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070b14',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIn)"
                  name="Inbound Traffic (Mbps)"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOut)"
                  name="Outbound Traffic (Mbps)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400 mt-2">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">PACKET SAMPLING:</span>
              <span className="text-white font-bold">1,450 pkt/s Average</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">TCP RETRANSMISSIONS:</span>
              <span className="text-emerald-400 font-bold">0.6% Nominal</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">BUFFER UTILIZATION:</span>
              <span className="text-cyan-300 font-bold">18.4% Headroom</span>
            </div>
          </div>
        </div>

        {/* Security Alerts Weekly Timeline (Enlarged to 340px) */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                SECURITY INCIDENTS & BEHAVIORAL IDS TIMELINE
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Suricata confirmed signature triggers vs Zeek heuristic anomaly events
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 border border-red-800 px-3 py-1 rounded-full">
              Weekly Trend Analysis
            </span>
          </div>

          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.alerts_over_time || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070b14',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="critical" fill="#ef4444" name="Critical Severity" radius={[4, 4, 0, 0]} />
                <Bar dataKey="high" fill="#f97316" name="High Severity" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" fill="#eab308" name="Medium Severity" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400 mt-2">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">TOTAL WEEKLY DETECTIONS:</span>
              <span className="text-white font-bold">42 Rules Matched</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">MEAN TIME TO TRIAGE:</span>
              <span className="text-cyan-400 font-bold">4.2 Minutes</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">CONTAINMENT RATE:</span>
              <span className="text-emerald-400 font-bold">100% Mitigated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Protocol Breakdown, Top Talkers, & CVE Severity Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CVE Severity Distribution */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-400" />
              CVSS 3.1 VULNERABILITY SPECTRUM
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Service banner correlation with NIST National Vulnerability Database
            </p>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.vulnerability_distribution || []}
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts.vulnerability_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#07090e" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070b14',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
            {(charts.vulnerability_distribution || []).map((v: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: v.color }} />
                <span className="text-slate-400 text-[11px]">{v.name}:</span>
                <span className="font-bold text-white ml-auto">{v.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Talkers & Bandwidth Consumers */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-400" />
              TOP TALKERS & BANDWIDTH SINKS
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Highest data transfer volume nodes in monitored subnets
            </p>
          </div>

          <div className="space-y-3 my-3">
            {(charts.top_talkers || []).map((t: any, idx: number) => {
              const maxMB = charts.top_talkers[0]?.megabytes || 15;
              const pct = Math.round((t.megabytes / maxMB) * 100);
              const isRogue = t.ip === '192.168.1.105' || t.ip === '185.220.101.5';

              return (
                <div key={idx} className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">#{idx + 1}</span>
                      <span className={`font-bold ${isRogue ? 'text-red-400' : 'text-white'}`}>{t.ip}</span>
                      <span className="text-[10px] text-slate-400 font-sans">({t.role || 'Host'})</span>
                    </div>
                    <span className="text-cyan-400 font-bold">{t.megabytes} MB</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${isRogue ? 'bg-red-500' : 'bg-cyan-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>PACKET INSPECTION: DEEP</span>
            <span className="text-emerald-400 font-bold">SYMMETRICAL DUPLEX</span>
          </div>
        </div>

        {/* Real-time Activity & IDS Rule Ingestion Stream */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              LIVE REAL-TIME ACTIVITY STREAM
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Chronological security events dispatched via WebSocket bus
            </p>
          </div>

          <div className="space-y-3.5 my-3 flex-1 overflow-y-auto max-h-64 pr-1">
            {feed.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span
                  className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    act.severity === 'critical'
                      ? 'bg-red-500 animate-pulse'
                      : act.severity === 'high'
                      ? 'bg-orange-500'
                      : act.severity === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-cyan-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-200 truncate">{act.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>WEBSOCKET BUS: CONNECTED</span>
            <span className="text-cyan-400 font-bold">12/12 ENGINES ONLINE</span>
          </div>
        </div>
      </div>

      {/* Row 4: Critical Infrastructure & Monitored Assets Matrix */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl font-mono space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-cyan-400" />
              ENTERPRISE CRITICAL ASSETS MONITORING MATRIX
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Live status, ping latency, core CPU utilization, and threat classification across all monitored nodes
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            6 Nodes Tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {CRITICAL_ASSETS.map((asset, idx) => {
            const isRogue = asset.status === 'unauthorized';
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isRogue
                    ? 'border-red-600/70 bg-red-950/20 shadow-lg shadow-red-950/50'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className={`text-xs font-bold ${isRogue ? 'text-red-300' : 'text-white'}`}>
                      {asset.name}
                    </h3>
                    <p className="text-[11px] text-cyan-400 font-bold mt-0.5">{asset.ip}</p>
                  </div>
                  {isRogue ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                      FLAGGED ROGUE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      OPERATIONAL
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Ping Latency</span>
                    <span className="text-white font-bold">{asset.latency}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Core CPU</span>
                    <span className={isRogue ? 'text-red-400 font-bold' : 'text-slate-200'}>
                      {asset.cpu}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Temperature</span>
                    <span className="text-slate-200">{asset.temp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 5: Quick Command Center Action Bar */}
      <div className="p-5 rounded-2xl border border-cyan-800/50 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            SOC IMMEDIATE OPERATIONAL COMMANDS
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Execute security scans, launch subnet discovery, or compile executive compliance reports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/scanner"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            Nmap Port Scan
          </a>
          <a
            href="/discovery"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Server className="h-3.5 w-3.5 text-cyan-400" />
            Subnet Sweep
          </a>
          <a
            href="/reports"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            Generate PDF
          </a>
        </div>
      </div>
    </div>
  );
};
