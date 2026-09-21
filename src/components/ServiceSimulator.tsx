import React, { useState, useEffect } from 'react';
import { Activity, Play, Square, RotateCw, Terminal, CheckCircle2, AlertTriangle, Cpu, HardDrive, RefreshCcw, Wifi, Send, Code, ArrowRight, Clock, FileText, Check, AlertCircle, Copy, Radio, Sparkles, CheckCheck, ShieldCheck, Zap, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ServiceConfig } from '../types';
import { EnvironmentHealthCheck } from './EnvironmentHealthCheck';

interface ServiceSimulatorProps {
  serviceName: string;
  config?: ServiceConfig;
  darkMode?: boolean;
  onUpdateConfig?: (newConfig: ServiceConfig) => void;
}

interface HealthMetrics {
  memoryUsageMB: number;
  cpuLoadPercent: number;
  odbcConnected: boolean;
  queuePending: number;
  uptimeSeconds: number;
  lastPing: string;
  errorRate: string;
}

const WEBHOOK_PRESETS = [
  {
    id: 'text_message',
    name: 'AISensy Inbound Message (Text)',
    description: 'Standard customer WhatsApp query / reply payload',
    eventType: 'message_received',
    payload: {
      event: "message_received",
      hotelCode: "H101",
      entry: [
        {
          id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "+1 555-023-4567",
                  phone_number_id: "104572912384729"
                },
                contacts: [
                  {
                    profile: { name: "Rajesh Kumar" },
                    wa_id: "919876543210"
                  }
                ],
                messages: [
                  {
                    from: "919876543210",
                    id: "wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhggMTIzNDU2Nzg5MEFCQ0RFRgA=",
                    timestamp: "1710582910",
                    text: {
                      body: "Hello, please confirm my check-in time and send invoice PDF."
                    },
                    type: "text"
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    }
  },
  {
    id: 'document_attachment',
    name: 'Customer Media / PDF Attachment',
    description: 'Incoming PDF document uploaded by guest via WhatsApp',
    eventType: 'media_received',
    payload: {
      event: "document_received",
      hotelCode: "H101",
      entry: [
        {
          id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                contacts: [
                  {
                    profile: { name: "Priya Sharma" },
                    wa_id: "919811223344"
                  }
                ],
                messages: [
                  {
                    from: "919811223344",
                    id: "wamid.HBgLOTE5ODExMjIzMzQ0FQIAEhggOTg3NjU0MzIxMEZFRENCQQA=",
                    timestamp: "1710583100",
                    type: "document",
                    document: {
                      filename: "guest_passport_id.pdf",
                      mime_type: "application/pdf",
                      sha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
                      id: "media_doc_889201"
                    }
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    }
  },
  {
    id: 'status_update',
    name: 'Message Status Callback (Delivered / Read)',
    description: 'WhatsApp delivery receipt webhook for outbound invoices',
    eventType: 'status_update',
    payload: {
      event: "status_update",
      hotelCode: "H101",
      entry: [
        {
          id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                statuses: [
                  {
                    id: "wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhggMTIzNDU2Nzg5MEFCQ0RFRgA=",
                    status: "delivered",
                    timestamp: "1710583120",
                    recipient_id: "919876543210",
                    conversation: {
                      id: "conv_881923",
                      origin: { type: "service" }
                    },
                    pricing: {
                      billable: true,
                      pricing_model: "CBP",
                      category: "service"
                    }
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    }
  },
  {
    id: 'pms_sync',
    name: 'Hotel PMS Booking Sync Payload',
    description: 'Webhook dispatched from hotel property management system',
    eventType: 'pms_booking_sync',
    payload: {
      event: "booking_synced",
      hotelCode: "H101",
      reservationId: "RES-2026-994",
      guestName: "Ananya Roy",
      phone: "+919822334455",
      checkInDate: "2026-09-25",
      checkOutDate: "2026-09-28",
      roomNumber: "402",
      totalAmount: 12500.00,
      currency: "INR",
      dispatchWhatsappWelcome: true
    }
  }
];

export function ServiceSimulator({ serviceName, config, darkMode, onUpdateConfig }: ServiceSimulatorProps) {
  const [status, setStatus] = useState<'Running' | 'Stopped' | 'Starting' | 'Stopping'>('Running');
  const [activeTab, setActiveTab] = useState<'monitoring' | 'health-check' | 'benchmarking' | 'webhook'>('monitoring');
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkResult, setBenchmarkResult] = useState<{ cpuEst: string, memEst: string, recommendation: string } | null>(null);

  // ODBC Driver Environment Status State
  const [odbcHealth, setOdbcHealth] = useState<{
    tested: boolean;
    driverExists: boolean;
    driverName: string;
    warningMessage?: string | null;
  }>({
    tested: false,
    driverExists: true,
    driverName: config?.odbcDriver || '{SQL Server Native Client 11.0}',
  });

  // Check ODBC Driver Health on mount and when config changes
  useEffect(() => {
    const checkDriver = async () => {
      try {
        const res = await fetch('/api/environment-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ odbcDriver: config?.odbcDriver || '{SQL Server Native Client 11.0}' })
        });
        const data = await res.json();
        if (data.success) {
          setOdbcHealth({
            tested: true,
            driverExists: data.driverExists,
            driverName: data.requestedDriver,
            warningMessage: data.warningMessage
          });

          // If missing driver, output a diagnostic alert into logs
          if (!data.driverExists) {
            setLogs(prev => [
              ...prev.slice(-30),
              `[${new Date().toLocaleTimeString()}] [ODBC-AUDIT-ALERT] Host machine ODBC check: Driver "${data.requestedDriver}" was NOT found in system registry. Service will throw 'Data source name not found' on odbc_connect().`
            ]);
          }
        }
      } catch (e) {
        console.error("ODBC driver check failed:", e);
      }
    };

    checkDriver();
  }, [config?.odbcDriver]);

  // Webhook Tester State
  const [selectedPresetId, setSelectedPresetId] = useState<string>(WEBHOOK_PRESETS[0].id);
  const [webhookPayload, setWebhookPayload] = useState<string>(JSON.stringify(WEBHOOK_PRESETS[0].payload, null, 2));
  const [customHotelCode, setCustomHotelCode] = useState<string>('H101');
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<any | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  const [metrics, setMetrics] = useState<HealthMetrics>({
    memoryUsageMB: 24,
    cpuLoadPercent: 2.1,
    odbcConnected: true,
    queuePending: 0,
    uptimeSeconds: 120,
    lastPing: new Date().toLocaleTimeString(),
    errorRate: "0.0%"
  });
  const [pollCount, setPollCount] = useState(0);
  const [resourceHistory, setResourceHistory] = useState<{ time: string, memory: number, cpu: number }[]>([]);

  const isNode = (config?.runtime || 'node') === 'node';
  const runtimeExec = isNode ? (config?.nodePath || 'C:\\Program Files\\nodejs\\node.exe') : (config?.phpPath || 'C:\\php\\php.exe');

  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Service "${serviceName}" initialized successfully.`,
    `[${new Date().toLocaleTimeString()}] Loaded runtime executable ${runtimeExec}`,
    `[${new Date().toLocaleTimeString()}] Executing sync daemon loop (${isNode ? 'Node.js' : 'PHP'})...`,
    `[${new Date().toLocaleTimeString()}] Connected to WhatsApp Webhook / Queue successfully.`
  ]);

  // Polling effect for health check
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/health-check?state=${status}`);
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics);
          setPollCount(c => c + 1);
          setResourceHistory(prev => {
            const next = [...prev, { 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
              memory: data.metrics.memoryUsageMB,
              cpu: data.metrics.cpuLoadPercent
            }];
            return next.slice(-20); // Keep last 20 points
          });
        }
      } catch (err) {
        console.error("Health check poll failed:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [status]);

  useEffect(() => {
    if (status === 'Running') {
      const interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString();
        const actions = [
          `[${timeStr}] Sync cycle check: 0 pending messages in queue.`,
          `[${timeStr}] Heartbeat OK. Memory usage: ${metrics.memoryUsageMB} MB.`,
          `[${timeStr}] Polling WhatsApp gateway... Status 200 OK.`
        ];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        setLogs(prev => [...prev.slice(-30), randomAction]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [status, metrics.memoryUsageMB]);

  const handleStart = () => {
    setStatus('Starting');
    setTimeout(() => {
      setStatus('Running');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Service "${serviceName}" started by administrator.`]);
    }, 1000);
  };

  const handleStop = () => {
    setStatus('Stopping');
    setTimeout(() => {
      setStatus('Stopped');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Service "${serviceName}" stopped.`]);
    }, 1000);
  };

  const handleRestart = () => {
    handleStop();
    setTimeout(() => {
      handleStart();
    }, 1500);
  };

  const runBenchmark = () => {
    setIsBenchmarking(true);
    setBenchmarkProgress(0);
    setBenchmarkResult(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setBenchmarkProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsBenchmarking(false);
        setBenchmarkResult({
          cpuEst: (1.5 + Math.random() * 2).toFixed(1) + "%",
          memEst: (20 + Math.random() * 15).toFixed(0) + " MB",
          recommendation: "System overhead is well within acceptable margins. The polling interval (30s) is optimized."
        });
      }
    }, 300);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = WEBHOOK_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPresetId(preset.id);
      setWebhookPayload(JSON.stringify(preset.payload, null, 2));
      setWebhookError(null);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(webhookPayload);
      setWebhookPayload(JSON.stringify(parsed, null, 2));
      setWebhookError(null);
    } catch (e: any) {
      setWebhookError("Cannot format: " + e.message);
    }
  };

  const handleSendWebhook = async () => {
    setIsSendingWebhook(true);
    setWebhookError(null);
    setWebhookResult(null);

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(webhookPayload);
    } catch (e: any) {
      setWebhookError("Invalid JSON syntax: " + e.message);
      setIsSendingWebhook(false);
      return;
    }

    const currentPreset = WEBHOOK_PRESETS.find(p => p.id === selectedPresetId);
    const targetScript = config?.scriptPath || "C:\\whatsapp-sync\\daemon.php";
    const targetPhp = config?.phpPath || "C:\\php\\php.exe";

    try {
      const response = await fetch('/api/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scriptPath: targetScript,
          phpPath: targetPhp,
          payload: parsedPayload,
          eventType: currentPreset?.eventType || 'message_received',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AISensy-Webhook-Engine/2.1',
            'X-WhatsApp-HotelCode': customHotelCode || 'H101',
            'X-AISensy-Signature': 'sha256=9b71d224b74bc4811f'
          }
        })
      });

      const data = await response.json();
      setWebhookResult(data);

      const timeStr = new Date().toLocaleTimeString();
      if (data.success) {
        setLogs(prev => [
          ...prev.slice(-30),
          `[${timeStr}] [WEBHOOK-POST] Dispatched dummy payload to ${targetScript} (${data.executionTimeMs}ms) -> 200 OK`,
          `[${timeStr}] [DAEMON-ROUTER] Parsed Event: ${data.processedData.eventType} | Hotel: ${data.processedData.hotelCode} | Sender: ${data.processedData.sender}`,
          ...(data.logs || []).slice(3, 5)
        ]);
      } else {
        setWebhookError(data.error || 'Failed to dispatch webhook');
      }
    } catch (err: any) {
      setWebhookError(err.message || 'Network error communicating with simulator backend');
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const cardClass = `rounded-2xl border shadow-sm p-6 sm:p-8 transition-colors duration-200 ${
    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-slate-800'
  }`;

  const subCardClass = `p-4 rounded-xl border flex items-center justify-between ${
    darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/60'
  }`;

  return (
    <div className="space-y-6">
      <div className={`flex items-center p-1 rounded-lg border inline-flex ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'monitoring' 
              ? darkMode ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          Live Monitoring
        </button>
        <button
          onClick={() => setActiveTab('health-check')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'health-check' 
              ? darkMode ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className={`w-4 h-4 ${odbcHealth.tested && !odbcHealth.driverExists ? 'text-rose-500' : 'text-indigo-500'}`} />
          Environment Health Check
          {odbcHealth.tested && !odbcHealth.driverExists ? (
            <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded-full font-bold animate-pulse">
              MISSING
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full font-mono">
              OK
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('benchmarking')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'benchmarking' 
              ? darkMode ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-500" />
          Benchmarking
        </button>
        <button
          onClick={() => setActiveTab('webhook')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'webhook' 
              ? darkMode ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Send className="w-4 h-4 text-indigo-500" />
          Webhook Tester
          <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded-full font-mono">POST</span>
        </button>
      </div>

      {activeTab === 'monitoring' && (
        <>
          {/* Control & Status Card */}
          <div className={cardClass}>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b mb-6 gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Activity className="w-5 h-5 text-emerald-600" />
              Windows Service Control & Simulator
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Simulate service control commands and monitor real-time health telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStart}
              disabled={status === 'Running' || status === 'Starting'}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Start
            </button>
            <button
              onClick={handleStop}
              disabled={status === 'Stopped' || status === 'Stopping'}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-white" /> Stop
            </button>
            <button
              onClick={handleRestart}
              className={`px-3.5 py-2 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-700 hover:bg-slate-800'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" /> Restart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={subCardClass}>
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Service Name</span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{serviceName}</span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
              status === 'Running' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
              status === 'Stopped' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {status === 'Running' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {status}
            </span>
          </div>

          <div className={subCardClass}>
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Process Runtime</span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>PHP CLI (php.exe)</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${darkMode ? 'bg-slate-800 text-slate-300' : 'text-slate-500 bg-slate-200/70'}`}>PID 4820</span>
          </div>

          <div className={subCardClass}>
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recovery Policy</span>
              <span className={`text-sm font-bold mt-0.5 block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Auto Restart (10s delay)</span>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Active</span>
          </div>
        </div>

        {/* Real-time Health Monitoring Widget */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-inner border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">Real-Time Health & Telemetry Widget</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <RefreshCcw className="w-3 h-3 animate-spin text-emerald-400" /> Polled #{pollCount}
              </span>
              <span>&bull; Last Ping: {metrics.lastPing}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">Memory RSS</span>
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {metrics.memoryUsageMB} <span className="text-xs text-slate-400 font-normal">MB</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">CPU Load</span>
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {metrics.cpuLoadPercent}%
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('health-check')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                odbcHealth.tested && !odbcHealth.driverExists
                  ? 'bg-rose-950/80 border-rose-600/90 ring-1 ring-rose-500/50 hover:bg-rose-900/80'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium flex items-center gap-1">
                  ODBC SQL Ping
                  {odbcHealth.tested && !odbcHealth.driverExists && (
                    <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
                  )}
                </span>
                <Wifi className={`w-3.5 h-3.5 ${
                  odbcHealth.tested && !odbcHealth.driverExists 
                    ? 'text-rose-400' 
                    : metrics.odbcConnected ? 'text-emerald-400' : 'text-rose-400'
                }`} />
              </div>
              <div className={`text-sm font-bold mt-1 ${
                odbcHealth.tested && !odbcHealth.driverExists
                  ? 'text-rose-300'
                  : metrics.odbcConnected ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {odbcHealth.tested && !odbcHealth.driverExists
                  ? 'Host Driver Missing'
                  : metrics.odbcConnected ? 'Connected (200ms)' : 'Disconnected'}
              </div>
              {odbcHealth.tested && !odbcHealth.driverExists && (
                <div className="text-[10px] text-rose-400/90 mt-1 flex items-center justify-between">
                  <span>Click to diagnose</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs">Queue / Errors</span>
                <Activity className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white mt-1">
                {metrics.queuePending} pending ({metrics.errorRate})
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Resource Usage Trend (CPU & Memory)</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={resourceHistory} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={8} minTickGap={15} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(value) => `${value}MB`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} domain={[0, 'dataMax + 10']} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#60a5fa' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    name="Memory (MB)"
                    dataKey="memory" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#60a5fa' }}
                    isAnimationActive={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    name="CPU (%)"
                    dataKey="cpu" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#34d399' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

          {/* Terminal Log Stream */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Terminal className="w-4 h-4 text-slate-500" /> Live Daemon Log Stream
              </span>
              <button
                onClick={() => setLogs([])}
                className={`text-xs underline cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Clear logs
              </button>
            </div>
            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs h-64 overflow-y-auto space-y-1.5 border border-slate-800">
              {logs.map((log, idx) => (
                <div key={idx} className="break-all">{log}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Environment Health Check Tab */}
      {activeTab === 'health-check' && (
        <EnvironmentHealthCheck 
          config={config} 
          darkMode={darkMode} 
          onSelectDriver={(newDriver) => {
            if (config && onUpdateConfig) {
              onUpdateConfig({
                ...config,
                odbcDriver: newDriver
              });
            }
          }} 
        />
      )}

      {/* Benchmarking Tab */}
      {activeTab === 'benchmarking' && (
        <div className={cardClass}>
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b mb-6 gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Cpu className="w-5 h-5 text-purple-600" />
                Performance Benchmark
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Run a simulated stress test to estimate daemon CPU and Memory overhead.
              </p>
            </div>
            
            <button
              onClick={runBenchmark}
              disabled={isBenchmarking}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isBenchmarking ? (
                <RotateCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              {isBenchmarking ? 'Running...' : 'Run Benchmark'}
            </button>
          </div>

          {isBenchmarking && (
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2">
                <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Simulating daemon cycles...</span>
                <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{benchmarkProgress}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div 
                  className="h-full bg-purple-500 transition-all duration-300 ease-out" 
                  style={{ width: `${benchmarkProgress}%` }}
                />
              </div>
            </div>
          )}

          {benchmarkResult && !isBenchmarking && (
            <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Benchmark Results</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <span className={`text-xs block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Est. CPU Overhead</span>
                  <span className={`text-xl font-bold font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{benchmarkResult.cpuEst}</span>
                </div>
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <span className={`text-xs block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Est. Memory Overhead</span>
                  <span className={`text-xl font-bold font-mono ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{benchmarkResult.memEst}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg text-sm flex gap-2 ${darkMode ? 'bg-purple-950/30 border border-purple-900/50 text-purple-200' : 'bg-purple-50 border border-purple-100 text-purple-800'}`}>
                <CheckCircle2 className="w-5 h-5 shrink-0 text-purple-500 mt-0.5" />
                <p>{benchmarkResult.recommendation}</p>
              </div>
            </div>
          )}
          
          {!benchmarkResult && !isBenchmarking && (
            <div className={`py-12 text-center border-2 border-dashed rounded-xl ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Click "Run Benchmark" to estimate system impact.</p>
            </div>
          )}
        </div>
      )}

      {/* Webhook Payload Tester Tab */}
      {activeTab === 'webhook' && (
        <div className={cardClass}>
          {/* Section Header */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b mb-6 gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Send className="w-5 h-5 text-indigo-500" />
                Webhook POST Simulator & Payload Verifier
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Dispatch dummy POST requests to your configured PHP script path to verify payload parsing and database transactions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 ${
                status === 'Running' 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${status === 'Running' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                Daemon {status}
              </span>
            </div>
          </div>

          {/* Configured Target Script Information Box */}
          <div className={`p-4 rounded-xl border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div>
              <span className={`text-[11px] block font-medium uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Configured Script Target
              </span>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className={`font-mono text-xs font-semibold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`} title={config?.scriptPath || "C:\\whatsapp-sync\\daemon.php"}>
                  {config?.scriptPath || "C:\\whatsapp-sync\\daemon.php"}
                </span>
              </div>
            </div>

            <div>
              <span className={`text-[11px] block font-medium uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                PHP Runtime CLI
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Terminal className="w-4 h-4 text-purple-500 shrink-0" />
                <span className={`font-mono text-xs truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`} title={config?.phpPath || "C:\\php\\php.exe"}>
                  {config?.phpPath || "C:\\php\\php.exe"}
                </span>
              </div>
            </div>

            <div>
              <span className={`text-[11px] block font-medium uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                HTTP Dispatch Target
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] px-1.5 py-0.5 rounded font-bold font-mono bg-emerald-500/20 text-emerald-500">
                  POST
                </span>
                <span className={`text-xs font-mono truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  /api/simulate-webhook
                </span>
              </div>
            </div>
          </div>

          {/* Webhook Presets Selector */}
          <div className="mb-6">
            <label className={`text-xs font-semibold block mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Select Webhook Payload Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {WEBHOOK_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? darkMode
                          ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40 text-white'
                          : 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-300 text-indigo-950'
                        : darkMode
                          ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0 ml-1" />}
                    </div>
                    <p className={`text-[11px] line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payload Editor & Headers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left 2 Cols: JSON Payload Editor */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Code className="w-3.5 h-3.5 text-indigo-500" />
                  JSON POST Body Payload
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFormatJson}
                    className={`text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                      darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Format JSON
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(webhookPayload);
                      setCopiedPayload(true);
                      setTimeout(() => setCopiedPayload(false), 2000);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                      darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {copiedPayload ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedPayload ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={14}
                  value={webhookPayload}
                  onChange={(e) => {
                    setWebhookPayload(e.target.value);
                    setWebhookError(null);
                  }}
                  className={`w-full font-mono text-xs p-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-emerald-400 selection:bg-indigo-900'
                      : 'bg-slate-900 border-slate-800 text-emerald-300 selection:bg-indigo-800'
                  }`}
                  placeholder="{ ... }"
                  spellCheck={false}
                />
              </div>

              {webhookError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{webhookError}</span>
                </div>
              )}
            </div>

            {/* Right 1 Col: Request Headers & Daemon Info */}
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-semibold flex items-center gap-1.5 mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Simulated Inbound Headers
                </label>
                <div className={`p-3.5 rounded-xl border space-y-2.5 font-mono text-xs ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Content-Type:</span>
                    <span className={`block font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>application/json</span>
                  </div>
                  <div>
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>User-Agent:</span>
                    <span className={`block font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>AISensy-Webhook-Engine/2.1</span>
                  </div>
                  <div>
                    <label className={`block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>X-WhatsApp-HotelCode:</label>
                    <input
                      type="text"
                      value={customHotelCode}
                      onChange={(e) => setCustomHotelCode(e.target.value)}
                      className={`w-full mt-1 px-2.5 py-1 text-xs rounded border ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                      placeholder="H101"
                    />
                  </div>
                  <div>
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>X-AISensy-Signature:</span>
                    <span className={`block text-[11px] truncate ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      sha256=9b71d224b74bc4811f...
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Box */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-100'}`}>
                <h4 className={`text-xs font-bold mb-1.5 flex items-center gap-1.5 ${darkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  Daemon Verification Pipeline
                </h4>
                <p className={`text-[11px] leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  This test sends the POST payload to the PHP daemon worker, parses WhatsApp contacts, verifies hotel isolation, and simulates the SQL Server ODBC query.
                </p>

                <button
                  onClick={handleSendWebhook}
                  disabled={isSendingWebhook}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSendingWebhook 
                      ? 'bg-indigo-700' 
                      : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98]'
                  }`}
                >
                  {isSendingWebhook ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Dispatching POST to Daemon...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Dummy POST Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Response & Verification Results View */}
          {webhookResult && (
            <div className={`mt-6 p-5 rounded-xl border transition-all ${
              webhookResult.success 
                ? darkMode ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-white border-emerald-300 shadow-sm'
                : darkMode ? 'bg-slate-900/90 border-rose-500/40' : 'bg-white border-rose-300 shadow-sm'
            }`}>
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${webhookResult.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {webhookResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${webhookResult.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                        HTTP {webhookResult.statusCode} {webhookResult.statusText}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        {webhookResult.executionTimeMs} ms
                      </span>
                    </div>
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Successfully processed by daemon script at {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(webhookResult, null, 2));
                      setCopiedResponse(true);
                      setTimeout(() => setCopiedResponse(false), 2000);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedResponse ? 'Copied Response' : 'Copy Response'}
                  </button>
                </div>
              </div>

              {/* Parsed Metadata Cards */}
              {webhookResult.processedData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] block uppercase font-medium tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sender Phone</span>
                    <span className={`text-xs font-mono font-bold truncate block mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {webhookResult.processedData.sender}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] block uppercase font-medium tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hotel Code</span>
                    <span className={`text-xs font-mono font-bold truncate block mt-0.5 text-indigo-500`}>
                      {webhookResult.processedData.hotelCode}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] block uppercase font-medium tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Event Type</span>
                    <span className={`text-xs font-mono font-bold truncate block mt-0.5 text-emerald-500`}>
                      {webhookResult.processedData.eventType}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] block uppercase font-medium tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Media / Attachment</span>
                    <span className={`text-xs font-mono font-bold truncate block mt-0.5 ${webhookResult.processedData.hasMedia ? 'text-amber-500' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {webhookResult.processedData.hasMedia ? webhookResult.processedData.mediaFilename : 'None'}
                    </span>
                  </div>
                </div>
              )}

              {/* Daemon Execution Log Console */}
              {webhookResult.logs && webhookResult.logs.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                      Daemon Execution Trace Logs:
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {webhookResult.logs.length} operations logged
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                    {webhookResult.logs.map((logLine: string, index: number) => (
                      <div key={index} className="leading-relaxed flex items-start gap-2">
                        <span className="text-slate-600 select-none">{index + 1}.</span>
                        <span className={logLine.includes('ODBC') ? 'text-amber-400' : logLine.includes('200 OK') ? 'text-emerald-400' : 'text-slate-300'}>
                          {logLine}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Payload JSON Box */}
              <div>
                <span className={`text-xs font-semibold block mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Daemon HTTP Response Body:
                </span>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-indigo-300 overflow-x-auto">
                  {JSON.stringify(webhookResult.responseBody, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

