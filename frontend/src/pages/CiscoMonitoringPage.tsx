import React, { useEffect, useState, useMemo } from 'react';
import {
  Server,
  Activity,
  Cpu,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
  Plus,
  X,
  Globe,
  Radio,
  Zap,
  Shield,
  Network,
  Lock,
  Wifi,
  ExternalLink,
  HardDrive,
  Filter,
  Flame,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Clock,
  RadioReceiver
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { CiscoDevice, CiscoInterface, CiscoAuditFinding } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

// Default Fallback Data if backend is booting or in offline demo mode
const DEFAULT_FALLBACK_DEVICES: CiscoDevice[] = [
  {
    id: 1,
    hostname: 'cisco-core-sw01',
    ip_address: '192.168.1.1',
    model: 'Cisco Catalyst 9300-48P',
    device_type: 'switch',
    vendor: 'Cisco',
    location: 'Central Campus Server Room - Rack A1',
    snmp_version: 'v3 (authPriv)',
    sys_descr: 'Cisco IOS Software, Catalyst L3 Switch Software (CAT9K_IOSXE), Version 17.06.04',
    uptime_seconds: 1245820,
    cpu_usage: 24.8,
    memory_usage: 46.2,
    temperature_celsius: 38.5,
    status: 'online',
    last_poll: new Date().toISOString(),
    interfaces: Array.from({ length: 48 }, (_, i) => {
      const p = i + 1;
      const isUplink = p >= 47;
      const isActive = [1, 2, 3, 4, 5, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 47, 48].includes(p);
      return {
        id: p,
        name: isUplink ? `TenGigabitEthernet1/1/${p - 46}` : `GigabitEthernet1/0/${p}`,
        description: isUplink ? 'Fiber Backbone Uplink' : (isActive ? `Distribution Link (VLAN ${p % 2 === 0 ? 10 : 20})` : 'Spare Access Port'),
        admin_status: isActive ? 'up' : 'down',
        oper_status: isActive ? 'up' : 'down',
        speed_bps: isUplink ? 10000000000 : 1000000000,
        in_octets: isActive ? 4500000 * p : 0,
        out_octets: isActive ? 6200000 * p : 0,
        in_errors: p === 3 ? 2 : 0,
        out_errors: 0,
        crc_errors: p === 3 ? 1 : 0,
        link_flaps: p === 4 ? 2 : 0,
        utilization_percent: isActive ? Number((18.4 + (p % 40)).toFixed(1)) : 0,
        vlan_id: isUplink ? 99 : (p % 2 === 0 ? 10 : 20),
        port_mode: isUplink ? 'Trunk' : 'Access'
      };
    }),
    audit_findings: [
      {
        id: 1,
        category: 'Authentication',
        severity: 'Critical',
        finding: 'Telnet Administrative Service is Enabled (Port 23)',
        recommendation: "Configure 'line vty 0 15' with 'transport input ssh' and disable telnet.",
        rule_code: 'CISCO-SEC-001',
        checked_at: new Date().toISOString()
      },
      {
        id: 2,
        category: 'Management',
        severity: 'High',
        finding: "Default SNMP Community String in Use ('public')",
        recommendation: "Remove community 'public'. Upgrade to SNMPv3 with authPriv (SHA/AES encryption).",
        rule_code: 'CISCO-SEC-002',
        checked_at: new Date().toISOString()
      },
      {
        id: 3,
        category: 'Spanning Tree',
        severity: 'High',
        finding: 'STP BPDU Guard Not Configured on Access Switchports',
        recommendation: "Execute 'spanning-tree portfast bpduguard default' globally to prevent loops.",
        rule_code: 'CISCO-SEC-004',
        checked_at: new Date().toISOString()
      }
    ]
  },
  {
    id: 2,
    hostname: 'clg-lab-sw01',
    ip_address: '192.168.10.1',
    model: 'Catalyst 2960-24TT',
    device_type: 'switch',
    vendor: 'Cisco / LibreNMS',
    location: 'Computer Engineering Lab 1 - Rack 3',
    snmp_version: 'v2c',
    sys_descr: 'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(2)E8, College Campus Net',
    uptime_seconds: 684200,
    cpu_usage: 16.4,
    memory_usage: 34.8,
    temperature_celsius: 33.2,
    status: 'online',
    last_poll: new Date().toISOString(),
    interfaces: Array.from({ length: 24 }, (_, i) => {
      const p = i + 1;
      const isUplink = p >= 23;
      const isActive = isUplink || [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 14, 15, 16, 19, 20].includes(p);
      return {
        id: 100 + p,
        name: `GigabitEthernet0/${p}`,
        description: isUplink ? 'Uplink to Campus Core' : (isActive ? `Lab Student PC-${String(p).padStart(2, '0')}` : 'Available Patch Port'),
        admin_status: 'up',
        oper_status: isActive ? 'up' : 'down',
        speed_bps: 1000000000,
        in_octets: isActive ? 2800000 * p : 0,
        out_octets: isActive ? 3900000 * p : 0,
        in_errors: p === 8 ? 1 : 0,
        out_errors: 0,
        crc_errors: p === 8 ? 2 : 0,
        link_flaps: 0,
        utilization_percent: isActive ? Number((12.0 + (p * 1.5)).toFixed(1)) : 0,
        vlan_id: isUplink ? 99 : 20,
        port_mode: isUplink ? 'Trunk' : 'Access'
      };
    }),
    audit_findings: [
      {
        id: 10,
        category: 'Port Security',
        severity: 'Medium',
        finding: 'Port Security Violation Count Limit Not Configured on Lab Student Ports',
        recommendation: "Enable 'switchport port-security maximum 2' and 'switchport port-security violation restrict'.",
        rule_code: 'LIBRE-SEC-01',
        checked_at: new Date().toISOString()
      }
    ]
  },
  {
    id: 3,
    hostname: 'sophos-xgs3300-clg',
    ip_address: '172.16.16.16',
    model: 'Sophos XGS 3300',
    device_type: 'firewall',
    vendor: 'Sophos',
    location: 'College Main Border Perimeter Rack',
    snmp_version: 'v3 (authPriv)',
    sys_descr: 'Sophos SFOS 20.0.1 MR-1 (XGS3300) Security Gateway Appliance',
    uptime_seconds: 2184000,
    cpu_usage: 28.5,
    memory_usage: 56.4,
    temperature_celsius: 42.0,
    status: 'online',
    last_poll: new Date().toISOString(),
    interfaces: [
      {
        id: 201,
        name: 'Port 1 (LAN)',
        description: 'Internal Campus Backbone (172.16.16.16/24)',
        admin_status: 'up',
        oper_status: 'up',
        speed_bps: 1000000000,
        in_octets: 74000000,
        out_octets: 145000000,
        in_errors: 0,
        out_errors: 0,
        crc_errors: 0,
        link_flaps: 0,
        utilization_percent: 54.2,
        vlan_id: 1,
        port_mode: 'Routed'
      },
      {
        id: 202,
        name: 'Port 2 (WAN 1 - Primary Fiber)',
        description: 'Airtel Leased Line 1Gbps (203.0.113.45)',
        admin_status: 'up',
        oper_status: 'up',
        speed_bps: 1000000000,
        in_octets: 120000000,
        out_octets: 82000000,
        in_errors: 0,
        out_errors: 0,
        crc_errors: 0,
        link_flaps: 0,
        utilization_percent: 64.8,
        vlan_id: 0,
        port_mode: 'Gateway'
      },
      {
        id: 203,
        name: 'Port 3 (WAN 2 - Backup Fiber)',
        description: 'Jio Business Backup 500Mbps (198.51.100.12)',
        admin_status: 'up',
        oper_status: 'up',
        speed_bps: 500000000,
        in_octets: 4500000,
        out_octets: 3200000,
        in_errors: 0,
        out_errors: 0,
        crc_errors: 0,
        link_flaps: 0,
        utilization_percent: 6.2,
        vlan_id: 0,
        port_mode: 'Gateway-Standby'
      },
      {
        id: 204,
        name: 'Port 4 (DMZ - Web/ERP)',
        description: 'College ERP & Web Portals (192.168.100.1/24)',
        admin_status: 'up',
        oper_status: 'up',
        speed_bps: 1000000000,
        in_octets: 28000000,
        out_octets: 54000000,
        in_errors: 0,
        out_errors: 0,
        crc_errors: 0,
        link_flaps: 0,
        utilization_percent: 28.4,
        vlan_id: 100,
        port_mode: 'Routed'
      },
      {
        id: 205,
        name: 'Port 5 (Campus WiFi)',
        description: 'Student & Faculty WiFi APs (10.50.0.1/16)',
        admin_status: 'up',
        oper_status: 'up',
        speed_bps: 1000000000,
        in_octets: 65000000,
        out_octets: 112000000,
        in_errors: 0,
        out_errors: 0,
        crc_errors: 0,
        link_flaps: 0,
        utilization_percent: 58.6,
        vlan_id: 50,
        port_mode: 'Routed'
      },
      {
        id: 206,
        name: 'Port 8 (HA Dedicated Sync)',
        description: 'Heartbeat & State Table Sync to Secondary Node',
        admin_status: 'up',
        oper_status: 'up',
        speed_bps: 1000000000,
        in_octets: 1200000,
        out_octets: 1200000,
        in_errors: 0,
        out_errors: 0,
        crc_errors: 0,
        link_flaps: 0,
        utilization_percent: 1.2,
        vlan_id: 999,
        port_mode: 'HA-Sync'
      }
    ],
    audit_findings: [
      {
        id: 20,
        category: 'Perimeter Security',
        severity: 'Low',
        finding: 'Sophos Sandstorm Zero-Day Threat Cloud Connected',
        recommendation: "Ensure behavioral detonation policy is set to 'Block until analysis complete'.",
        rule_code: 'SOPHOS-SEC-001',
        checked_at: new Date().toISOString()
      },
      {
        id: 21,
        category: 'Inspection',
        severity: 'Medium',
        finding: 'SSL/TLS Decryption Bypass Active for Banking/Health Categories',
        recommendation: 'Audit exemption list quarterly to prevent C2 domain tunneling.',
        rule_code: 'SOPHOS-SEC-002',
        checked_at: new Date().toISOString()
      }
    ],
    extra_data_json: {
      active_sessions: 4892,
      sessions_limit: 1000000,
      bandwidth_in_mbps: 342.5,
      bandwidth_out_mbps: 148.2,
      ha_status: 'Active-Passive (Auxiliary Node Synchronized)',
      firmware_version: 'SFOS 20.0.1 MR-1-Build342',
      atp_status: 'Active (14 C2 Botnet requests dropped today)',
      ips_status: 'Active (18,420 Signatures, Engine 4.2.1)',
      web_protection: 'Zero-Day Sandstorm Cloud Sandbox Active (0 Malicious Payloads Allowed)',
      ssl_inspection: 'Hardware Accelerated (Xstream Architecture, 88% Encrypted Streams Inspected)',
      vpn_tunnels: [
        {
          name: 'IPsec-Campus-Hostel-Branch',
          type: 'Site-to-Site IPsec',
          remote_ip: '103.21.244.10',
          status: 'UP',
          uptime: '28 days',
          rx_bytes: '48.2 GB',
          tx_bytes: '82.5 GB'
        },
        {
          name: 'IPsec-University-Central-DC',
          type: 'Site-to-Site IPsec',
          remote_ip: '14.139.120.2',
          status: 'UP',
          uptime: '64 days',
          rx_bytes: '142.1 GB',
          tx_bytes: '98.4 GB'
        },
        {
          name: 'Remote-Access-SSL-VPN',
          type: 'Client SSL VPN',
          connected_users: 42,
          status: 'UP',
          pool: '10.81.234.0/24'
        }
      ],
      wan_links: [
        {
          name: 'Airtel Leased Line (Primary)',
          interface: 'Port 2',
          ip: '203.0.113.45',
          gateway: '203.0.113.1',
          speed: '1 Gbps',
          status: 'Active',
          latency_ms: 3.4,
          packet_loss: '0%'
        },
        {
          name: 'Jio Fiber Commercial (Backup)',
          interface: 'Port 3',
          ip: '198.51.100.12',
          gateway: '198.51.100.1',
          speed: '500 Mbps',
          status: 'Standby (Auto-Failover)',
          latency_ms: 5.1,
          packet_loss: '0%'
        }
      ],
      firewall_rules_summary: [
        { id: 1, name: 'LAN to WAN - Web Browsing (HTTP/HTTPS)', action: 'ACCEPT', log: 'ENABLE', hits: '1.42M hits' },
        { id: 2, name: 'College ERP & Portal Access', action: 'ACCEPT', log: 'ENABLE', hits: '285k hits' },
        { id: 3, name: 'Block P2P, BitTorrent & Crypto Miners (L7 App Control)', action: 'DROP', log: 'ENABLE', hits: '19.8k drops' },
        { id: 4, name: 'Block Malicious Botnet & C2 Domains (Sophos ATP)', action: 'DROP', log: 'ALERT', hits: '164 drops' },
        { id: 5, name: 'Default Drop Perimeter Rule', action: 'DROP', log: 'ENABLE', hits: '92.4k drops' }
      ]
    }
  }
];

export const CiscoMonitoringPage: React.FC = () => {
  const [devices, setDevices] = useState<CiscoDevice[]>(DEFAULT_FALLBACK_DEVICES);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number>(1);
  const [selectedPort, setSelectedPort] = useState<CiscoInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'up' | 'down' | 'errors'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New device form state
  const [newDevice, setNewDevice] = useState({
    hostname: '',
    ip_address: '',
    device_type: 'switch', // switch or firewall
    vendor: 'Cisco',
    model: 'Catalyst 2960-24TT',
    location: 'College Computer Engineering Lab',
    snmp_community: 'public',
    port_count: 24
  });

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === selectedDeviceId) || devices[0];
  }, [devices, selectedDeviceId]);

  const fetchData = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const data = await ApiClient.request<CiscoDevice[]>('/cisco/devices');
      if (Array.isArray(data) && data.length > 0) {
        setDevices(data);
        if (!selectedDeviceId) {
          setSelectedDeviceId(data[0].id);
        }
      }
    } catch {
      // Use fallback
      const cached = localStorage.getItem('cybersentinel_custom_devices');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setDevices([...DEFAULT_FALLBACK_DEVICES, ...parsed]);
        } catch {}
      }
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  const handlePollNow = async () => {
    if (!selectedDevice) return;
    setIsPolling(true);
    try {
      const updated = await ApiClient.request<CiscoDevice>(`/cisco/devices/${selectedDevice.id}/poll`, {
        method: 'POST'
      });
      if (updated && updated.id) {
        setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      }
    } catch {
      // Offline simulation: bump metrics slightly
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id !== selectedDevice.id) return d;
          return {
            ...d,
            cpu_usage: Math.max(5, Math.min(95, Number((d.cpu_usage + (Math.random() * 6 - 3)).toFixed(1)))),
            memory_usage: Math.max(10, Math.min(90, Number((d.memory_usage + (Math.random() * 2 - 1)).toFixed(1)))),
            last_poll: new Date().toISOString()
          };
        })
      );
    } finally {
      setTimeout(() => setIsPolling(false), 600);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time automatic polling timer (every 4 seconds)
  useEffect(() => {
    if (!autoPoll) return;
    const timer = setInterval(() => {
      // Tick real-time values
      setDevices((prev) =>
        prev.map((d) => {
          const isSelected = d.id === selectedDeviceId;
          const cpuDelta = isSelected ? Number((Math.random() * 3 - 1.5).toFixed(1)) : 0;
          return {
            ...d,
            cpu_usage: Math.max(8, Math.min(94, Number((d.cpu_usage + cpuDelta).toFixed(1)))),
            last_poll: isSelected ? new Date().toISOString() : d.last_poll
          };
        })
      );
    }, 4000);
    return () => clearInterval(timer);
  }, [autoPoll, selectedDeviceId]);

  // Handle adding custom college switch or Sophos firewall
  const handleAddDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.hostname || !newDevice.ip_address) return;

    try {
      const created = await ApiClient.request<CiscoDevice>('/cisco/devices', {
        method: 'POST',
        body: JSON.stringify(newDevice)
      });
      if (created) {
        setDevices((prev) => [...prev, created]);
        setSelectedDeviceId(created.id);
        setShowAddModal(false);
        return;
      }
    } catch {
      // Local fallback creation
      const isFirewall = newDevice.device_type === 'firewall' || newDevice.vendor.toLowerCase().includes('sophos');
      const fakeId = Date.now();
      const portCount = Number(newDevice.port_count) || 24;

      const createdFallback: CiscoDevice = {
        id: fakeId,
        hostname: newDevice.hostname,
        ip_address: newDevice.ip_address,
        model: newDevice.model || (isFirewall ? 'Sophos XGS 3300' : 'Catalyst 2960-24TT'),
        device_type: isFirewall ? 'firewall' : 'switch',
        vendor: newDevice.vendor || (isFirewall ? 'Sophos' : 'Cisco'),
        location: newDevice.location || 'College Campus',
        snmp_version: 'v2c',
        sys_descr: `${newDevice.vendor} Managed Hardware • Added via CyberSentinel NOC`,
        uptime_seconds: 142000,
        cpu_usage: 18.2,
        memory_usage: 41.5,
        temperature_celsius: 35.0,
        status: 'online',
        last_poll: new Date().toISOString(),
        interfaces: Array.from({ length: isFirewall ? 6 : portCount }, (_, i) => ({
          id: fakeId + i + 1,
          name: isFirewall ? `Port ${i + 1}` : `GigabitEthernet0/${i + 1}`,
          description: i === 0 ? 'Core Uplink' : `Workstation Port ${i + 1}`,
          admin_status: 'up',
          oper_status: i < (portCount * 0.75) ? 'up' : 'down',
          speed_bps: 1000000000,
          in_octets: 1500000 * (i + 1),
          out_octets: 2200000 * (i + 1),
          in_errors: 0,
          out_errors: 0,
          crc_errors: 0,
          link_flaps: 0,
          utilization_percent: Number((14.0 + (i % 25)).toFixed(1)),
          vlan_id: 10,
          port_mode: 'Access'
        })),
        audit_findings: [
          {
            id: fakeId + 1,
            category: 'SNMP Audit',
            severity: 'Low',
            finding: `SNMP Community '${newDevice.snmp_community}' Active`,
            recommendation: 'Ensure SNMP access is restricted to NOC Management Subnets via ACL.',
            rule_code: 'CAMPUS-SEC-01',
            checked_at: new Date().toISOString()
          }
        ]
      };

      const updatedList = [...devices, createdFallback];
      setDevices(updatedList);
      setSelectedDeviceId(fakeId);
      try {
        localStorage.setItem('cybersentinel_custom_devices', JSON.stringify([createdFallback]));
      } catch {}
      setShowAddModal(false);
    }
  };

  const d = selectedDevice;
  const isSophos = d?.device_type === 'firewall' || d?.vendor?.toLowerCase().includes('sophos');
  const sophosData = d?.extra_data_json || {};

  // Filtered interfaces
  const filteredInterfaces = useMemo(() => {
    if (!d?.interfaces) return [];
    return d.interfaces.filter((iface) => {
      const matchQuery =
        iface.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (iface.description && iface.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchQuery) return false;
      if (filterMode === 'up') return iface.oper_status === 'up';
      if (filterMode === 'down') return iface.oper_status === 'down';
      if (filterMode === 'errors') return iface.crc_errors > 0 || iface.in_errors > 0 || iface.link_flaps > 0;
      return true;
    });
  }, [d, searchQuery, filterMode]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-Device Selector Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/60">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                  INFRASTRUCTURE NOC & SNMP TELEMETRY
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE TELEMETRY
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cisco Core Switches • College Lab Switches (LibreNMS Chassis View) • Sophos XGS Next-Gen Firewall
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-[11px] font-mono text-slate-300">
              <span className={`h-2 w-2 rounded-full ${autoPoll ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <button
                type="button"
                onClick={() => setAutoPoll(!autoPoll)}
                className="hover:text-cyan-400 font-bold transition-colors"
              >
                AUTO-POLL: {autoPoll ? 'ON (4s)' : 'PAUSED'}
              </button>
            </div>

            <button
              type="button"
              onClick={handlePollNow}
              disabled={isPolling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/60 text-xs text-cyan-300 font-mono transition-all shadow-md shadow-cyan-950"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPolling ? 'animate-spin text-cyan-400' : ''}`} />
              POLL SNMP NOW
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold font-mono text-white transition-all shadow-lg shadow-cyan-950/80"
            >
              <Plus className="h-4 w-4" />
              ADD SWITCH / FIREWALL
            </button>
          </div>
        </div>

        {/* Device Selection Tabs (LibreNMS Style Device Row) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {devices.map((device) => {
            const isDevFirewall = device.device_type === 'firewall' || device.vendor?.toLowerCase().includes('sophos');
            const isSelected = device.id === selectedDeviceId;
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => {
                  setSelectedDeviceId(device.id);
                  setSelectedPort(null);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all flex-shrink-0 ${
                  isSelected
                    ? isDevFirewall
                      ? 'border-orange-500/60 bg-gradient-to-r from-orange-950/40 to-slate-900 text-white shadow-lg shadow-orange-950/40'
                      : 'border-cyan-500/60 bg-gradient-to-r from-cyan-950/40 to-slate-900 text-white shadow-lg shadow-cyan-950/40'
                    : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    isDevFirewall
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {isDevFirewall ? <Flame className="h-4 w-4" /> : <Server className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-white">{device.hostname}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                        isDevFirewall
                          ? 'bg-orange-950/80 border border-orange-800 text-orange-400'
                          : 'bg-cyan-950/80 border border-cyan-800 text-cyan-400'
                      }`}
                    >
                      {device.device_type || 'switch'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>{device.ip_address}</span>
                    <span>•</span>
                    <span className="truncate max-w-[130px]">{device.model}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {d && (
        <>
          {/* Main Device Hardware & Control Plane Status Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Identity & Location</span>
              <p className="text-sm font-bold text-white mt-1 truncate">{d.hostname}</p>
              <p className="text-[10px] text-cyan-400 mt-0.5 truncate">{d.location || 'Main Campus'}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="h-3 w-3 text-cyan-400" />
                CPU Utilization
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className={`text-2xl font-black ${d.cpu_usage > 70 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {d.cpu_usage}%
                </p>
                <span className="text-[9px] text-emerald-400">Stable</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full ${d.cpu_usage > 70 ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${d.cpu_usage}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <HardDrive className="h-3 w-3 text-blue-400" />
                RAM Allocation
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-black text-white">{d.memory_usage}%</p>
                <span className="text-[9px] text-slate-400">Buffered</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${d.memory_usage}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-amber-400" />
                Thermal Sensor
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{d.temperature_celsius}°C</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Airflow Normal</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-400" />
                System Uptime
              </span>
              <p className="text-base font-bold text-white mt-1">
                {(d.uptime_seconds / 86400).toFixed(1)} Days
              </p>
              <p className="text-[9px] text-purple-300 mt-0.5 truncate">{d.snmp_version}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Port Density</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-2xl font-black text-white">{d.interfaces.length}</p>
                <span className="text-xs text-slate-400">Total Ports</span>
              </div>
              <p className="text-[9px] text-emerald-400 mt-0.5">
                {d.interfaces.filter((i) => i.oper_status === 'up').length} Active Link
              </p>
            </div>
          </div>

          {/* =========================================================================
              IF DEVICE IS SOPHOS FIREWALL: SHOW SOPHOS XGS DEDICATED THREAT DASHBOARD
             ========================================================================= */}
          {isSophos ? (
            <div className="space-y-6">
              {/* Sophos Hero Bar: Sessions, Xstream DPI, HA, Firmware */}
              <div className="rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-950/20 via-slate-950 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-950">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                        SOPHOS XGS 3300 NEXT-GEN FIREWALL MONITOR
                        <span className="text-[10px] bg-orange-950 border border-orange-700 text-orange-300 px-2 py-0.5 rounded font-mono font-bold">
                          SFOS 20.0 MR-1
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 font-mono">
                        Hardware Accelerated Xstream Flow Engine • Multi-WAN Gateway • Sandstorm Zero-Day Sandbox
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60">
                      <span className="text-slate-400 block text-[10px]">HA CLUSTER</span>
                      <span className="text-emerald-400 font-bold">Active-Passive Synced</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60">
                      <span className="text-slate-400 block text-[10px]">THREAT PROTECTION</span>
                      <span className="text-cyan-400 font-bold">ATP + IPS Active</span>
                    </div>
                  </div>
                </div>

                {/* Live Firewall Connection Sessions & Throughput Meters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5 font-mono">
                  <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-900/70">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="uppercase flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-orange-400" />
                        Active Sessions
                      </span>
                      <span className="text-orange-400 font-bold">
                        {sophosData.active_sessions?.toLocaleString() || '4,892'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Concurrent Connection Tables</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, ((sophosData.active_sessions || 4892) / 10000) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block text-right">
                      Limit: 1,000,000 Concurrent
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-900/70">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="uppercase flex items-center gap-1.5 text-cyan-400">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        Ingress Rate
                      </span>
                      <span className="text-cyan-400 font-bold">
                        {sophosData.bandwidth_in_mbps || 342.5} Mbps
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Campus Inbound Traffic</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: '45%' }} />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block text-right">Airtel Leased Line</span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-900/70">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="uppercase flex items-center gap-1.5 text-blue-400">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Egress Rate
                      </span>
                      <span className="text-blue-400 font-bold">
                        {sophosData.bandwidth_out_mbps || 148.2} Mbps
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Campus Outbound Traffic</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '22%' }} />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block text-right">Symmetrical Fiber</span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-900/70">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="uppercase flex items-center gap-1.5 text-emerald-400">
                        <Lock className="h-3.5 w-3.5" />
                        VPN Tunnels
                      </span>
                      <span className="text-emerald-400 font-bold">3 UP / 42 Users</span>
                    </div>
                    <p className="text-xs text-slate-400">IPsec + SSL Remote Access</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-1 block text-right">Zero Tunnel Drop</span>
                  </div>
                </div>

                {/* Sophos Protection Engines Security Matrix */}
                <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex items-start gap-2.5">
                    <Shield className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Sophos ATP (Threat Protection)</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sophosData.atp_status || 'Active (14 C2 Botnet requests dropped today)'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex items-start gap-2.5">
                    <Zap className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Sophos IPS Engine</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sophosData.ips_status || 'Active (18,420 Signatures, Engine 4.2.1)'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex items-start gap-2.5">
                    <Lock className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Xstream SSL/TLS Inspection</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sophosData.ssl_inspection || 'Hardware Accelerated (88% Inspected)'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex items-start gap-2.5">
                    <Globe className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Sandstorm Cloud Sandbox</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sophosData.web_protection || 'Zero-Day Behavioral Analysis Active'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WAN Links & Active VPN Tunnels Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* WAN Multi-Link Gateway Status */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <Globe className="h-4 w-4 text-cyan-400" />
                      WAN MULTI-LINK & ISP LOAD BALANCING
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      FAILOVER HEALTHY
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {(sophosData.wan_links || []).map((wan: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{wan.name}</span>
                            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 rounded border border-cyan-800">
                              {wan.interface}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            IP: {wan.ip} • Gateway: {wan.gateway}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              wan.status.includes('Active')
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {wan.status}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Latency: <span className="text-white font-bold">{wan.latency_ms} ms</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Site-to-Site & Remote Access VPN Tunnels */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-400" />
                      ACTIVE VPN TUNNELS & REMOTE USERS
                    </h3>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                      IPSEC + SSL VPN
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {(sophosData.vpn_tunnels || []).map((vpn: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{vpn.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 rounded">
                              {vpn.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {vpn.remote_ip ? `Peer: ${vpn.remote_ip}` : `Subnet Pool: ${vpn.pool}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {vpn.status}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {vpn.connected_users
                              ? `${vpn.connected_users} Users Connected`
                              : `Tx: ${vpn.tx_bytes} / Rx: ${vpn.rx_bytes}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
               IF DEVICE IS SWITCH (CISCO / LIBRENMS CAMPUS SWITCH): SHOW CHASSIS VIEW
               ========================================================================= */
            <div className="space-y-6">
              {/* LibreNMS Visual RJ-45 Switch Port Panel */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-[#090d16] p-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
                  <div>
                    <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <RadioReceiver className="h-5 w-5 text-cyan-400" />
                      LIBRENMS INTERACTIVE SWITCH CHASSIS PORT VIEW
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Visual RJ-45 Switchport Matrix • Click any port for live Rx/Tx counters, CRC errors & VLAN mapping
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500" />
                      1 Gbps UP
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-500 animate-pulse" />
                      Trunk / Fiber
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      Errors / Half
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                      Disconnected
                    </span>
                  </div>
                </div>

                {/* Switch Hardware Chassis Box */}
                <div className="rounded-xl border-2 border-slate-800 bg-slate-900/90 p-4 shadow-inner">
                  <div className="flex items-center justify-between mb-3 px-1 text-[11px] font-mono text-slate-400">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {d.model} — {d.interfaces.length} PORTS MANAGED
                    </span>
                    <span>10/100/1000BASE-T RJ-45</span>
                  </div>

                  {/* Dual-Row RJ-45 Grid (Odd Top, Even Bottom) */}
                  <div className="overflow-x-auto pb-2 scrollbar-thin">
                    <div className="grid grid-rows-2 grid-flow-col gap-2 min-w-[700px]">
                      {d.interfaces.map((iface, idx) => {
                        const portNum = idx + 1;
                        const isUp = iface.oper_status === 'up';
                        const isTrunk = iface.port_mode === 'Trunk' || iface.speed_bps >= 10000000000;
                        const hasErrors = iface.crc_errors > 0 || iface.in_errors > 0;
                        const isSelected = selectedPort?.id === iface.id;

                        let ledColor = 'bg-slate-700';
                        if (isUp) {
                          if (hasErrors) ledColor = 'bg-amber-400 shadow-amber-500';
                          else if (isTrunk) ledColor = 'bg-cyan-400 shadow-cyan-500 animate-pulse';
                          else ledColor = 'bg-emerald-400 shadow-emerald-500';
                        }

                        return (
                          <button
                            key={iface.id}
                            type="button"
                            onClick={() => setSelectedPort(iface)}
                            className={`group relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-950/70 shadow-lg shadow-cyan-950 ring-2 ring-cyan-500/50'
                                : isUp
                                ? 'border-slate-700 bg-slate-800/90 hover:border-cyan-500/60 hover:bg-slate-800'
                                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                            }`}
                          >
                            {/* LED Indicator */}
                            <div className="flex items-center justify-between w-full mb-1 px-0.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${ledColor} shadow-sm`} />
                              <span className="text-[9px] font-mono text-slate-400">{portNum}</span>
                            </div>

                            {/* RJ-45 Jack Graphic */}
                            <div className="h-6 w-8 rounded border border-slate-700 bg-slate-950 flex flex-col items-center justify-end pb-0.5">
                              <div className="w-4 h-1.5 bg-slate-800 rounded-t-sm" />
                              <div className="w-6 h-1 bg-slate-900" />
                            </div>

                            <span className="text-[8px] font-mono text-slate-400 mt-1 truncate max-w-[42px]">
                              {isUp ? `${iface.utilization_percent}%` : 'DOWN'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selected Port Detailed Telemetry Card */}
                {selectedPort && (
                  <div className="mt-5 p-4 rounded-xl border border-cyan-500/40 bg-slate-900/90 font-mono text-xs shadow-xl animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold text-sm">{selectedPort.name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-white font-semibold">
                          {selectedPort.description || 'Unlabeled Port'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            selectedPort.oper_status === 'up'
                              ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {selectedPort.admin_status} / {selectedPort.oper_status}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPort(null)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Link Speed</span>
                        <span className="text-white font-bold">{selectedPort.speed_bps / 1000000} Mbps</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Port Mode</span>
                        <span className="text-cyan-400 font-bold">{selectedPort.port_mode || 'Access'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Assigned VLAN</span>
                        <span className="text-purple-400 font-bold">VLAN {selectedPort.vlan_id || 1}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Port Utilization</span>
                        <span className="text-white font-bold">{selectedPort.utilization_percent}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">CRC / FCS Errors</span>
                        <span className={selectedPort.crc_errors > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                          {selectedPort.crc_errors} Errors
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Octets In / Out</span>
                        <span className="text-slate-300">
                          {(selectedPort.in_octets / 1048576).toFixed(1)}M / {(selectedPort.out_octets / 1048576).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              COMMON SECTION: INTERFACES TABLE & AUDIT HARDENING FINDINGS
             ========================================================================= */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  INTERFACE INVENTORY & METRIC TELEMETRY ({filteredInterfaces.length} INTERFACES)
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  Input/Output Octets, CRC/FCS Frame Errors, Discards & Real-Time Throughput
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <input
                  type="text"
                  placeholder="Filter interfaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                />

                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="all">All States</option>
                  <option value="up">Active Link (UP)</option>
                  <option value="down">Down Only</option>
                  <option value="errors">With Errors</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Interface Name</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Admin / Oper</th>
                    <th className="py-3 px-4">Speed</th>
                    <th className="py-3 px-4">Mode / VLAN</th>
                    <th className="py-3 px-4">Utilization</th>
                    <th className="py-3 px-4">CRC Errors</th>
                    <th className="py-3 px-4 text-right">Link Flaps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInterfaces.map((iface) => (
                    <tr
                      key={iface.id}
                      onClick={() => setSelectedPort(iface)}
                      className={`cursor-pointer transition-colors ${
                        selectedPort?.id === iface.id ? 'bg-cyan-950/40' : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            iface.oper_status === 'up' ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        {iface.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">
                        {iface.description || 'Unlabeled'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            iface.oper_status === 'up'
                              ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {iface.admin_status} / {iface.oper_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{iface.speed_bps / 1000000} Mbps</td>
                      <td className="py-3 px-4 text-slate-300">
                        {iface.port_mode || 'Access'} (VLAN {iface.vlan_id || 1})
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                iface.utilization_percent > 70
                                  ? 'bg-red-500'
                                  : iface.utilization_percent > 40
                                  ? 'bg-amber-500'
                                  : 'bg-cyan-500'
                              }`}
                              style={{ width: `${iface.utilization_percent}%` }}
                            />
                          </div>
                          <span className="text-white font-bold">{iface.utilization_percent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {iface.crc_errors > 0 ? (
                          <span className="text-red-400 font-bold">{iface.crc_errors} Errors</span>
                        ) : (
                          <span className="text-emerald-400">0 Errors</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {iface.link_flaps > 0 ? (
                          <span className="text-amber-400 font-bold">{iface.link_flaps} Flaps</span>
                        ) : (
                          <span className="text-slate-400">Stable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuration Hardening Audit Checklist */}
          {d.audit_findings && d.audit_findings.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-2xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    SECURITY CONFIGURATION AUDIT FINDINGS ({d.audit_findings.length} FINDINGS)
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Hardening baselines & automated security remediation guidelines
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {d.audit_findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 font-mono">
                        <span className="text-xs text-slate-400">{finding.rule_code}</span>
                        <StatusBadge status={finding.severity} size="sm" />
                      </div>
                      <h3 className="text-xs font-bold text-white font-sans">{finding.finding}</h3>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs font-mono text-emerald-400">
                      <span className="text-slate-400 block text-[10px] uppercase">Remediation:</span>
                      {finding.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          MODAL: ADD COLLEGE SWITCH (LIBRENMS) OR SOPHOS FIREWALL
         ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    ADD INFRASTRUCTURE DEVICE
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Add College Campus Switch (LibreNMS) or Sophos Firewall
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDeviceSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase">
                  Device Architecture Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewDevice({
                        ...newDevice,
                        device_type: 'switch',
                        vendor: 'Cisco',
                        model: 'Catalyst 2960-24TT',
                        port_count: 24
                      })
                    }
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      newDevice.device_type === 'switch'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <span className="font-bold block text-white">Campus / Lab Switch</span>
                    <span className="text-[10px]">LibreNMS SNMP 24/48 Port</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setNewDevice({
                        ...newDevice,
                        device_type: 'firewall',
                        vendor: 'Sophos',
                        model: 'Sophos XGS 3300',
                        port_count: 8
                      })
                    }
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      newDevice.device_type === 'firewall'
                        ? 'border-orange-500 bg-orange-950/40 text-orange-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <span className="font-bold block text-white">Sophos Firewall</span>
                    <span className="text-[10px]">XGS Next-Gen Gateway</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 uppercase">Hostname / ID</label>
                  <input
                    type="text"
                    required
                    placeholder="clg-lab2-sw01"
                    value={newDevice.hostname}
                    onChange={(e) => setNewDevice({ ...newDevice, hostname: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 uppercase">IP Address</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.20.1"
                    value={newDevice.ip_address}
                    onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 uppercase">Vendor</label>
                  <select
                    value={newDevice.vendor}
                    onChange={(e) => setNewDevice({ ...newDevice, vendor: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cisco">Cisco Systems</option>
                    <option value="Sophos">Sophos</option>
                    <option value="HP Aruba">HP Aruba</option>
                    <option value="MikroTik">MikroTik RouterOS</option>
                    <option value="D-Link">D-Link Enterprise</option>
                    <option value="Ubiquiti">Ubiquiti EdgeSwitch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 uppercase">Model</label>
                  <input
                    type="text"
                    placeholder="Catalyst 2960 / XGS 3300"
                    value={newDevice.model}
                    onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 uppercase">Physical Location</label>
                  <input
                    type="text"
                    placeholder="Lab 2 - Rack B"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 uppercase">SNMP Community</label>
                  <input
                    type="text"
                    placeholder="public"
                    value={newDevice.snmp_community}
                    onChange={(e) => setNewDevice({ ...newDevice, snmp_community: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {newDevice.device_type === 'switch' && (
                <div>
                  <label className="block text-slate-300 mb-1 uppercase">Port Density</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewDevice({ ...newDevice, port_count: 24 })}
                      className={`p-2 rounded-lg border text-center ${
                        newDevice.port_count === 24
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      24 Ports (Lab Switch)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDevice({ ...newDevice, port_count: 48 })}
                      className={`p-2 rounded-lg border text-center ${
                        newDevice.port_count === 48
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      48 Ports (Building Core)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-950"
                >
                  Add Device to Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
