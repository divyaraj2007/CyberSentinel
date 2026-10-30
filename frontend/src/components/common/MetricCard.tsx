import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: 'cyan' | 'red' | 'blue' | 'emerald' | 'amber';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50',
    red: 'text-red-400 bg-red-950/40 border-red-800/50',
    blue: 'text-blue-400 bg-blue-950/40 border-blue-800/50',
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
    amber: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md transition-all hover:border-slate-700/80">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 font-mono">{title}</p>
        <div className={`rounded-lg border p-2 ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trendPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
