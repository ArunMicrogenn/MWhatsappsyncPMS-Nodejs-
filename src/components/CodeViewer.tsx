import React, { useState } from 'react';
import { GeneratedFiles } from '../types';
import { FileText, Copy, Check, Download, Terminal, Code, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, Wrench, Shield, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface CodeViewerProps {
  files: GeneratedFiles | null;
  serviceName: string;
  darkMode?: boolean;
}

export function CodeViewer({ files, serviceName, darkMode }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState<keyof GeneratedFiles>('winsw.xml');
  const [copied, setCopied] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [copiedPsCmd, setCopiedPsCmd] = useState(false);

  if (!files) {
    return (
      <div className={`rounded-2xl border shadow-sm p-12 text-center transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200/80 text-slate-700'}`}>
        <Terminal className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-700'}`}>No Service Files Generated Yet</h3>
        <p className={`text-sm mt-1 max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Configure your service settings above and click <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>"Generate Service Package"</span> to create WinSW XML, NSSM batch installer, and PHP daemon scripts.
        </p>
      </div>
    );
  }

  const fileLabels: Record<string, { name: string; icon: string }> = {
    "winsw.xml": { name: "WinSW XML Config", icon: "📄" },
    "install-pm2.bat": { name: "PM2 Installer (No NSSM)", icon: "⚡" },
    "ecosystem.config.js": { name: "PM2 Ecosystem Config", icon: "⚙️" },
    "install-node-windows.bat": { name: "node-windows Installer (.bat)", icon: "🚀" },
    "install-node-windows.js": { name: "node-windows Installer (.js)", icon: "📜" },
    "uninstall-node-windows.bat": { name: "node-windows Uninstaller (.bat)", icon: "🧹" },
    "uninstall-node-windows.js": { name: "node-windows Uninstaller (.js)", icon: "📜" },
    "install-task-scheduler.bat": { name: "Task Scheduler (No NSSM)", icon: "🕒" },
    "run-hidden.vbs": { name: "Silent VBS Launcher", icon: "👻" },
    "install-service.bat": { name: "NSSM Installer (.bat)", icon: "⚡" },
    "install-service.ps1": { name: "PowerShell Installer (.ps1)", icon: "🛡️" },
    "uninstall-service.bat": { name: "NSSM Uninstaller (.bat)", icon: "🗑️" },
    "whatsapp-daemon.js": { name: "WhatsApp Node.js Daemon", icon: "🟢" },
    "whatsapp-daemon.php": { name: "WhatsApp PHP Daemon", icon: "🐘" },
    "package.json": { name: "package.json", icon: "📦" },
    "manage-service.ps1": { name: "PowerShell Manager", icon: "⚙️" },
    "README.md": { name: "Installation Guide", icon: "📖" },
    "health-check.js": { name: "Health Check (Node.js)", icon: "🩺" },
    "health-check.php": { name: "Health Check (PHP)", icon: "🩺" }
  };

  const handleCopy = () => {
    if (files[activeTab]) {
      navigator.clipboard.writeText(files[activeTab] as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const psAutoDownloadCmd = `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile nssm.zip; Expand-Archive nssm.zip -DestinationPath nssm_temp -Force; Copy-Item 'nssm_temp\\nssm-2.24\\win64\\nssm.exe' -Destination . -Force; Remove-Item nssm.zip, nssm_temp -Recurse -Force; Unblock-File .\\nssm.exe; Write-Host 'nssm.exe installed successfully!' -ForegroundColor Green`;

  const copyPsCommand = () => {
    navigator.clipboard.writeText(psAutoDownloadCmd);
    setCopiedPsCmd(true);
    setTimeout(() => setCopiedPsCmd(false), 2000);
  };

  const handleDownloadAll = async () => {
    try {
      const zip = new JSZip();
      
      Object.entries(files).forEach(([filename, content]) => {
        if (content) {
          const name = filename === 'winsw.xml' ? `${serviceName}.xml` : filename;
          zip.file(name, content as string);
        }
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${serviceName}-package.zip`);
    } catch (err) {
      console.error("Failed to generate zip file", err);
      alert("Failed to generate zip file. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {/* NSSM & Path Troubleshooter Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <Wrench className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
                Seeing "Nssm.exe is not specified path" or "not recognized"?
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold">
                  Updated Fix Available
                </span>
              </h4>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Caused by Windows CMD quote parsing, UAC launching in <code>System32</code>, or hidden <code>.exe.exe</code> extensions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setShowTroubleshooter(!showTroubleshooter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40' : 'bg-white hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {showTroubleshooter ? 'Hide Diagnostics' : 'View Fixes & Quick Command'}
              {showTroubleshooter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showTroubleshooter && (
          <div className={`mt-4 pt-4 border-t space-y-3 ${darkMode ? 'border-slate-800 text-slate-300' : 'border-amber-200 text-slate-700'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-amber-200/80'}`}>
                <div className="font-semibold text-rose-500 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Why this error happens in Windows:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-400 text-slate-600">
                  <li><strong>Administrator Directory Reset:</strong> Right-clicking "Run as administrator" causes Windows to open CMD in <code>C:\Windows\System32</code> instead of your folder.</li>
                  <li><strong>CMD Quoting Bug:</strong> Calling <code>"nssm"</code> with quotes in CMD prevents Windows from checking the <code>%PATH%</code> environment variable!</li>
                  <li><strong>Hidden File Extensions:</strong> Windows 10/11 hides file extensions by default, causing users to name the file <code>nssm.exe.exe</code>.</li>
                  <li><strong>Missing Logs Directory:</strong> NSSM fails with "The system cannot find the path specified" if the <code>logs\</code> subfolder doesn't exist.</li>
                </ul>
              </div>

              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-amber-200/80'}`}>
                <div className="font-semibold text-emerald-500 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> How our updated generator solves it:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-400 text-slate-600">
                  <li><strong>Forced Working Directory:</strong> <code>install-service.bat</code> now executes <code>cd /d "%~dp0"</code> immediately.</li>
                  <li><strong>Absolute Binary Resolution:</strong> Resolves the full path to <code>nssm.exe</code> (checking <code>.</code>, <code>win64</code>, <code>nssm.exe.exe</code>, PATH, and C:\nssm).</li>
                  <li><strong>Automatic Logs Folder:</strong> Pre-creates <code>logs\</code> before registering stdout/stderr redirection.</li>
                  <li><strong>PowerShell Alternative:</strong> Added <code>install-service.ps1</code> which is immune to CMD path quirks!</li>
                </ul>
              </div>
            </div>

            {/* Quick 1-liner copy for PowerShell */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-amber-200'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> 1-Click PowerShell Fix (Auto-Download & Place 64-bit nssm.exe in service folder):
                </span>
                <button
                  onClick={copyPsCommand}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 cursor-pointer transition-all ${
                    copiedPsCmd 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {copiedPsCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedPsCmd ? 'Copied!' : 'Copy 1-Liner'}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-emerald-400 overflow-x-auto break-all select-all">
                {psAutoDownloadCmd}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Code Viewer Window */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b gap-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {(Object.keys(files) as Array<keyof GeneratedFiles>).map((key) => {
              if (!files[key]) return null;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === key
                      ? darkMode ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm'
                      : darkMode ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{fileLabels[key]?.icon || '📄'}</span>
                  <span>{fileLabels[key]?.name || key}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                darkMode 
                  ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Package (.zip)
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px]">
          <pre className="p-4 rounded-lg bg-slate-900/80 border border-slate-800/80 overflow-x-auto">
            <code>{files[activeTab] || '// No content available for this tab.'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
