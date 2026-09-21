import React, { useState } from 'react';
import { Terminal, Play, Square, RotateCw, Activity, Check, X, Command, Copy } from 'lucide-react';

interface QuickActionsProps {
  serviceName: string;
  darkMode?: boolean;
}

export function QuickActions({ serviceName, darkMode }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const actions = [
    { id: 'start', label: 'Start Service', cmd: `Start-Service -Name "${serviceName}"`, icon: Play, color: 'text-emerald-500' },
    { id: 'stop', label: 'Stop Service', cmd: `Stop-Service -Name "${serviceName}"`, icon: Square, color: 'text-rose-500' },
    { id: 'restart', label: 'Restart Service', cmd: `Restart-Service -Name "${serviceName}"`, icon: RotateCw, color: 'text-blue-500' },
    { id: 'status', label: 'Check Status', cmd: `Get-Service -Name "${serviceName}"`, icon: Activity, color: 'text-amber-500' },
  ];

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className={`mb-4 w-72 rounded-2xl border shadow-xl overflow-hidden transition-all duration-200 origin-bottom-right ${
          darkMode ? 'bg-slate-900 border-slate-700 text-white shadow-black/50' : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
        }`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            darkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'
          }`}>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              PowerShell Actions
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded-md transition-colors ${
                darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleCopy(action.cmd)}
                className={`w-full text-left flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer group ${
                  darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                }`}
                title="Click to copy command"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    darkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-white'
                  }`}>
                    <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{action.label}</div>
                  </div>
                </div>
                {copiedCmd === action.cmd ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
          isOpen 
            ? darkMode ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
        }`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Command className="w-5 h-5" />}
      </button>
    </div>
  );
}
