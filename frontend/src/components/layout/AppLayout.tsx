import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AICopilotDrawer } from '../ai/AICopilotDrawer';
import { ToolStatusModal } from '../integrations/ToolStatusModal';
import { useWebSocket } from '../../context/WebSocketContext';
import { AlertTriangle, X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const { activeToasts, dismissToast } = useWebSocket();

  return (
    <div className="flex h-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar alertCount={3} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenToolStatus={() => setIsToolModalOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#07090e]">
          <Outlet />
        </main>
      </div>

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Tool Integration Status Modal */}
      <ToolStatusModal
        isOpen={isToolModalOpen}
        onClose={() => setIsToolModalOpen(false)}
      />

      {/* Real-time Alert Toasts */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
        {activeToasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-red-500/50 bg-slate-950/90 text-white backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-300"
          >
            <div className="p-1.5 rounded-lg bg-red-950 border border-red-800 text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-red-400 font-mono uppercase">
                  {toast.category}
                </span>
                <span className="text-[10px] text-slate-400">{toast.time}</span>
              </div>
              <p className="text-xs text-slate-200 font-medium truncate mt-0.5">{toast.title}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
