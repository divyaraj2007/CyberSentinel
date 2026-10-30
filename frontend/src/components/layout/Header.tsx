import React from 'react';
import { Bot, Cpu, LogOut, Radio, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';

interface HeaderProps {
  onOpenCopilot: () => void;
  onOpenToolStatus: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCopilot, onOpenToolStatus }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left Telemetry Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/60 text-xs font-mono">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`}
          />
          <span className="text-slate-300">
            {isConnected ? 'TELEMETRY BUS: LIVE' : 'CONNECTING...'}
          </span>
        </div>

        <button
          onClick={onOpenToolStatus}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-800/60 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-950/60 text-xs font-mono transition-colors"
        >
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>INTEGRATIONS: 12/12</span>
        </button>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        {/* AI Security Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 text-cyan-300 hover:border-cyan-400 text-xs font-medium transition-all shadow-sm shadow-cyan-950"
        >
          <Bot className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span>AI Security Copilot</span>
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="text-right">
              <p className="text-xs font-semibold text-white">{user.full_name || user.username}</p>
              <p className="text-[10px] text-cyan-400 font-mono">{user.role}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="h-4 w-4" />
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors ml-1"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
