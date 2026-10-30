import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Play,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [reportType, setReportType] = useState('complete_assessment');
  const [formatType, setFormatType] = useState('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<any>(null);

  const fetchReports = async () => {
    try {
      const data = await ApiClient.request<any[]>('/reports');
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await ApiClient.request<any>(
        `/reports/generate?report_type=${reportType}&format_type=${formatType}`,
        { method: 'POST' }
      );
      setLastGenerated(res);
      await fetchReports();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTypes = [
    { id: 'complete_assessment', name: '10. Complete Enterprise Security Assessment' },
    { id: 'network_discovery', name: '1. Network Discovery & Device Inventory Report' },
    { id: 'port_scanning', name: '2. Port Scanning & Service Audit Report' },
    { id: 'vulnerability_assessment', name: '3. Vulnerability Assessment & CVE Report' },
    { id: 'network_traffic', name: '4. Network Traffic & Bandwidth Analysis Report' },
    { id: 'intrusion_detection', name: '5. Intrusion Detection & IDS Rules Report' },
    { id: 'cisco_infrastructure', name: '6. Cisco Infrastructure & SNMP Audit Report' },
    { id: 'security_incident', name: '7. Security Incident Response Report' },
    { id: 'network_health', name: '8. Network Operational Health Report' },
    { id: 'threat_intelligence', name: '9. Threat Intelligence & IOC Vault Report' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            EXECUTIVE & TECHNICAL SECURITY REPORT GENERATOR
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Downloadable PDF and CSV compliance reports with executive summaries, technical findings & remediation
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-xl">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end font-mono text-xs">
          <div>
            <label className="block text-slate-300 uppercase mb-1.5 font-bold">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
            >
              {reportTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 uppercase mb-1.5 font-bold">Output Format</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormatType('PDF')}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                  formatType === 'PDF'
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                PDF Document
              </button>
              <button
                type="button"
                onClick={() => setFormatType('CSV')}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                  formatType === 'CSV'
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                CSV Spreadsheet
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all disabled:opacity-50 shadow-md shadow-cyan-950"
          >
            <Play className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'GENERATING REPORT...' : 'COMPILE & EXPORT REPORT'}
          </button>
        </form>
      </div>

      {/* Generated Report Quick Download Card */}
      {lastGenerated && (
        <div className="p-5 rounded-2xl border border-emerald-800 bg-slate-950/90 shadow-2xl flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">
                REPORT READY FOR DOWNLOAD
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">{lastGenerated.title}</h3>
              <p className="text-[11px] text-slate-400">{lastGenerated.filename}</p>
            </div>
          </div>

          <a
            href={lastGenerated.download_url}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-colors"
          >
            <Download className="h-4 w-4" />
            DOWNLOAD {lastGenerated.format}
          </a>
        </div>
      )}

      {/* Report Archive Vault Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            COMPILED REPORTS ARCHIVE
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Report Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Generated Timestamp</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.map((r) => {
                const basename = r.file_path ? r.file_path.split('\\').pop()?.split('/').pop() : 'report.pdf';
                return (
                  <tr key={r.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      {r.title}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{r.report_type}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-cyan-400">
                        {r.format}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/api/v1/reports/download/${basename}`}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </a>
                    </td>
                  </tr>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No reports generated yet. Select a report type above to compile.
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
