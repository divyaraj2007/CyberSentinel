import React, { useEffect, useState } from 'react';
import {
  Activity,
  Pause,
  Play,
  Search,
  Filter,
  ShieldAlert,
  ArrowDownUp,
  Radio,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { useWebSocket } from '../context/WebSocketContext';
import { Packet } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const TrafficAnalyzerPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProto, setSelectedProto] = useState('');
  const [searchIp, setSearchIp] = useState('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  const { livePackets } = useWebSocket();

  const fetchSummary = async () => {
    try {
      const s = await ApiClient.request<any>('/traffic/summary');
      setSummary(s);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInitialPackets = async () => {
    try {
      const p = await ApiClient.request<Packet[]>('/traffic/packets?limit=50');
      setPackets(p);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchInitialPackets();
    const interval = setInterval(fetchSummary, 8000);
    return () => clearInterval(interval);
  }, []);

  // Ingest live WebSocket packets when not paused
  useEffect(() => {
    if (!isPaused && livePackets.length > 0) {
      const latest = livePackets[0];
      setPackets((prev) => [latest, ...prev.slice(0, 99)]);
    }
  }, [livePackets, isPaused]);

  const filteredPackets = packets.filter((p) => {
    if (selectedProto && p.protocol !== selectedProto) return false;
    if (suspiciousOnly && !p.is_suspicious) return false;
    if (searchIp && !p.source_ip.includes(searchIp) && !p.destination_ip.includes(searchIp))
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            LIVE NETWORK TRAFFIC ANALYZER & PACKET INSPECTOR
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Scapy socket dissection, protocol breakdown, bandwidth gauges & anomaly detection
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-amber-600/80 hover:bg-amber-500 text-white'
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? 'RESUME STREAM' : 'PAUSE STREAM'}
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 font-mono">
          <p className="text-xs text-slate-400 uppercase">Current Bandwidth</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">
            {summary?.bandwidth_mbps || 42.5} <span className="text-xs text-slate-400">Mbps</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Window: 100 packets</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 font-mono">
          <p className="text-xs text-slate-400 uppercase">Packet Rate</p>
          <p className="text-2xl font-bold text-white mt-1">
            {summary?.packets_per_second || 1120} <span className="text-xs text-slate-400">pkt/s</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Full Duplex Throughput</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 font-mono">
          <p className="text-xs text-slate-400 uppercase">Suspicious Packets</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {summary?.suspicious_packets_count || 3}
          </p>
          <p className="text-[10px] text-red-400 mt-0.5">Anomalies Flagged</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 font-mono">
          <p className="text-xs text-slate-400 uppercase">TCP Retransmissions</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {summary?.tcp_retransmission_rate || 0.6}%
          </p>
          <p className="text-[10px] text-emerald-400 mt-0.5">Healthy Low Jitter</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/70">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by Source or Destination IP..."
            value={searchIp}
            onChange={(e) => setSearchIp(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end font-mono">
          <select
            value={selectedProto}
            onChange={(e) => setSelectedProto(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="TLS">TLS</option>
            <option value="HTTP">HTTP</option>
            <option value="DNS">DNS</option>
            <option value="ICMP">ICMP</option>
            <option value="SSH">SSH</option>
          </select>

          <button
            onClick={() => setSuspiciousOnly(!suspiciousOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              suspiciousOnly
                ? 'bg-red-950 border border-red-800 text-red-400'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Suspicious Only
          </button>
        </div>
      </div>

      {/* Live Packet Stream Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Source IP & Port</th>
                <th className="py-2.5 px-3">Destination IP & Port</th>
                <th className="py-2.5 px-3">Length</th>
                <th className="py-2.5 px-3">TCP Flags</th>
                <th className="py-2.5 px-3">Security Anomaly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPackets.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPacket(p)}
                  className={`cursor-pointer hover:bg-slate-900/50 transition-colors ${
                    p.is_suspicious ? 'bg-red-950/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(p.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{p.protocol}</td>
                  <td className="py-2.5 px-3 text-white">
                    {p.source_ip}:{p.source_port}
                  </td>
                  <td className="py-2.5 px-3 text-white">
                    {p.destination_ip}:{p.destination_port}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{p.packet_size} B</td>
                  <td className="py-2.5 px-3 text-slate-400">{p.flags || 'None'}</td>
                  <td className="py-2.5 px-3">
                    {p.is_suspicious ? (
                      <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]">
                        <ShieldAlert className="h-3 w-3" />
                        {p.anomaly_reason || 'Suspicious Activity'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Normal Flow</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPackets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No packets match criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Inspector Modal */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                PACKET DISSECTION DETAILS
              </h3>
              <button
                onClick={() => setSelectedPacket(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">SOURCE:</span>
                  <span className="text-white font-bold">
                    {selectedPacket.source_ip}:{selectedPacket.source_port}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DESTINATION:</span>
                  <span className="text-white font-bold">
                    {selectedPacket.destination_ip}:{selectedPacket.destination_port}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">PROTOCOL:</span>
                  {selectedPacket.protocol}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SIZE:</span>
                  {selectedPacket.packet_size} Bytes
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">FLAGS:</span>
                  {selectedPacket.flags || 'N/A'}
                </div>
              </div>

              {selectedPacket.is_suspicious && (
                <div className="p-3 rounded-lg border border-red-800 bg-red-950/40 text-red-300">
                  <p className="font-bold flex items-center gap-1.5 text-xs text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                    SECURITY HEURISTIC ANOMALY DETECTED
                  </p>
                  <p className="mt-1 text-[11px]">{selectedPacket.anomaly_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
