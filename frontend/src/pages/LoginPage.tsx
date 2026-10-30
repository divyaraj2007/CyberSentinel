import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('CyberAdmin2026!');
  const [totpCode, setTotpCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password, show2FA ? totpCode : undefined);
      navigate('/');
    } catch (err: any) {
      if (err.message && err.message.includes('Two-Factor')) {
        setShow2FA(true);
        setError('Two-Factor Authentication required. Enter 6-digit TOTP code (Demo: 123456).');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Grid & Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111726_1px,transparent_1px),linear-gradient(to_bottom,#111726_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mx-auto shadow-lg shadow-cyan-950">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white font-mono">
            CYBERSENTINEL
          </h1>
          <p className="mt-1 text-xs text-cyan-400 font-mono tracking-widest uppercase">
            Discover. Monitor. Detect. Defend.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-7 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 flex items-center gap-2.5 p-3 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5 uppercase">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {show2FA && (
              <div>
                <label className="block text-xs font-medium text-cyan-400 font-mono mb-1.5 uppercase">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold font-mono tracking-wider text-white transition-colors disabled:opacity-50 mt-2 shadow-md shadow-cyan-950"
            >
              {isLoading ? 'AUTHENTICATING...' : 'SECURE SIGN IN'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Credential Pills */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-mono text-slate-400 mb-2 uppercase text-center">
              Quick Role Switch (Demo Credentials)
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleDemoSelect('admin', 'CyberAdmin2026!')}
                className="p-1.5 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-left transition-colors"
              >
                <span className="text-cyan-400 font-bold block">Super Admin</span>
                admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('secadmin', 'SecAdmin2026!')}
                className="p-1.5 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-left transition-colors"
              >
                <span className="text-blue-400 font-bold block">Security Admin</span>
                secadmin
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('analyst', 'Analyst2026!')}
                className="p-1.5 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-left transition-colors"
              >
                <span className="text-amber-400 font-bold block">Security Analyst</span>
                analyst
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('viewer', 'Viewer2026!')}
                className="p-1.5 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-left transition-colors"
              >
                <span className="text-slate-400 font-bold block">Auditor / Viewer</span>
                viewer
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 font-mono mt-4">
          CyberSentinel Unified SIEM & NMS Platform • Strict RBAC & Session Control
        </p>
      </div>
    </div>
  );
};
