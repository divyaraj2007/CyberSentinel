import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  FolderLock,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { SecurityAlert } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const AlertsManagementPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.request<SecurityAlert[]>('/ids/alerts');
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: number, status: string) => {
    try {
      const updated = await ApiClient.request<SecurityAlert>(`/ids/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleEscalateToIncident = async (alert: SecurityAlert) => {
    try {
      await ApiClient.request('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title: `Investigation: ${alert.title}`,
          severity: alert.severity,
          description: `Auto-escalated from IDS alert ${alert.alert_id}. Source: ${alert.source_ip}, Target: ${alert.destination_ip}.`,
          alert_ids: [alert.id],
        }),
      });
      await handleUpdateStatus(alert.id, 'Investigating');
      window.alert('Alert successfully escalated to Incident Investigation case!');
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = alerts.filter((a) => {
    if (severityFilter && a.severity !== severityFilter) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(s) ||
        a.alert_id.toLowerCase().includes(s) ||
        (a.source_ip && a.source_ip.includes(s))
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
            <AlertTriangle className="h-5 w-5 text-red-400" />
            CENTRALIZED SECURITY ALERT MANAGEMENT & TRIAGE
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time alert triage, operator acknowledgement, case escalation & investigation workflows
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/70 font-mono text-xs">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Alert ID, title, or host IP..."
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Detection Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Source Endpoint</th>
                <th className="py-3 px-4">Target Endpoint</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-cyan-300">{a.alert_id}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={a.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-200 max-w-xs truncate">
                    {a.title}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{a.category}</td>
                  <td className="py-3 px-4 text-cyan-400 font-bold">{a.source_ip || 'N/A'}</td>
                  <td className="py-3 px-4 text-slate-300">{a.destination_ip || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={a.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.status === 'New' && (
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'Acknowledged')}
                          className="px-2 py-0.5 rounded border border-blue-800 bg-blue-950/40 text-blue-300 text-[10px] font-bold hover:bg-blue-900"
                        >
                          Ack
                        </button>
                      )}
                      {a.status !== 'Resolved' && (
                        <button
                          onClick={() => handleEscalateToIncident(a)}
                          className="px-2 py-0.5 rounded border border-amber-800 bg-amber-950/40 text-amber-300 text-[10px] font-bold hover:bg-amber-900 flex items-center gap-1"
                        >
                          <FolderLock className="h-3 w-3" />
                          Escalate
                        </button>
                      )}
                      {a.status !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'Resolved')}
                          className="px-2 py-0.5 rounded border border-emerald-800 bg-emerald-950/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-900"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No security alerts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
