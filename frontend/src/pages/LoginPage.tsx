import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, ArrowRight, Play, Terminal, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('CyberAdmin2026!');
  const [totpCode, setTotpCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [isOfflineWarning, setIsOfflineWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsOfflineWarning(false);
    setIsLoading(true);

    try {
      await login(username, password, show2FA ? totpCode : undefined);
      navigate('/');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Two-Factor')) {
        setShow2FA(true);
        setError('Two-Factor Authentication required. Enter 6-digit TOTP code (Demo: 123456).');
      } else if (msg.includes('unreachable') || msg.includes('Failed to fetch') || msg.includes('Network') || msg.includes('8000')) {
        setIsOfflineWarning(true);
        setError('Python Backend is currently offline or unreachable on port 8000.');
      } else {
        setError(msg || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterDemo = (roleKey: string = 'admin') => {
    loginDemo(roleKey);
    navigate('/');
  };

  const handleDemoSelect = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setIsOfflineWarning(false);
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Grid & Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111726_1px,transparent_1px),linear-gradient(to_bottom,#111726_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mx-auto shadow-2xl shadow-cyan-950/80">
            <ShieldCheck className="h-9 w-9 text-cyan-400" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white font-mono">
            CYBERSENTINEL
          </h1>
          <p className="mt-1 text-xs text-cyan-400 font-mono tracking-widest uppercase">
            All-in-One NSM • SIEM • IDS • Vulnerability Assessment
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-7 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-500/40 bg-red-950/40 text-red-200 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">{error}</span>
                  {isOfflineWarning && (
                    <div className="mt-2 text-[11px] text-slate-300 space-y-1.5 font-mono">
                      <p className="text-amber-300">
                        To connect to the live backend engine:
                      </p>
                      <div className="bg-slate-900 border border-slate-800 rounded p-2 text-cyan-300 flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                        <code>.\scripts\run_xampp_backend.bat</code>
                      </div>
                      <p className="text-slate-400">
                        Or enter Standalone Demo Mode right now to explore the full dashboard:
                      </p>
                      <button
                        type="button"
                        onClick={() => handleEnterDemo(username)}
                        className="mt-2 w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        CONTINUE IN OFFLINE DEMO MODE ({username.toUpperCase()})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 font-mono mb-1.5 uppercase">
                Username / Operator Identity
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 font-mono mb-1.5 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {show2FA && (
              <div>
                <label className="block text-xs font-semibold text-cyan-400 font-mono mb-1.5 uppercase">
                  Two-Factor Authentication (2FA) Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-cyan-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="w-full bg-slate-900 border border-cyan-800 rounded-lg pl-9 pr-3 py-2 text-sm text-cyan-300 tracking-widest font-mono focus:outline-none focus:border-cyan-400"
                    placeholder="123456"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold font-mono tracking-wider text-white transition-all disabled:opacity-50 shadow-lg shadow-cyan-950/60"
              >
                {isLoading ? 'CONNECTING...' : 'SECURE SIGN IN'}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleEnterDemo(username)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 text-xs font-bold font-mono tracking-wider text-cyan-300 transition-all shadow"
                title="Instant access without waiting for Python backend"
              >
                <Play className="h-3.5 w-3.5 fill-current text-cyan-400" />
                OFFLINE DEMO ACCESS
              </button>
            </div>
          </form>

          {/* Quick Demo Credential Selector */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-mono text-slate-400 uppercase">
                Quick Role Credentials
              </p>
              <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Pre-Configured
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleDemoSelect('admin', 'CyberAdmin2026!')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'admin'
                    ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <span className="text-cyan-400 font-bold block text-xs">Super Admin</span>
                <span className="text-slate-400">user:</span> admin
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('secadmin', 'SecAdmin2026!')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'secadmin'
                    ? 'border-blue-500/60 bg-blue-950/40 text-blue-200'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <span className="text-blue-400 font-bold block text-xs">Security Admin</span>
                <span className="text-slate-400">user:</span> secadmin
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('analyst', 'Analyst2026!')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'analyst'
                    ? 'border-amber-500/60 bg-amber-950/40 text-amber-200'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <span className="text-amber-400 font-bold block text-xs">Security Analyst</span>
                <span className="text-slate-400">user:</span> analyst
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('viewer', 'Viewer2026!')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'viewer'
                    ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <span className="text-emerald-400 font-bold block text-xs">Auditor / Viewer</span>
                <span className="text-slate-400">user:</span> viewer
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-[11px] text-slate-500 font-mono mt-4">
          CyberSentinel Unified SIEM & NMS Platform • Strict RBAC & Session Control
        </p>
      </div>
    </div>
  );
};
