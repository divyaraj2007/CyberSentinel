import React, { useEffect, useState } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Layers,
  FileText,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { Incident } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.request<Incident[]>('/incidents');
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        handleSelectIncident(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSelectIncident = async (id: number) => {
    try {
      const data = await ApiClient.request<any>(`/incidents/${id}`);
      setSelectedIncident(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.request('/incidents', {
        method: 'POST',
        body: JSON.stringify({ title, severity, description }),
      });
      setIsCreating(false);
      setTitle('');
      setDescription('');
      await fetchIncidents();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedIncident) return;
    try {
      await ApiClient.request(`/incidents/${selectedIncident.id}/status?status_val=${status}`, {
        method: 'PUT',
      });
      setSelectedIncident({ ...selectedIncident, status });
      await fetchIncidents();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <FolderLock className="h-5 w-5 text-amber-400" />
            INCIDENT RESPONSE & EVIDENCE MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full lifecycle incident containment, root-cause investigation, evidence chain of custody & playbooks
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-950"
        >
          <Plus className="h-4 w-4" />
          CREATE NEW INCIDENT
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h2 className="text-sm font-bold text-white font-mono mb-4 uppercase">
              Create Security Incident Case
            </h2>
            <form onSubmit={handleCreate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">INCIDENT TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rogue Device Reconnaissance & SYN Flood"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SEVERITY LEVEL</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DESCRIPTION & SCOPE</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of detected threat activity..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-Column Incident Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Cases List (1 col) */}
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => handleSelectIncident(inc.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedIncident?.id === inc.id
                  ? 'border-cyan-500/60 bg-cyan-950/20 shadow-md'
                  : 'border-slate-800 bg-slate-950/70 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                <span className="font-bold text-cyan-300">{inc.incident_id}</span>
                <StatusBadge status={inc.status} size="sm" />
              </div>
              <h3 className="text-xs font-bold text-white line-clamp-2">{inc.title}</h3>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                <span className="text-slate-300 font-bold uppercase">{inc.severity} Severity</span>
                <span>{inc.evidence_count} Evidence Items</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Incident Details and Timeline (2 cols) */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 shadow-xl space-y-5 font-mono">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-cyan-400">{selectedIncident.incident_id}</span>
                    <StatusBadge status={selectedIncident.severity} />
                    <StatusBadge status={selectedIncident.status} />
                  </div>
                  <h2 className="text-base font-bold text-white font-sans">{selectedIncident.title}</h2>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Lead Investigator: {selectedIncident.assignee_name || 'Unassigned'}
                  </p>
                </div>

                {/* Workflow Status Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus('Contained')}
                    className="px-2.5 py-1 rounded border border-amber-800 bg-amber-950/40 text-amber-300 text-[10px] font-bold hover:bg-amber-900"
                  >
                    Contain
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Resolved')}
                    className="px-2.5 py-1 rounded border border-emerald-800 bg-emerald-950/40 text-emerald-300 text-[10px] font-bold hover:bg-emerald-900"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Closed')}
                    className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 text-slate-300 text-[10px] font-bold hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Case Summary */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
                <span className="font-mono text-[10px] text-slate-400 block uppercase mb-1">
                  CASE BRIEF & SCOPE:
                </span>
                {selectedIncident.description || 'No description recorded.'}
              </div>

              {/* Root Cause & Resolution Notes */}
              {selectedIncident.root_cause && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
                  <span className="font-mono text-[10px] text-amber-400 block uppercase mb-1">
                    ROOT CAUSE IDENTIFICATION:
                  </span>
                  {selectedIncident.root_cause}
                </div>
              )}

              {/* Evidence Binder */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  Correlated Digital Evidence Binder ({selectedIncident.evidence?.length || 0})
                </h3>
                <div className="space-y-2">
                  {(selectedIncident.evidence || []).map((ev: any) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-200">{ev.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Type: {ev.evidence_type} • Recorded: {new Date(ev.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select an incident to view investigation timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
