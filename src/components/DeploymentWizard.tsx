import React, { useState } from 'react';
import { ServiceConfig } from '../types';
import { Terminal, Shield, Copy, Check, Download, CheckCircle2, Circle, ListChecks } from 'lucide-react';

interface DeploymentWizardProps {
  config: ServiceConfig;
  darkMode?: boolean;
}

export function DeploymentWizard({ config, darkMode }: DeploymentWizardProps) {
  const [copied, setCopied] = useState(false);

  const getPowerShellScript = () => {
    return `# Require Administrator Privileges
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Administrator privileges are required. Elevating..."
    Start-Process PowerShell -Verb RunAs "-NoProfile -ExecutionPolicy Bypass -Command \`"cd '$pwd'; & '$PSCommandPath'\`"";
    exit
}

$ServiceName = "${config.serviceName}"
$WorkDir = "${config.workingDirectory}"
$WinSWExe = Join-Path -Path $WorkDir -ChildPath "winsw.exe"
$WinSWXml = Join-Path -Path $WorkDir -ChildPath "winsw.xml"

Write-Host "Deploying $ServiceName..." -ForegroundColor Cyan

# 1. Check if WinSW exists
if (!(Test-Path $WinSWExe)) {
    Write-Error "WinSW.exe not found at $WinSWExe"
    Write-Host "Please download WinSW (e.g., WinSW-x64.exe), rename it to winsw.exe, and place it in $WorkDir" -ForegroundColor Yellow
    exit
}

# 2. Check if XML config exists
if (!(Test-Path $WinSWXml)) {
    Write-Error "winsw.xml not found at $WinSWXml"
    exit
}

# 3. Stop and uninstall existing service if present
$serviceStatus = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($serviceStatus) {
    Write-Host "Service $ServiceName already exists. Stopping and uninstalling..." -ForegroundColor Yellow
    if ($serviceStatus.Status -eq 'Running') {
        & $WinSWExe stop
        Start-Sleep -Seconds 2
    }
    & $WinSWExe uninstall
    Start-Sleep -Seconds 2
}

# 4. Install the new service
Write-Host "Installing service $ServiceName..." -ForegroundColor Cyan
& $WinSWExe install

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install the service."
    exit
}

# 5. Start the service
Write-Host "Starting service $ServiceName..." -ForegroundColor Cyan
& $WinSWExe start

if ($LASTEXITCODE -eq 0) {
    Write-Host "Service $ServiceName installed and started successfully!" -ForegroundColor Green
} else {
    Write-Error "Failed to start the service."
}
`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getPowerShellScript());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([getPowerShellScript()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Install-${config.serviceName}.ps1`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRegScript = () => {
    const startValue = config.startMode === 'Automatic' || config.startMode === 'Delayed' ? '00000002' : '00000003';
    const escapedPath = config.workingDirectory.replace(/\\/g, '\\\\') + '\\\\winsw.exe';
    
    return `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\${config.serviceName}]
"DisplayName"="${config.displayName}"
"Description"="${config.description}"
"ObjectName"="LocalSystem"
"Start"=dword:${startValue}
"Type"=dword:00000010
"ErrorControl"=dword:00000001
"ImagePath"="${escapedPath}"`;
  };

  const handleDownloadReg = () => {
    const blob = new Blob([getRegScript()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup-${config.serviceName}.reg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadS3Creds = () => {
    const creds = {
      AWS_ACCESS_KEY_ID: config.s3AccessKey,
      AWS_SECRET_ACCESS_KEY: config.s3SecretKey,
      AWS_DEFAULT_REGION: config.s3Region,
      AWS_BUCKET: config.s3Bucket,
      AWS_ENDPOINT_URL_S3: config.s3Endpoint || undefined,
      PUBLIC_URL: config.s3PublicUrl || undefined
    };
    const blob = new Blob([JSON.stringify(creds, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `s3-credentials.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const checklistItems = [
    {
      id: 'paths',
      label: 'Paths validated',
      description: 'Directory and executable links',
      completed: Boolean(config.phpPath && config.scriptPath && config.workingDirectory),
    },
    {
      id: 'account',
      label: 'Service account defined',
      description: 'System privileges mapped',
      completed: Boolean(config.serviceName && config.displayName),
    },
    {
      id: 'admin',
      label: 'Admin privileges checked',
      description: 'Deployment script self-elevates',
      completed: true, 
    },
    {
      id: 'recovery',
      label: 'Recovery policies set',
      description: 'Daemon restart actions',
      completed: Boolean(config.onFailure),
    }
  ];

  return (
    <div className={`rounded-2xl border shadow-sm p-6 sm:p-8 transition-colors duration-200 flex flex-col lg:flex-row gap-8 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-slate-800'}`}>
      
      {/* Main Content Area */}
      <div className="flex-1">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b mb-6 gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Terminal className="w-5 h-5 text-emerald-600" />
              Automated Deployment
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Run this PowerShell script to automatically install and start your WinSW service.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {config.enableCloudUpload && (
              <button
                onClick={handleDownloadS3Creds}
                className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Download S3 credentials in JSON format"
              >
                <Download className="w-4 h-4 text-slate-400" />
                S3 Creds
              </button>
            )}
            <button
              onClick={handleDownloadReg}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Download className="w-4 h-4 text-slate-400" />
              Backup .reg
            </button>
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download .ps1
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-start gap-3 mb-6 ${
          darkMode ? 'bg-amber-950/30 border-amber-900/50 text-amber-200' : 'bg-amber-50 border-amber-200/60 text-amber-800'
        }`}>
          <Shield className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Administrative Privileges Required</p>
            <p className="opacity-90">
              This script contains self-elevating code. If you run it as a standard user, it will prompt for Administrator credentials via UAC before installing the service.
            </p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-slate-900 rounded-xl opacity-5"></div>
          <pre className={`relative p-6 rounded-xl overflow-x-auto text-sm font-mono border ${
            darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <code>{getPowerShellScript()}</code>
          </pre>
        </div>
      </div>

      {/* Sidebar Checklist */}
      <div className={`lg:w-80 shrink-0 p-5 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200/50'}`}>
        <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <ListChecks className="w-4 h-4 text-emerald-500" />
          Deployment Checklist
        </h3>
        <ul className="space-y-4">
          {checklistItems.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className={`w-5 h-5 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${item.completed ? (darkMode ? 'text-slate-200' : 'text-slate-800') : (darkMode ? 'text-slate-500' : 'text-slate-400')}`}>
                  {item.label}
                </p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
