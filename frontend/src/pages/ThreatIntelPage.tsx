import React, { useEffect, useState } from 'react';
import {
  Globe2,
  Search,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { ThreatIndicator } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const ThreatIntelPage: React.FC = () => {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([]);
  const [query, setQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<ThreatIndicator | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchIndicators = async () => {
    try {
      const data = await ApiClient.request<ThreatIndicator[]>('/threat-intel/indicators');
      setIndicators(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, []);

  const handleLookup = async (customQuery?: string) => {
    const q = (customQuery || query).trim();
    if (!q) return;

    setError('');
    setIsLoading(true);
    try {
      const res = await ApiClient.request<ThreatIndicator>('/threat-intel/lookup', {
        method: 'POST',
        body: JSON.stringify({ indicator: q }),
      });
      setLookupResult(res);
      await fetchIndicators();
    } catch (err: any) {
      setError(err.message || 'Lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-cyan-400" />
            MULTI-SOURCE THREAT INTELLIGENCE PLATFORM (OSINT)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            VirusTotal, AbuseIPDB & AlienVault OTX feeds for IP, Domain & Malware Hash reputation scoring
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-3 py-1.5 rounded-lg">
          <Database className="h-4 w-4" />
          <span>Feeds: VT v3 • AbuseIPDB v2 • AlienVault OTX</span>
        </div>
      </div>

      {/* Threat Search Box */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-xl space-y-3">
        <label className="block text-xs font-bold text-white font-mono uppercase">
          Indicator of Compromise (IOC) Query
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Enter IP address (e.g. 185.220.101.5), Domain (darknet-sync.cc), or File Hash..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={() => handleLookup()}
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md shadow-cyan-950 flex items-center gap-2"
          >
            {isLoading ? 'QUERYING FEEDS...' : 'LOOKUP IOC'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Sample IOCs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
          <span className="text-slate-500">Quick Test IOCs:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('185.220.101.5');
              handleLookup('185.220.101.5');
            }}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300"
          >
            185.220.101.5 (Tor/C2 IP)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('darknet-sync.cc');
              handleLookup('darknet-sync.cc');
            }}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300"
          >
            darknet-sync.cc (DGA Domain)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('44d88612fea8a8f36de82e1278abb02f');
              handleLookup('44d88612fea8a8f36de82e1278abb02f');
            }}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300"
          >
            WannaCry Hash (MD5)
          </button>
        </div>
      </div>

      {/* Lookup Result Box (if any) */}
      {lookupResult && (
        <div className="rounded-2xl border border-cyan-800/80 bg-slate-950/90 p-5 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-slate-400 uppercase">
                {lookupResult.indicator_type} INDICATOR REPORT
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">{lookupResult.indicator}</h2>
            </div>
            <StatusBadge status={lookupResult.severity} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">THREAT SCORE:</span>
              <span
                className={`text-2xl font-bold ${
                  lookupResult.threat_score >= 80
                    ? 'text-red-400'
                    : lookupResult.threat_score >= 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {lookupResult.threat_score} / 100
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DETECTION RATIO:</span>
              <span className="text-lg font-bold text-white">
                {lookupResult.malicious_count} / {lookupResult.total_engines} Engines
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PRIMARY SOURCE:</span>
              <span className="text-sm font-bold text-cyan-300">{lookupResult.source}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">VERDICT:</span>
              <span className="text-sm font-bold text-white uppercase">
                {lookupResult.severity === 'Clean' ? 'Benign / Clean' : 'Malicious Activity Confirmed'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1.5 uppercase">
              Raw Intelligence Metadata:
            </span>
            <pre className="p-4 rounded-xl bg-black/70 border border-slate-900 text-xs text-cyan-300 overflow-x-auto leading-relaxed">
              {JSON.stringify(lookupResult.details_json, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Historical Tracked Indicators Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            TRACKED THREAT INDICATORS (IOC VAULT)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Indicator</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Threat Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Detection Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {indicators.map((ind) => (
                <tr
                  key={ind.id}
                  onClick={() => setLookupResult(ind)}
                  className="cursor-pointer hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-cyan-300">{ind.indicator}</td>
                  <td className="py-3 px-4 uppercase text-slate-300">{ind.indicator_type}</td>
                  <td className="py-3 px-4 font-bold text-white">{ind.threat_score}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ind.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-400">{ind.source}</td>
                  <td className="py-3 px-4 text-right text-slate-300 font-bold">
                    {ind.malicious_count}/{ind.total_engines}
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
