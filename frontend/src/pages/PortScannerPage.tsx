import React, { useEffect, useState } from 'react';
import { Radio, Play, ShieldAlert, Terminal, AlertCircle, History, CheckCircle2, Clock } from 'lucide-react';
import { ApiClient } from '../api/client';
import { Scan, Port } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const PortScannerPage: React.FC = () => {
  const [target, setTarget] = useState('192.168.1.10');
  const [scanType, setScanType] = useState('Standard Scan');
  const [rateLimit, setRateLimit] = useState(1000);
  const [isScanning, setIsScanning] = useState(false);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [ports, setPorts] = useState<Port[]>([]);
  const [scansHistory, setScansHistory] = useState<Scan[]>([]);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const data = await ApiClient.request<Scan[]>('/scans');
      setScansHistory(data);
      if (data.length > 0 && !activeScan) {
        handleSelectScan(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSelectScan = async (scan: Scan) => {
    setActiveScan(scan);
    try {
      const p = await ApiClient.request<Port[]>(`/scans/${scan.id}/ports`);
      setPorts(p);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsScanning(true);

    try {
      const res = await ApiClient.request<Scan>('/scans/start', {
        method: 'POST',
        body: JSON.stringify({
          target,
          scan_type: scanType,
          rate_limit: rateLimit,
        }),
      });

      setActiveScan(res);
      await fetchHistory();
      const p = await ApiClient.request<Port[]>(`/scans/${res.id}/ports`);
      setPorts(p);
    } catch (err: any) {
      setError(err.message || 'Scan execution failed');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Radio className="h-5 w-5 text-cyan-400" />
            NMAP PORT SCANNER & SERVICE DETECTION ENGINE
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            TCP/UDP port audit, service banner fingerprinting, OS detection & risk classification
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-3 py-1.5 rounded-lg">
          <Terminal className="h-4 w-4" />
          <span>ENGINE: Real Nmap CLI with Safe Rate Limiting</span>
        </div>
      </div>

      {/* Scanner Controls Form */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-xl">
        {error && (
          <div className="mb-4 flex items-center gap-2.5 p-3 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleStartScan} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5 uppercase">
              Target IP / Hostname
            </label>
            <input
              type="text"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="192.168.1.10"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5 uppercase">
              Scan Profile
            </label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="Quick Scan">Quick Scan (Top 100 ports -F)</option>
              <option value="Standard Scan">Standard Scan (Top 1000 + Services -sV)</option>
              <option value="Full Port Scan">Full Port Scan (1-10000 -T4)</option>
              <option value="Service Detection Scan">Service Detection Scan (-sV -sC)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 font-mono mb-1.5">
              <span className="uppercase">Rate Limit</span>
              <span className="text-cyan-400">{rateLimit} pkt/s</span>
            </div>
            <input
              type="range"
              min="100"
              max="3000"
              step="100"
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isScanning}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md shadow-cyan-950"
          >
            <Play className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'EXECUTING NMAP...' : 'LAUNCH AUTHORIZED SCAN'}
          </button>
        </form>
      </div>

      {/* Results and History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discovered Ports Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  DISCOVERED PORTS & SERVICES AUDIT
                </h2>
                <p className="text-[11px] text-slate-400">
                  Target: {activeScan?.target || target} • {ports.length} Open/Filtered Ports Found
                </p>
              </div>
              {activeScan && <StatusBadge status={activeScan.status} />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Port</th>
                    <th className="py-2.5 px-3">Protocol</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Version / Product</th>
                    <th className="py-2.5 px-3 text-right">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ports.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-bold text-white">{p.port_number}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{p.protocol}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold uppercase">{p.state}</td>
                      <td className="py-2.5 px-3 text-slate-200">{p.service_name || 'unknown'}</td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[200px]">
                        {p.service_version || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <StatusBadge status={p.risk_level} size="sm" />
                      </td>
                    </tr>
                  ))}
                  {ports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {isScanning ? 'Scan in progress...' : 'No open ports found for this scan.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw Terminal Output */}
          {activeScan?.raw_output && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2 text-xs font-mono text-cyan-400">
                <Terminal className="h-4 w-4" />
                <span>NMAP EXECUTION LOGS</span>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 bg-black/60 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap border border-slate-900 leading-relaxed">
                {activeScan.raw_output}
              </pre>
            </div>
          )}
        </div>

        {/* Scan History Sidebar (1 col) */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <History className="h-4 w-4 text-cyan-400" />
              SCAN HISTORY
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">{scansHistory.length} Audits</span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {scansHistory.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectScan(s)}
                className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                  activeScan?.id === s.id
                    ? 'border-cyan-500/50 bg-cyan-950/30 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-cyan-300">{s.target}</span>
                  <StatusBadge status={s.status} size="sm" />
                </div>
                <div className="text-[11px] text-slate-400">{s.scan_type}</div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5">
                  <span>{s.open_ports_count} Open Ports</span>
                  <span>{new Date(s.started_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
