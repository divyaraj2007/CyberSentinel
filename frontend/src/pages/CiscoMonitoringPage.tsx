import React, { useEffect, useState } from 'react';
import {
  Server,
  Activity,
  Cpu,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { CiscoDevice, CiscoInterface, CiscoAuditFinding } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const CiscoMonitoringPage: React.FC = () => {
  const [devices, setDevices] = useState<CiscoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<CiscoDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.request<CiscoDevice[]>('/cisco/devices');
      setDevices(data);
      if (data.length > 0) {
        setSelectedDevice(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading && !selectedDevice) {
    return (
      <div className="flex h-96 items-center justify-center text-cyan-400 font-mono text-xs">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        POLLING CISCO SNMP TELEMETRY...
      </div>
    );
  }

  const d = selectedDevice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-400" />
            CISCO INFRASTRUCTURE MONITORING & SNMP TELEMETRY
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch & router interface bandwidth, CRC/FCS error counters, link flapping & configuration security audit
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 font-mono transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          POLL SNMP NOW
        </button>
      </div>

      {d && (
        <>
          {/* Hardware Telemetry Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 font-mono">
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
              <span className="text-xs text-slate-400 uppercase">Device Hostname</span>
              <p className="text-sm font-bold text-white mt-1 truncate">{d.hostname}</p>
              <p className="text-[10px] text-cyan-400 mt-0.5">{d.model}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
              <span className="text-xs text-slate-400 uppercase flex items-center gap-1">
                <Cpu className="h-3 w-3 text-cyan-400" />
                CPU Utilization
              </span>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{d.cpu_usage}%</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Control Plane Stable</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
              <span className="text-xs text-slate-400 uppercase">Memory Allocation</span>
              <p className="text-2xl font-bold text-white mt-1">{d.memory_usage}%</p>
              <p className="text-[10px] text-slate-400 mt-0.5">DRAM Symmetrical</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
              <span className="text-xs text-slate-400 uppercase flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-amber-400" />
                Core Temperature
              </span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{d.temperature_celsius}°C</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Fans Operational</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
              <span className="text-xs text-slate-400 uppercase">Device Uptime</span>
              <p className="text-lg font-bold text-white mt-1">14.4 Days</p>
              <p className="text-[10px] text-cyan-400 mt-0.5">SNMP: {d.snmp_version}</p>
            </div>
          </div>

          {/* Interface Telemetry Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  CISCO INTERFACE STATUS & ERROR METRICS
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  Input/Output Octets, CRC/FCS Frame Errors, Discards & Link Flaps
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Interface Name</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Admin / Oper</th>
                    <th className="py-3 px-4">Speed</th>
                    <th className="py-3 px-4">Utilization</th>
                    <th className="py-3 px-4">CRC / Frame Errors</th>
                    <th className="py-3 px-4 text-right">Link Flaps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {d.interfaces.map((iface) => (
                    <tr key={iface.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-white">{iface.name}</td>
                      <td className="py-3 px-4 text-slate-300">{iface.description || 'Unlabeled'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
                          {iface.admin_status} / {iface.oper_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{iface.speed_bps / 1000000} Mbps</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                iface.utilization_percent > 70
                                  ? 'bg-red-500'
                                  : iface.utilization_percent > 40
                                  ? 'bg-amber-500'
                                  : 'bg-cyan-500'
                              }`}
                              style={{ width: `${iface.utilization_percent}%` }}
                            />
                          </div>
                          <span className="text-white font-bold">{iface.utilization_percent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {iface.crc_errors > 0 ? (
                          <span className="text-red-400 font-bold">{iface.crc_errors} Errors</span>
                        ) : (
                          <span className="text-emerald-400">0 Errors</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {iface.link_flaps > 0 ? (
                          <span className="text-amber-400 font-bold">{iface.link_flaps} Flaps</span>
                        ) : (
                          <span className="text-slate-400">Stable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cisco Configuration Security Audit Checklist */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                CISCO CONFIGURATION SECURITY AUDIT FINDINGS
              </h2>
              <p className="text-[11px] text-slate-400">
                Automated read-only compliance inspection against Cisco IOS Hardening Baselines
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {d.audit_findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 font-mono">
                      <span className="text-xs text-slate-400">{finding.rule_code}</span>
                      <StatusBadge status={finding.severity} size="sm" />
                    </div>
                    <h3 className="text-xs font-bold text-white font-sans">{finding.finding}</h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs font-mono text-emerald-400">
                    <span className="text-slate-400 block text-[10px] uppercase">Remediation:</span>
                    {finding.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
