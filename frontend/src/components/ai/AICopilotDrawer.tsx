import React, { useState } from 'react';
import { X, Send, Bot, Shield, CheckCircle2, AlertCircle, Sparkles, Terminal } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { AICopilotResponse } from '../../types';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      content?: string;
      data?: AICopilotResponse;
    }>
  >([
    {
      role: 'assistant',
      content:
        "Hello Analyst. I am CyberSentinel AI Security Copilot. I analyze real-time network telemetry, explain IDS alerts, interpret CVE findings, and recommend concrete investigation playbooks without speculation. How can I assist you?",
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const q = (customPrompt || prompt).trim();
    if (!q || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    if (!customPrompt) setPrompt('');
    setIsLoading(true);

    try {
      const resp = await ApiClient.request<AICopilotResponse>('/ai/copilot', {
        method: 'POST',
        body: JSON.stringify({
          prompt: q,
          context_type: q.toLowerCase().includes('cve') ? 'vulnerability' : 'alert',
        }),
      });

      setMessages((prev) => [...prev, { role: 'assistant', data: resp }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to process query: ${err.message || 'API error'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Explain the high-risk SYN port scan alert on 192.168.1.105',
    'Explain Apache CVE-2021-41773 and remediation',
    'What investigation steps are recommended for rogue endpoint?',
    'Synthesize current SOC threat landscape overview',
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-slate-950/95 border-l border-slate-800 backdrop-blur-2xl z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              AI Security Copilot
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                SOC v1.0
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">Grounded Security Investigation Engine</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap gap-1.5">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp)}
            className="text-[11px] text-left px-2 py-1 rounded bg-slate-800/70 hover:bg-cyan-950/60 hover:text-cyan-300 border border-slate-700/60 text-slate-300 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {m.role === 'user' ? (
              <div className="bg-cyan-600/20 border border-cyan-500/40 text-cyan-100 rounded-xl px-3.5 py-2 text-xs max-w-[85%]">
                {m.content}
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 max-w-[95%] space-y-3">
                {m.content && <p className="whitespace-pre-line leading-relaxed">{m.content}</p>}

                {m.data && (
                  <div className="space-y-3">
                    {/* Render Markdown-like answer */}
                    <div className="whitespace-pre-line leading-relaxed text-slate-300">
                      {m.data.answer}
                    </div>

                    {/* Investigation Steps */}
                    {m.data.investigation_steps?.length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <p className="font-semibold text-cyan-400 flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Recommended Investigation Steps:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                          {m.data.investigation_steps.map((step, si) => (
                            <li key={si}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Remediation Playbook */}
                    {m.data.remediation_recommendations?.length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <p className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                          <Shield className="h-3.5 w-3.5" />
                          Remediation Recommendations:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                          {m.data.remediation_recommendations.map((rec, ri) => (
                            <li key={ri}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Evidence Sources */}
                    {m.data.evidence_sources?.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center gap-2">
                        <span>SOURCES:</span>
                        {m.data.evidence_sources.join(' | ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <Sparkles className="h-4 w-4 animate-spin text-cyan-400" />
            Analyzing evidence telemetry and correlating threat rules...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Copilot (e.g. explain alert, triage CVE, analyze IP)..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
