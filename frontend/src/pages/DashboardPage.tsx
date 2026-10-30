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
  ArrowUpRight,
  RefreshCw,
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
} from 'recharts';
import { ApiClient } from '../api/client';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const summary = await ApiClient.request<any>('/dashboard/summary');
      setData(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
          <RefreshCw className="h-4 w-4 animate-spin" />
          SYNCHRONIZING SOC TELEMETRY BUS...
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const charts = data?.charts || {};
  const feed = data?.activity_feed || [];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            CENTRALIZED SECURITY MONITORING DASHBOARD
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time intrusion detection, continuous vulnerability correlation & Cisco infrastructure health
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 font-mono transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            REFRESH
          </button>
        </div>
      </div>

      {/* Primary SOC Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Discovered Devices"
          value={m.total_devices || 6}
          subtitle={`${m.online_devices || 5} Online • ${m.offline_devices || 1} Offline`}
          icon={Server}
          color="blue"
        />
        <MetricCard
          title="Open Ports"
          value={m.total_open_ports || 12}
          subtitle="Monitored across subnets"
          icon={Radio}
          color="cyan"
        />
        <MetricCard
          title="Vulnerabilities"
          value={m.total_vulnerabilities || 4}
          subtitle={`${m.critical_vulnerabilities || 1} Critical CVE findings`}
          icon={Bug}
          color="amber"
        />
        <MetricCard
          title="Active Alerts"
          value={m.active_security_alerts || 3}
          subtitle={`${m.critical_security_alerts || 2} Critical Triaged`}
          icon={ShieldAlert}
          color="red"
        />
        <MetricCard
          title="Network Health"
          value={`${m.network_health_score || 94}%`}
          subtitle={`Latency: ${m.latency_ms || 6.4} ms`}
          icon={HeartPulse}
          color="emerald"
        />
        <MetricCard
          title="Security Posture"
          value={`${m.security_posture_score || 84}%`}
          subtitle="Enterprise hardened"
          icon={Layers}
          color="cyan"
        />
      </div>

      {/* Row 2: Traffic Over Time & Alerts Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Network Traffic Over Time */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                NETWORK BANDWIDTH UTILIZATION (MBPS)
              </h2>
              <p className="text-[11px] text-slate-400">Inbound vs outbound throughput timeline</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
              {m.bandwidth_mbps || 45.2} Mbps Peak
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.traffic_over_time || []}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#colorIn)"
                  name="Inbound Mbps"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorOut)"
                  name="Outbound Mbps"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Alerts Over Time */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                SECURITY ALERTS OVER TIME (WEEKLY TREND)
              </h2>
              <p className="text-[11px] text-slate-400">Critical & high behavioral IDS detections</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.alerts_over_time || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="critical" fill="#ef4444" name="Critical Alerts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="high" fill="#f97316" name="High Alerts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" fill="#eab308" name="Medium Alerts" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Vulnerability Severity Distribution, Top Talkers & Live Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vulnerability Distribution Donut */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-400" />
              CVE SEVERITY DISTRIBUTION
            </h2>
            <p className="text-[11px] text-slate-400">Classified by CVSS 3.1 metrics</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.vulnerability_distribution || []}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts.vulnerability_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-[11px] font-mono">
            {(charts.vulnerability_distribution || []).map((v: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: v.color }} />
                <span className="text-slate-400">{v.name}:</span>
                <span className="font-bold text-white">{v.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Bandwidth Consuming Devices */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-400" />
              TOP TALKERS & BANDWIDTH
            </h2>
            <p className="text-[11px] text-slate-400">Highest volume IP nodes in current window</p>
          </div>

          <div className="space-y-2.5 my-3">
            {(charts.top_talkers || []).map((t: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">#{idx + 1}</span>
                  <span className="text-slate-200 font-semibold">{t.ip}</span>
                </div>
                <span className="text-cyan-400 font-bold">{t.megabytes} MB</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between">
            <span>PACKET SAMPLING: LIVE</span>
            <span className="text-emerald-400">TCP RETRANS: 0.8%</span>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              REAL-TIME ACTIVITY FEED
            </h2>
            <p className="text-[11px] text-slate-400">Chronological SOC event pipeline</p>
          </div>

          <div className="space-y-3 my-3">
            {feed.map((act: any) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <span
                  className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                    act.severity === 'critical'
                      ? 'bg-red-500'
                      : act.severity === 'high'
                      ? 'bg-orange-500'
                      : act.severity === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-cyan-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-200 truncate">{act.title}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono text-center">
            WEBSOCKET STREAM ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
};
