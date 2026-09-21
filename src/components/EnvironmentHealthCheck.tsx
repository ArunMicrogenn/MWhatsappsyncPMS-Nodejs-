import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  HardDrive, 
  Cpu, 
  ShieldAlert, 
  ExternalLink, 
  Layers, 
  Check, 
  Copy,
  Info,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { ServiceConfig } from '../types';

interface EnvironmentHealthCheckProps {
  config?: ServiceConfig;
  darkMode?: boolean;
  onSelectDriver?: (driver: string) => void;
}

interface DetectedDriver {
  name: string;
  architecture?: string;
  isSqlServerDriver: boolean;
}

interface EnvironmentHealthData {
  success: boolean;
  driverExists: boolean;
  requestedDriver: string;
  matchedDriver?: DetectedDriver | null;
  detectedDrivers: DetectedDriver[];
  hostInfo: {
    platform: string;
    arch: string;
    hostname: string;
    isWindows: boolean;
    registryQueried: boolean;
    testedAt: string;
  };
  warningMessage?: string | null;
  resolutionSteps?: string[];
  error?: string;
}

export function EnvironmentHealthCheck({ config, darkMode, onSelectDriver }: EnvironmentHealthCheckProps) {
  const currentDriver = config?.odbcDriver || '{SQL Server Native Client 11.0}';
  const [testingDriver, setTestingDriver] = useState<string>(currentDriver);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<EnvironmentHealthData | null>(null);
  const [copiedDriver, setCopiedDriver] = useState<string | null>(null);

  const runCheck = async (driverToCheck?: string) => {
    const targetDriver = driverToCheck !== undefined ? driverToCheck : testingDriver;
    setIsLoading(true);
    try {
      const res = await fetch('/api/environment-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ odbcDriver: targetDriver })
      });
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      console.error("Environment health check failed:", err);
      setData({
        success: false,
        driverExists: false,
        requestedDriver: targetDriver,
        detectedDrivers: [],
        hostInfo: {
          platform: 'Unknown',
          arch: 'x64',
          hostname: 'host',
          isWindows: false,
          registryQueried: false,
          testedAt: new Date().toLocaleTimeString()
        },
        error: err.message || 'Failed to reach environment health API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount or when driver changes in parent
  useEffect(() => {
    setTestingDriver(currentDriver);
    runCheck(currentDriver);
  }, [currentDriver]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDriver(text);
    setTimeout(() => setCopiedDriver(null), 2000);
  };

  const isDriverMissing = data && !data.driverExists;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Database className="w-5 h-5" />
              </div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Host Environment & ODBC Health Check
              </h2>
            </div>
            <p className={`text-xs mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Verifies whether the host machine contains the configured ODBC SQL Server driver in its system registry before deploying your Windows service.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runCheck()}
              disabled={isLoading}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
              {isLoading ? 'Scanning Registry...' : 'Re-scan Host Drivers'}
            </button>
          </div>
        </div>

        {/* Live Status Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/70'}`}>
            <span className={`text-[11px] font-medium block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Configured Driver
            </span>
            <span className={`text-xs font-bold font-mono truncate block mt-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`} title={testingDriver}>
              {testingDriver}
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/70'}`}>
            <span className={`text-[11px] font-medium block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Driver Status
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              {isLoading ? (
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                </span>
              ) : data?.driverExists ? (
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Detected & Ready
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Driver Missing!
                </span>
              )}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/70'}`}>
            <span className={`text-[11px] font-medium block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Host Machine OS
            </span>
            <span className={`text-xs font-mono font-medium block mt-1 truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {data?.hostInfo.platform || 'Scanning...'} ({data?.hostInfo.arch || 'x64'})
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/70'}`}>
            <span className={`text-[11px] font-medium block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Last Scanned
            </span>
            <span className={`text-xs font-mono block mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {data?.hostInfo.testedAt || 'Just now'}
            </span>
          </div>
        </div>

        {/* Critical Warning Alert Box (when missing) */}
        {isDriverMissing && (
          <div className={`mt-6 p-4 rounded-xl border flex flex-col md:flex-row items-start gap-3.5 transition-all ${
            darkMode ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-rose-600 dark:text-rose-400">
                  Host Machine Warning: ODBC Driver Missing
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-500">
                  Service Crash Risk
                </span>
              </div>
              <p className="leading-relaxed">
                {data.warningMessage}
              </p>

              {data.resolutionSteps && data.resolutionSteps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-rose-200/50 dark:border-rose-900/50 space-y-1.5">
                  <span className="font-bold block text-rose-700 dark:text-rose-300">
                    Recommended Fixes to avoid service crash:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    {data.resolutionSteps.map((step, idx) => (
                      <li key={idx} className="leading-normal">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Confirmation (when exists) */}
        {data && data.driverExists && (
          <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${
            darkMode ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold block text-emerald-600 dark:text-emerald-400">
                ODBC Driver Match Verified
              </span>
              <span>
                The specified driver <code>{data.requestedDriver}</code> is present and registered in the host ODBC registry ({data.matchedDriver?.architecture || '64-bit'}). Your PHP daemon will be able to invoke <code>odbc_connect()</code> without driver lookup errors.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detected Host Drivers & Switcher Card */}
      <div className={`p-6 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              Available ODBC Drivers on Host ({data?.detectedDrivers.length || 0})
            </h3>
          </div>
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Click any detected driver to use it in your service config
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.detectedDrivers.map((driver, index) => {
            const isCurrentlySelected = testingDriver.toLowerCase().replace(/[{}]/g, '') === driver.name.toLowerCase().replace(/[{}]/g, '');

            return (
              <div
                key={index}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrentlySelected
                    ? darkMode
                      ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40 text-white'
                      : 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200 text-indigo-950'
                    : darkMode
                      ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold truncate block">
                      {driver.name}
                    </span>
                    {driver.isSqlServerDriver && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-emerald-500/20 text-emerald-500 shrink-0">
                        SQL Server
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] block mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Architecture: {driver.architecture || '64-bit'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyToClipboard(driver.name)}
                    title="Copy driver string"
                    className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {copiedDriver === driver.name ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setTestingDriver(driver.name);
                      if (onSelectDriver) {
                        onSelectDriver(driver.name);
                      }
                      runCheck(driver.name);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      isCurrentlySelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : darkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {isCurrentlySelected ? (
                      <>
                        <Check className="w-3 h-3 text-white" /> Selected
                      </>
                    ) : (
                      <>
                        Use Driver <ChevronRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Diagnostic Testing Bar */}
        <div className={`mt-6 pt-5 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <label className={`text-xs font-semibold block mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Test Custom Driver String Against Host Registry:
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={testingDriver}
              onChange={(e) => setTestingDriver(e.target.value)}
              placeholder="{ODBC Driver 17 for SQL Server}"
              className={`flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              onClick={() => {
                if (onSelectDriver) {
                  onSelectDriver(testingDriver);
                }
                runCheck(testingDriver);
              }}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              Test & Apply
            </button>
          </div>
        </div>

        {/* NSSM Executable & Path Resolver */}
        <div className={`mt-6 pt-5 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-amber-500" />
            <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-amber-400' : 'text-amber-800'}`}>
              NSSM Service Manager & Path Diagnostic
            </h4>
          </div>
          <p className={`text-xs mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            If you encounter <code className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono">Nssm.exe is not specified path</code> or <code className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono">The system cannot find the path specified</code>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="font-semibold mb-1 text-slate-200 dark:text-slate-200">1. Windows UAC Directory Shift</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When right-clicking "Run as Administrator", Windows resets the current directory to <code>C:\Windows\System32</code>. Our updated script forces <code>cd /d "%~dp0"</code> immediately to anchor to the script folder.
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="font-semibold mb-1 text-slate-200 dark:text-slate-200">2. Hidden Extension (.exe.exe)</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Windows often saves downloaded files as <code>nssm.exe.exe</code> when file extensions are hidden. The script now inspects <code>nssm.exe</code>, <code>win64\nssm.exe</code>, and <code>nssm.exe.exe</code>.
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-amber-50/50 border-amber-200'}`}>
            <div className="text-[11px] font-semibold text-amber-500 mb-1 flex items-center justify-between">
              <span>Quick PowerShell Fix (Download 64-bit nssm.exe to Current Folder):</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile nssm.zip; Expand-Archive nssm.zip -DestinationPath nssm_temp -Force; Copy-Item 'nssm_temp\\nssm-2.24\\win64\\nssm.exe' -Destination . -Force; Remove-Item nssm.zip, nssm_temp -Recurse -Force; Unblock-File .\\nssm.exe`);
                  setCopiedDriver('nssm-cmd');
                  setTimeout(() => setCopiedDriver(null), 2000);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 cursor-pointer ${
                  copiedDriver === 'nssm-cmd' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                {copiedDriver === 'nssm-cmd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedDriver === 'nssm-cmd' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <code className="text-[11px] font-mono text-emerald-400 break-all select-all block">
              powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile nssm.zip; Expand-Archive nssm.zip -DestinationPath nssm_temp -Force; Copy-Item 'nssm_temp\nssm-2.24\win64\nssm.exe' -Destination . -Force; Remove-Item nssm.zip, nssm_temp -Recurse -Force; Unblock-File .\nssm.exe"
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
