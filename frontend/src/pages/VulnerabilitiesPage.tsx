import React, { useEffect, useState } from 'react';
import {
  Bug,
  Search,
  Filter,
  Play,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { Vulnerability } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const VulnerabilitiesPage: React.FC = () => {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVulns = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.request<Vulnerability[]>('/vulnerabilities');
      setVulns(data);
      if (data.length > 0 && !selectedVuln) {
        setSelectedVuln(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVulns();
  }, []);

  const handleTriggerAssessment = async () => {
    setIsScanning(true);
    try {
      await ApiClient.request('/vulnerabilities/scan', { method: 'POST' });
      await fetchVulns();
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateStatus = async (vulnId: number, newStatus: string) => {
    try {
      await ApiClient.request(`/vulnerabilities/${vulnId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setVulns((prev) =>
        prev.map((v) => (v.id === vulnId ? { ...v, status: newStatus as any } : v))
      );
      if (selectedVuln?.id === vulnId) {
        setSelectedVuln({ ...selectedVuln, status: newStatus as any });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = vulns.filter((v) => {
    if (severityFilter && v.severity !== severityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        v.cve_id.toLowerCase().includes(s) ||
        v.title.toLowerCase().includes(s) ||
        (v.affected_service && v.affected_service.toLowerCase().includes(s)) ||
        (v.device_ip && v.device_ip.includes(s))
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
            <Bug className="h-5 w-5 text-amber-400" />
            VULNERABILITY ASSESSMENT & CVE CORRELATION ENGINE
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Service banner version matching with National Vulnerability Database (NVD) & CVSS scoring
          </p>
        </div>

        <button
          onClick={handleTriggerAssessment}
          disabled={isScanning}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md shadow-amber-950"
        >
          <Play className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'CORRELATING CVES...' : 'TRIGGER VULNERABILITY SCAN'}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/70 font-mono text-xs">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by CVE ID, title, affected service, or device IP..."
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

      {/* 2-Column Vulnerability View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">CVE ID</th>
                  <th className="py-3 px-4">Severity / CVSS</th>
                  <th className="py-3 px-4">Affected Service</th>
                  <th className="py-3 px-4">Host IP</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVuln(v)}
                    className={`cursor-pointer hover:bg-slate-900/40 transition-colors ${
                      selectedVuln?.id === v.id ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-cyan-300">{v.cve_id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={v.severity} size="sm" />
                        <span className="text-white font-bold">{v.cvss_score}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{v.affected_service}</td>
                    <td className="py-3 px-4 text-slate-300">{v.device_ip || '192.168.1.10'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={v.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.is_potential ? (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded">
                          POTENTIAL
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                          VALIDATED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No vulnerabilities found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected CVE Inspector (1 col) */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-xl flex flex-col justify-between">
          {selectedVuln ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-cyan-300 font-mono">
                    {selectedVuln.cve_id}
                  </span>
                  <StatusBadge status={selectedVuln.severity} />
                </div>
                <h3 className="text-xs font-bold text-white font-sans mt-1">
                  {selectedVuln.title}
                </h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">CVSS 3.1 BASE SCORE:</span>
                  <span className="text-xl font-bold text-red-400">{selectedVuln.cvss_score} / 10.0</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">AFFECTED SOFTWARE:</span>
                  <span className="text-slate-200">{selectedVuln.affected_service}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">DESCRIPTION:</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed mt-0.5">
                    {selectedVuln.description}
                  </p>
                </div>

                {selectedVuln.remediation && (
                  <div className="p-3 rounded-lg border border-emerald-800/80 bg-emerald-950/20 text-emerald-200 font-sans">
                    <span className="font-bold font-mono text-[11px] text-emerald-400 block mb-1">
                      REMEDIATION RECOMMENDATION:
                    </span>
                    <p className="text-xs leading-relaxed">{selectedVuln.remediation}</p>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="pt-3 border-t border-slate-800">
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Mark Vulnerability Status:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => handleUpdateStatus(selectedVuln.id, 'Investigating')}
                    className="p-1.5 rounded border border-blue-800 bg-blue-950/40 text-blue-300 hover:bg-blue-900/60"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedVuln.id, 'Remediated')}
                    className="p-1.5 rounded border border-emerald-800 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
                  >
                    Remediate
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a vulnerability to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
