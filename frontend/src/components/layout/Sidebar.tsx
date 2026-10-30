import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Radio,
  Activity,
  ShieldAlert,
  Bug,
  Globe2,
  Server,
  GitFork,
  AlertTriangle,
  FolderLock,
  Binary,
  Zap,
  HeartPulse,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  alertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ alertCount = 3 }) => {
  const navItems = [
    { label: 'SOC Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Network Discovery', path: '/discovery', icon: Network },
    { label: 'Port Scanner & Nmap', path: '/scanner', icon: Radio },
    { label: 'Traffic Analyzer', path: '/traffic', icon: Activity },
    { label: 'Intrusion Detection', path: '/ids', icon: ShieldAlert, badge: alertCount },
    { label: 'Vulnerabilities & CVE', path: '/vulnerabilities', icon: Bug },
    { label: 'Threat Intelligence', path: '/threat-intel', icon: Globe2 },
    { label: 'Cisco SNMP Monitor', path: '/cisco', icon: Server },
    { label: 'Network Topology', path: '/topology', icon: GitFork },
    { label: 'Security Alerts', path: '/alerts', icon: AlertTriangle, badge: alertCount },
    { label: 'Incident Management', path: '/incidents', icon: FolderLock },
    { label: 'Digital Forensics', path: '/forensics', icon: Binary },
    { label: 'Automated Response', path: '/response', icon: Zap },
    { label: 'Network Health Center', path: '/health', icon: HeartPulse },
    { label: 'Security Reports', path: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
            CYBERSENTINEL
          </h1>
          <p className="text-[10px] text-cyan-400/90 font-mono tracking-wider uppercase">Enterprise SOC</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 font-mono mb-2">
          Operations
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Tagline footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>STATUS: DEFENDING</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </aside>
  );
};
