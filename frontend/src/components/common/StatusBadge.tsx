import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toLowerCase();
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'critical' || s === 'failed') {
    colorClasses = 'bg-red-950/80 text-red-400 border-red-800/80';
  } else if (s === 'high' || s === 'warning' || s === 'pending approval') {
    colorClasses = 'bg-orange-950/80 text-orange-400 border-orange-800/80';
  } else if (s === 'medium' || s === 'investigating') {
    colorClasses = 'bg-yellow-950/80 text-yellow-400 border-yellow-800/80';
  } else if (s === 'low' || s === 'acknowledged' || s === 'running') {
    colorClasses = 'bg-blue-950/80 text-blue-400 border-blue-800/80';
  } else if (s === 'info' || s === 'informational' || s === 'new') {
    colorClasses = 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80';
  } else if (s === 'online' || s === 'up' || s === 'completed' || s === 'resolved' || s === 'remediated' || s === 'approved' || s === 'active') {
    colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
  } else if (s === 'offline' || s === 'down' || s === 'closed' || s === 'rejected') {
    colorClasses = 'bg-slate-900 text-slate-400 border-slate-800';
  }

  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClass} ${colorClasses} tracking-wide uppercase font-mono`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colorClasses.replace('bg-', 'bg-current ')}`} />
      {status}
    </span>
  );
};
