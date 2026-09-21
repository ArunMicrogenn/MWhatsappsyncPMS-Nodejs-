import React, { useState, useEffect } from 'react';
import { ServiceConfig, GeneratedFiles } from './types';
import { ConfigWizard } from './components/ConfigWizard';
import { CodeViewer } from './components/CodeViewer';
import { ServiceSimulator } from './components/ServiceSimulator';
import { AiCopilot } from './components/AiCopilot';
import { DeploymentWizard } from './components/DeploymentWizard';
import { LogMonitor } from './components/LogMonitor';
import { QuickActions } from './components/QuickActions';
import { MessageSquare, Settings, Activity, Bot, Terminal, ShieldCheck, Sun, Moon, ScrollText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'config' | 'simulator' | 'copilot' | 'deployment' | 'logs'>('config');
  const [darkMode, setDarkMode] = useState(false);
  const [config, setConfig] = useState<ServiceConfig>({
    serviceName: 'WhatsAppSyncService',
    displayName: 'WhatsApp Node.js Sync Daemon',
    description: 'Background Windows Service for syncing WhatsApp webhooks and queues using Node.js',
    runtime: 'node',
    nodePath: 'C:\\Program Files\\nodejs\\node.exe',
    phpPath: 'C:\\php\\php.exe',
    scriptPath: 'C:\\whatsapp-sync\\whatsapp-daemon.js',
    workingDirectory: 'C:\\whatsapp-sync',
    enableCloudUpload: false,
    localPdfPath: 'C:\\ftproot\\Whatsapp',
    s3Endpoint: '',
    s3Bucket: '',
    s3Region: 'auto',
    s3AccessKey: '',
    s3SecretKey: '',
    s3PublicUrl: '',
    s3PresignedUrl: false,
    s3PresignedExpiry: '604800',
    s3MaxRetries: 3,
    s3RetryBackoff: true,
    s3InitialBackoffMs: 1000,
    s3BackoffMultiplier: 2,
    logMode: 'roll-by-size',
    startMode: 'Automatic',
    onFailure: 'restart',
    delaySeconds: '10',
    dependencies: 'MSSQLSERVER',
    odbcDriver: '{SQL Server Native Client 11.0}'
  });

  const [files, setFiles] = useState<GeneratedFiles | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-wrapper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate on initial mount
  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-800'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-30 shadow-xs transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-base font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>WhatsApp PHP Windows Service Suite</h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Transform PHP WhatsApp sync daemons into enterprise Windows Services</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'config'
                    ? darkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-emerald-600" />
                Config & Generator
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'simulator'
                    ? darkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                Service Simulator
              </button>
              <button
                onClick={() => setActiveTab('deployment')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'deployment'
                    ? darkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                Deployment
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'logs'
                    ? darkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5 text-emerald-600" />
                Log Monitor
              </button>
              <button
                onClick={() => setActiveTab('copilot')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'copilot'
                    ? darkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                AI Copilot
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'config' && (
          <div className="space-y-8">
            <ConfigWizard
              config={config}
              onChange={setConfig}
              onGenerate={handleGenerate}
              loading={loading}
              darkMode={darkMode}
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Generated Deployment Artifacts</h3>
                <span className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-3 py-1 rounded-full font-medium border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> WinSW & NSSM Ready
                </span>
              </div>
              <CodeViewer files={files} serviceName={config.serviceName} darkMode={darkMode} />
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          <DeploymentWizard config={config} darkMode={darkMode} />
        )}

        {activeTab === 'simulator' && (
          <ServiceSimulator 
            serviceName={config.serviceName} 
            config={config} 
            darkMode={darkMode} 
            onUpdateConfig={(newConfig) => setConfig(newConfig)}
          />
        )}

        {activeTab === 'logs' && (
          <LogMonitor serviceName={config.serviceName} darkMode={darkMode} />
        )}

        {activeTab === 'copilot' && (
          <AiCopilot serviceName={config.serviceName} darkMode={darkMode} />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
        WhatsApp PHP Windows Service Suite &bull; Built for robust background daemon execution
      </footer>
      <QuickActions serviceName={config.serviceName} darkMode={darkMode} />
    </div>
  );
}
