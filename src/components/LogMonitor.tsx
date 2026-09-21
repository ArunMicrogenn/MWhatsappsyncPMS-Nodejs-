import React, { useState, useEffect, useRef } from 'react';
import { ScrollText, Trash2, Pause, Play, Download, Terminal } from 'lucide-react';

interface LogMonitorProps {
  serviceName: string;
  darkMode?: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const LOG_TEMPLATES = [
  { level: 'INFO', message: 'Querying ODBC database for pending messages...' },
  { level: 'INFO', message: 'Synchronizing PDF media files from source directory...' },
  { level: 'INFO', message: 'Heartbeat ping successful. Daemon is active.' },
  { level: 'INFO', message: 'Sent batch of 5 text messages to webhook endpoint.' },
  { level: 'INFO', message: 'No new events found in the processing queue.' },
  { level: 'INFO', message: 'Successfully parsed incoming JSON payload.' },
  { level: 'WARN', message: 'PDF source directory is slow to respond (latency > 500ms).' },
  { level: 'WARN', message: 'Memory usage approaching configured limit, running GC.' },
  { level: 'WARN', message: 'Retrying connection to webhook endpoint (Attempt 2/3).' },
  { level: 'ERROR', message: '[ODBC SQL Server Driver] Timeout expired.' },
  { level: 'ERROR', message: 'Failed to copy media file: Access Denied (0x80070005).' },
  { level: 'ERROR', message: 'Invalid payload structure received from WhatsApp API.' },
];

export function LogMonitor({ serviceName, darkMode }: LogMonitorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Handle manual scroll to pause auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    setAutoScroll(isAtBottom);
  };

  // Simulation logic
  useEffect(() => {
    if (isPaused) return;

    const generateLog = () => {
      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      const now = new Date();
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: now.toISOString().replace('T', ' ').substring(0, 23),
        level: template.level as 'INFO' | 'WARN' | 'ERROR',
        message: template.message
      };

      setLogs(prev => {
        const next = [...prev, newLog];
        // Keep max 500 logs to prevent memory bloat
        return next.length > 500 ? next.slice(next.length - 500) : next;
      });
    };

    // Generate initial logs if empty
    if (logs.length === 0) {
      const now = new Date();
      setLogs([
        {
          id: 'init-1',
          timestamp: now.toISOString().replace('T', ' ').substring(0, 23),
          level: 'INFO',
          message: `Starting service ${serviceName}...`
        },
        {
          id: 'init-2',
          timestamp: now.toISOString().replace('T', ' ').substring(0, 23),
          level: 'INFO',
          message: `Service ${serviceName} started successfully (PID: 4820).`
        }
      ]);
    }

    const interval = setInterval(() => {
      // 70% chance to generate a log every interval
      if (Math.random() > 0.3) {
        generateLog();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isPaused, serviceName, logs.length]);

  const clearLogs = () => setLogs([]);

  const downloadLogs = () => {
    const content = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${serviceName}-logs.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return darkMode ? 'text-blue-400' : 'text-blue-600';
      case 'WARN':
        return darkMode ? 'text-amber-400' : 'text-amber-600';
      case 'ERROR':
        return darkMode ? 'text-rose-400' : 'text-rose-600';
      default:
        return darkMode ? 'text-slate-300' : 'text-slate-600';
    }
  };

  return (
    <div className={`rounded-2xl border shadow-sm p-6 sm:p-8 flex flex-col h-[700px] transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-slate-800'}`}>
      <div className={`flex items-center justify-between pb-6 border-b mb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <ScrollText className="w-5 h-5 text-emerald-600" />
            Live Log Monitor
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time simulated log stream for <strong>{serviceName}</strong>.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4 text-amber-500" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={clearLogs}
            className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            Clear
          </button>
          <button
            onClick={downloadLogs}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto rounded-xl border p-4 font-mono text-xs leading-relaxed ${
          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
            <Terminal className="w-10 h-10 opacity-50" />
            <p>No logs to display.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`py-1 flex items-start gap-3 hover:bg-white/5 px-2 rounded-md ${darkMode ? 'text-slate-300' : 'text-slate-300'}`}>
              <span className="text-slate-500 shrink-0 whitespace-nowrap">[{log.timestamp}]</span>
              <span className={`font-semibold shrink-0 w-12 ${getLevelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="break-words">{log.message}</span>
            </div>
          ))
        )}
      </div>
      
      {!autoScroll && (
        <div className="absolute bottom-10 right-10 flex justify-center mt-2">
          <button 
            onClick={() => { setAutoScroll(true); scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }}
            className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur flex items-center gap-2 cursor-pointer animate-pulse"
          >
            Auto-scroll paused. Click to resume.
          </button>
        </div>
      )}
    </div>
  );
}
