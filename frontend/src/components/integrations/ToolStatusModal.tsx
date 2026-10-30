import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Layers } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { ToolIntegrationStatus } from '../../types';

interface ToolStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToolStatusModal: React.FC<ToolStatusModalProps> = ({ isOpen, onClose }) => {
  const [tools, setTools] = useState<ToolIntegrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.request<ToolIntegrationStatus[]>('/integrations/status');
      setTools(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTools();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Cybersecurity Tool Integrations Registry
              </h2>
              <p className="text-xs text-slate-400">
                Live sensor status, binary detection & fallback telemetry modes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTools}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
              title="Refresh status"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tools.map((t, idx) => {
              const isActive = t.status === 'Active' || t.status.includes('Active');
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-white font-mono">{t.name}</h3>
                        <p className="text-[11px] text-cyan-400/80 font-mono mt-0.5">{t.category}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isActive
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        }`}
                      >
                        {isActive ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {t.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">{t.description}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span className="truncate max-w-[200px]">Path: {t.path}</span>
                    <span className="text-slate-400 font-semibold">{t.version || 'Ready'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>COMPLIANCE: Section 23 Integration Standards</span>
          <span className="text-emerald-400">Deterministic Fallbacks Active where Required</span>
        </div>
      </div>
    </div>
  );
};
