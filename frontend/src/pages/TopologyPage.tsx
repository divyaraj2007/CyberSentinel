import React, { useEffect, useState } from 'react';
import {
  GitFork,
  Server,
  ShieldAlert,
  Radio,
  CheckCircle2,
  Info,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';

export const TopologyPage: React.FC = () => {
  const [topology, setTopology] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTopology = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.request<any>('/topology');
      setTopology(data);
      if (data.nodes && data.nodes.length > 0 && !selectedNode) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
  }, []);

  const nodes = topology?.nodes || [];
  const links = topology?.links || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <GitFork className="h-5 w-5 text-cyan-400" />
            ENTERPRISE NETWORK TOPOLOGY MAP
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logical segment visualization, core router interconnects, VLAN groupings & suspicious node highlighting
          </p>
        </div>

        <button
          onClick={fetchTopology}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 font-mono transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          REDISCOVER MAP
        </button>
      </div>

      {/* Main Map & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive SVG Diagram (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl relative min-h-[500px] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Core / Subnet</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 ml-2" />
              <span>Authorized Device</span>
              <span className="h-2 w-2 rounded-full bg-red-400 ml-2" />
              <span>Suspicious Rogue Node</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {topology?.metadata?.inference_mode || 'Logical Layer-2 Associations'}
            </span>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="flex-1 my-6 relative flex items-center justify-center">
            <svg className="w-full h-[400px]" viewBox="0 0 800 400">
              {/* Connecting Links */}
              {/* Core to Subnet 1 */}
              <line x1="400" y1="60" x2="180" y2="160" stroke="#1e293b" strokeWidth="2" strokeDasharray="4" />
              {/* Core to Subnet 2 */}
              <line x1="400" y1="60" x2="400" y2="160" stroke="#1e293b" strokeWidth="2" strokeDasharray="4" />
              {/* Core to Subnet 3 */}
              <line x1="400" y1="60" x2="620" y2="160" stroke="#1e293b" strokeWidth="2" strokeDasharray="4" />

              {/* Subnet 1 to Devices */}
              <line x1="180" y1="160" x2="80" y2="280" stroke="#334155" strokeWidth="1.5" />
              <line x1="180" y1="160" x2="180" y2="280" stroke="#334155" strokeWidth="1.5" />
              <line x1="180" y1="160" x2="280" y2="280" stroke="#ef4444" strokeWidth="2" /> {/* Rogue device connection */}

              {/* Subnet 2 to Servers */}
              <line x1="400" y1="160" x2="360" y2="280" stroke="#334155" strokeWidth="1.5" />
              <line x1="400" y1="160" x2="440" y2="280" stroke="#334155" strokeWidth="1.5" />

              {/* Subnet 3 to Devices */}
              <line x1="620" y1="160" x2="580" y2="280" stroke="#334155" strokeWidth="1.5" />
              <line x1="620" y1="160" x2="660" y2="280" stroke="#334155" strokeWidth="1.5" />

              {/* Interactive Nodes */}
              {/* Core Node */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes[0])}
              >
                <circle cx="400" cy="60" r="28" fill="#0c4a6e" stroke="#0284c7" strokeWidth="3" />
                <text x="400" y="65" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  CORE GW
                </text>
                <text x="400" y="105" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  192.168.1.1
                </text>
              </g>

              {/* Subnet 1: Corp LAN */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes[1] || nodes[0])}
              >
                <rect x="130" y="140" width="100" height="40" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="180" y="165" textAnchor="middle" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  VLAN 10 (LAN)
                </text>
              </g>

              {/* Subnet 2: DMZ */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes[2] || nodes[0])}
              >
                <rect x="350" y="140" width="100" height="40" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="400" y="165" textAnchor="middle" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  VLAN 20 (DMZ)
                </text>
              </g>

              {/* Subnet 3: WiFi */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes[3] || nodes[0])}
              >
                <rect x="570" y="140" width="100" height="40" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="620" y="165" textAnchor="middle" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  VLAN 30 (WIFI)
                </text>
              </g>

              {/* Device: Web Server */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes.find((n: any) => n.ip === '192.168.1.10'))}
              >
                <circle cx="80" cy="280" r="18" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                <text x="80" y="284" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontFamily="monospace">
                  WEB
                </text>
                <text x="80" y="312" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  .10
                </text>
              </g>

              {/* Device: Active Directory */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes.find((n: any) => n.ip === '192.168.1.20'))}
              >
                <circle cx="180" cy="280" r="18" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                <text x="180" y="284" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontFamily="monospace">
                  DC01
                </text>
                <text x="180" y="312" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  .20
                </text>
              </g>

              {/* Device: Rogue Raspberry Pi Attacker (RED GLOW) */}
              <g
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedNode(nodes.find((n: any) => n.is_suspicious))}
              >
                <circle cx="280" cy="280" r="22" fill="#7f1d1d" stroke="#ef4444" strokeWidth="3" filter="drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))" />
                <text x="280" y="284" textAnchor="middle" fill="#fecaca" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  ROGUE!
                </text>
                <text x="280" y="316" textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  192.168.1.105
                </text>
              </g>

              {/* DMZ Servers */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes.find((n: any) => n.ip === '192.168.1.25'))}
              >
                <circle cx="360" cy="280" r="18" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                <text x="360" y="284" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontFamily="monospace">
                  DB
                </text>
                <text x="360" y="312" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  .25
                </text>
              </g>

              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes.find((n: any) => n.ip === '192.168.1.50'))}
              >
                <circle cx="440" cy="280" r="18" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                <text x="440" y="284" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontFamily="monospace">
                  IOT
                </text>
                <text x="440" y="312" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  .50
                </text>
              </g>

              {/* Workstations */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes[nodes.length - 1] || nodes[0])}
              >
                <circle cx="580" cy="280" r="18" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                <text x="580" y="284" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                  WS-1
                </text>
              </g>

              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNode(nodes[nodes.length - 2] || nodes[0])}
              >
                <circle cx="660" cy="280" r="18" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                <text x="660" y="284" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                  WS-2
                </text>
              </g>
            </svg>
          </div>

          <div className="text-[11px] text-slate-400 font-mono text-center border-t border-slate-800/80 pt-3">
            Click on any topology node to inspect telemetry, switchport binding & security status
          </div>
        </div>

        {/* Selected Node Inspector Sidebar (1 col) */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-xl flex flex-col justify-between font-mono">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase text-slate-400">Node Inspector</span>
                <h2 className="text-sm font-bold text-white mt-0.5 truncate">{selectedNode.name}</h2>
                <p className="text-xs text-cyan-400 font-bold mt-1">{selectedNode.ip}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">DEVICE TYPE:</span>
                  <span className="text-white font-bold">{selectedNode.type}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">VLAN GROUPING:</span>
                  <span className="text-cyan-300 font-bold">{selectedNode.vlan || 'VLAN 10'}</span>
                </div>

                {selectedNode.mac && (
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">MAC ADDRESS:</span>
                    <span className="text-slate-300">{selectedNode.mac}</span>
                  </div>
                )}

                {selectedNode.os && (
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">OS PLATFORM:</span>
                    <span className="text-slate-300">{selectedNode.os}</span>
                  </div>
                )}

                {selectedNode.is_suspicious ? (
                  <div className="p-3 rounded-lg border border-red-800 bg-red-950/40 text-red-300 space-y-1">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4" />
                      FLAGGED SUSPICIOUS / ROGUE
                    </span>
                    <p className="text-[11px] font-sans">
                      Device has unverified MAC credentials and is generating aggressive SYN connection probes.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-emerald-800 bg-emerald-950/30 text-emerald-300">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      HEALTHY & AUTHORIZED
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a node to review configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
