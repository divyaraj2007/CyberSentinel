import React, { useEffect, useState } from 'react';
import {
  Zap,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Terminal,
  Lock,
  Plus,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { ResponseAction } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const ResponseAutomationPage: React.FC = () => {
  const [actions, setActions] = useState<ResponseAction[]>([]);
  const [isStaging, setIsStaging] = useState(false);
  const [actionType, setActionType] = useState('Firewall Block IP');
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.request<ResponseAction[]>('/response/actions');
      setActions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleDecision = async (actionId: number, decision: 'approve' | 'reject' | 'rollback') => {
    try {
      await ApiClient.request('/response/decision', {
        method: 'POST',
        body: JSON.stringify({ action_id: actionId, decision }),
      });
      await fetchActions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStageAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !reason) return;

    try {
      await ApiClient.request(
        `/response/stage?action_type=${encodeURIComponent(actionType)}&target=${encodeURIComponent(
          target
        )}&reason=${encodeURIComponent(reason)}`,
        { method: 'POST' }
      );
      setIsStaging(false);
      setTarget('');
      setReason('');
      await fetchActions();
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
            <Zap className="h-5 w-5 text-amber-400" />
            AUTOMATED SECURITY RESPONSE & CONTAINMENT ENGINE
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Firewall block execution, switchport VLAN isolation & administrator dual-authorization workflows
          </p>
        </div>

        <button
          onClick={() => setIsStaging(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-950"
        >
          <Plus className="h-4 w-4" />
          STAGE CONTAINMENT ACTION
        </button>
      </div>

      {/* Security Safety Banner */}
      <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 text-amber-200 text-xs font-mono flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <span>
            POLICY COMPLIANCE: Potentially disruptive actions require explicit administrator approval before execution.
          </span>
        </div>
        <span className="text-[11px] text-amber-400 font-bold uppercase">ROLLBACK READY</span>
      </div>

      {/* Stage Modal */}
      {isStaging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h2 className="text-sm font-bold text-white font-mono mb-4 uppercase">
              Stage Defensive Containment Action
            </h2>
            <form onSubmit={handleStageAction} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">CONTAINMENT ACTION TYPE</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="Firewall Block IP">Firewall Block IP (iptables / firewalld)</option>
                  <option value="Isolate Device">Isolate Device (Switchport Shutdown)</option>
                  <option value="Rate Limit">Rate Limit (QoS Traffic Policing)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">TARGET ASSET / IP</label>
                <input
                  type="text"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. 185.220.101.5 or 192.168.1.105 (Gig1/0/4)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SECURITY JUSTIFICATION</label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for staging containment..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStaging(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Actions Queue Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Security Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Rollback Command</th>
                <th className="py-3 px-4 text-right">Admin Authorization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {actions.map((act) => (
                <tr key={act.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    {act.action_type}
                  </td>
                  <td className="py-3 px-4 text-cyan-300 font-bold">{act.target}</td>
                  <td className="py-3 px-4 font-sans text-slate-300 max-w-xs">{act.reason}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={act.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]">
                    {act.rollback_command || 'None'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {act.status === 'Pending Approval' && (
                        <>
                          <button
                            onClick={() => handleDecision(act.id, 'approve')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(act.id, 'reject')}
                            className="px-2.5 py-1 rounded bg-red-950 border border-red-800 hover:bg-red-900 text-red-300 text-[10px]"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      {act.status === 'Executed' && (
                        <button
                          onClick={() => handleDecision(act.id, 'rollback')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Rollback
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
