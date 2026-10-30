import React, { useEffect, useState } from 'react';
import {
  Binary,
  Upload,
  FileCheck,
  ShieldAlert,
  Hash,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const ForensicsPage: React.FC = () => {
  const [captures, setCaptures] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchCaptures = async () => {
    try {
      const data = await ApiClient.request<any[]>('/forensics/captures');
      setCaptures(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCaptures();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await ApiClient.uploadFile<any>('/forensics/upload-pcap', formData);
      setUploadResult(res);
      setFile(null);
      await fetchCaptures();
    } catch (err: any) {
      setError(err.message || 'PCAP upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Binary className="h-5 w-5 text-cyan-400" />
            DIGITAL FORENSICS & PCAP INTEGRITY INSPECTOR
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic SHA-256 evidence hashing, protocol extraction, frame dissection & chain of custody
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-3 py-1.5 rounded-lg">
          <Hash className="h-4 w-4" />
          <span>Hashing Standard: FIPS 180-4 SHA-256</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 shadow-xl space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors bg-slate-900/30">
            <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-white font-mono">
              Upload PCAP Network Packet Capture File
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports .pcap, .pcapng, and .cap files for forensic dissection and SHA-256 verification
            </p>

            <input
              type="file"
              accept=".pcap,.pcapng,.cap"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-4 text-xs font-mono text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || isUploading}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-md shadow-cyan-950"
            >
              {isUploading ? 'DISSECTING PCAP...' : 'INGEST FORENSIC EVIDENCE'}
            </button>
          </div>
        </form>
      </div>

      {/* Upload Analysis Result */}
      {uploadResult && (
        <div className="rounded-2xl border border-cyan-800/80 bg-slate-950/90 p-5 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                EVIDENCE INGESTION & INTEGRITY VERIFICATION COMPLETED
              </span>
              <h2 className="text-sm font-bold text-white mt-1">{uploadResult.filename}</h2>
            </div>
            <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">
              {uploadResult.packet_count} Total Frames
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs break-all">
            <span className="text-slate-400 block text-[10px] uppercase">CRYPTOGRAPHIC SHA-256 HASH:</span>
            <span className="text-cyan-300 font-bold">{uploadResult.sha256_hash}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400 block mb-2 uppercase">Protocol Breakdown:</span>
              <pre className="p-3 rounded-xl bg-black/70 border border-slate-900 text-xs text-slate-300">
                {JSON.stringify(uploadResult.protocols, null, 2)}
              </pre>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-2 uppercase">Identified Top Talkers:</span>
              <div className="space-y-1.5">
                {uploadResult.top_talkers?.map((tt: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between p-2 rounded bg-slate-900/50 border border-slate-800 text-xs"
                  >
                    <span className="text-white font-bold">{tt.ip}</span>
                    <span className="text-cyan-400">{tt.megabytes} MB</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Evidence Vault Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-400" />
            FORENSIC EVIDENCE VAULT (CHAIN OF CUSTODY)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Frames</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4 text-right">Ingest Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {captures.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-400" />
                    {c.filename}
                  </td>
                  <td className="py-3 px-4 text-cyan-300 truncate max-w-xs">{c.sha256_hash}</td>
                  <td className="py-3 px-4 text-slate-200">{c.packet_count}</td>
                  <td className="py-3 px-4 text-slate-400">{Math.round(c.file_size_bytes / 1024)} KB</td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {new Date(c.upload_timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {captures.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No evidence captures uploaded yet.
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
