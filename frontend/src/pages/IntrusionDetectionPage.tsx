import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Play,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Terminal,
  Zap,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { SecurityAlert } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const IntrusionDetectionPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.request<SecurityAlert[]>('/ids/alerts');
      setAlerts(data);
      if (data.length > 0 && !selectedAlert) {
        setSelectedAlert(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: number, newStatus: string) => {
    try {
      const updated = await ApiClient.request<SecurityAlert>(`/ids/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateEvent = async () => {
    setIsSimulating(true);
    try {
      await ApiClient.request('/ids/simulate', { method: 'POST' });
      await fetchAlerts();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const filtered = alerts.filter((a) => {
    if (severityFilter && a.severity !== severityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(s) ||
        (a.source_ip && a.source_ip.includes(s)) ||
        (a.destination_ip && a.destination_ip.includes(s)) ||
        a.alert_id.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            SURICATA & ZEEK INTRUSION DETECTION SYSTEM (IDS/NSM)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Confirmed signature rules, behavioral protocol heuristics, lateral movement tracking & automated alert triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateEvent}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md shadow-red-950"
          >
            <Zap className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'INJECTING EVENT...' : 'SIMULATE IDS EVENT'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/70 font-mono text-xs">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, event ID, source or destination IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List (1.3 col) */}
        <div className="lg:col-span-1 space-y-2.5">
          {filtered.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedAlert(a)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedAlert?.id === a.id
                  ? 'border-cyan-500/60 bg-cyan-950/20'
                  : 'border-slate-800 bg-slate-950/70 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                <span className="font-bold text-slate-400">{a.alert_id}</span>
                <StatusBadge status={a.severity} size="sm" />
              </div>
              <h3 className="text-xs font-bold text-slate-200 line-clamp-2">{a.title}</h3>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                <span className="text-cyan-400">{a.detection_engine}</span>
                <span>{new Date(a.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No alerts match the criteria.
            </div>
          )}
        </div>

        {/* Selected Alert Details Pane (2 cols) */}
        <div className="lg:col-span-2">
          {selectedAlert ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 shadow-xl space-y-5 font-mono">
              {/* Alert Title & Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-slate-400">{selectedAlert.alert_id}</span>
                    <StatusBadge status={selectedAlert.severity} />
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      Engine: {selectedAlert.detection_engine}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white font-sans">{selectedAlert.title}</h2>
                </div>

                {/* Status Update Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Acknowledged')}
                    className="px-2.5 py-1 rounded border border-blue-800 bg-blue-950/40 text-blue-300 text-[11px] font-bold hover:bg-blue-900/60"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Resolved')}
                    className="px-2.5 py-1 rounded border border-emerald-800 bg-emerald-950/40 text-emerald-300 text-[11px] font-bold hover:bg-emerald-900/60"
                  >
                    Resolve
                  </button>
                </div>
              </div>

              {/* IP Endpoints */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Source Endpoint</span>
                  <span className="text-cyan-400 font-bold text-sm">
                    {selectedAlert.source_ip || 'N/A'}:{selectedAlert.source_port || ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Target Endpoint</span>
                  <span className="text-white font-bold text-sm">
                    {selectedAlert.destination_ip || 'N/A'}:{selectedAlert.destination_port || ''}
                  </span>
                </div>
              </div>

              {/* Supporting Evidence Payload */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  Correlated Telemetry Evidence (JSON)
                </h3>
                <pre className="p-4 rounded-xl bg-black/70 border border-slate-900 text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedAlert.evidence_json, null, 2)}
                </pre>
              </div>

              {/* Recommended Investigation Steps */}
              {selectedAlert.recommendation && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 text-amber-200 text-xs font-sans">
                  <h4 className="font-bold flex items-center gap-1.5 text-amber-400 font-mono text-xs mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    RECOMMENDED INVESTIGATION PROCEDURE
                  </h4>
                  <p className="leading-relaxed text-slate-300">{selectedAlert.recommendation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-12 text-center text-slate-400">
              Select an alert from the queue to review full investigation details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
