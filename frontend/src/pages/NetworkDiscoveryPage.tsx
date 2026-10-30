import React, { useEffect, useState } from 'react';
import {
  Network,
  Search,
  Filter,
  Play,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
  Shield,
  Laptop,
  Cpu,
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { Device, Network as NetworkType } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const NetworkDiscoveryPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [networks, setNetworks] = useState<NetworkType[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedCidr, setSelectedCidr] = useState('192.168.1.0/24');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [devData, netData] = await Promise.all([
        ApiClient.request<Device[]>('/devices'),
        ApiClient.request<NetworkType[]>('/networks'),
      ]);
      setDevices(devData);
      setNetworks(netData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    try {
      await ApiClient.request(`/devices/discover?cidr=${encodeURIComponent(selectedCidr)}`, {
        method: 'POST',
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleToggleAuthorization = async (device: Device) => {
    try {
      await ApiClient.request(`/devices/${device.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_authorized: !device.is_authorized }),
      });
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, is_authorized: !d.is_authorized } : d))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      !search ||
      d.ip_address.includes(search) ||
      (d.hostname && d.hostname.toLowerCase().includes(search.toLowerCase())) ||
      (d.manufacturer && d.manufacturer.toLowerCase().includes(search.toLowerCase())) ||
      (d.mac_address && d.mac_address.toLowerCase().includes(search.toLowerCase()));

    const matchesType = !selectedType || d.device_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Network className="h-5 w-5 text-cyan-400" />
            AUTOMATIC NETWORK DISCOVERY & DEVICE INVENTORY
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            CIDR ARP/ICMP subnet sweeping, MAC OUI vendor resolution, OS fingerprinting & rogue device detection
          </p>
        </div>

        {/* Discovery Action Toolbar */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCidr}
            onChange={(e) => setSelectedCidr(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
          >
            {networks.map((n) => (
              <option key={n.id} value={n.cidr}>
                {n.cidr} ({n.name})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunDiscovery}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md shadow-cyan-950"
          >
            <Play className={`h-3.5 w-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
            {isDiscovering ? 'SWEEPING SUBNET...' : 'RUN DISCOVERY'}
          </button>
        </div>
      </div>

      {/* Authorized Subnets Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {networks.map((net) => (
          <div
            key={net.id}
            className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-white font-mono">{net.name}</p>
              <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                CIDR: {net.cidr} • VLAN: {net.vlan_id || 'Default'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">
              {net.device_count || 0} Assets
            </span>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/70">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by IP, hostname, MAC address, manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Device Types</option>
            <option value="Router">Router</option>
            <option value="Switch">Switch</option>
            <option value="Server">Server</option>
            <option value="Endpoint">Endpoint</option>
            <option value="IoT">IoT</option>
          </select>
        </div>
      </div>

      {/* Devices Inventory Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Hostname</th>
                <th className="py-3 px-4">MAC & Vendor (OUI)</th>
                <th className="py-3 px-4">Device Type</th>
                <th className="py-3 px-4">Operating System</th>
                <th className="py-3 px-4">Authorization</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredDevices.map((d) => (
                <tr
                  key={d.id}
                  className={`hover:bg-slate-900/40 transition-colors ${
                    !d.is_authorized ? 'bg-red-950/15' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <StatusBadge status={d.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                    {d.ip_address}
                    {!d.is_authorized && (
                      <span className="text-[10px] text-red-400 bg-red-950/80 border border-red-800 px-1.5 py-0.2 rounded">
                        ROGUE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-cyan-300">{d.hostname || 'Unresolved'}</td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200">{d.mac_address || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400">{d.manufacturer || 'Generic Device'}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{d.device_type}</td>
                  <td className="py-3 px-4 text-slate-300">{d.os_name || 'Fingerprint pending'}</td>
                  <td className="py-3 px-4">
                    {d.is_authorized ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Authorized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Unauthorized
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleAuthorization(d)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                        d.is_authorized
                          ? 'border border-red-800/80 bg-red-950/40 text-red-300 hover:bg-red-900/60'
                          : 'border border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                      }`}
                    >
                      {d.is_authorized ? 'Flag Rogue' : 'Authorize Asset'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No devices match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
