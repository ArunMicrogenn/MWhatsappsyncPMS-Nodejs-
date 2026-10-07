import React, { useState } from 'react';
import { Cloud, Loader2, CheckCircle2, XCircle, HelpCircle, RotateCcw, Sliders, Server, Image, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { ServiceConfig } from '../types';

interface S3ConnectionTesterProps {
  config: ServiceConfig;
  onChange: (config: ServiceConfig) => void;
  darkMode?: boolean;
  setShowS3Help: (show: boolean) => void;
}

export function S3ConnectionTester({ config, onChange, darkMode, setShowS3Help }: S3ConnectionTesterProps) {
  const [isTestingS3, setIsTestingS3] = useState(false);
  const [s3TestResult, setS3TestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  
  const [isTestingVps, setIsTestingVps] = useState(false);
  const [vpsTestResult, setVpsTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const activeProvider = config.mediaUploadType || (config.enableVpsUpload ? 'vps' : config.enableCloudUpload ? 's3' : 'vps');

  const testVpsConnection = async () => {
    setIsTestingVps(true);
    setVpsTestResult(null);
    try {
      const response = await fetch('/api/test-vps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vpsHost: config.vpsHost || 'http://your-vps-ip:5000',
          vpsUploadEndpoint: config.vpsUploadEndpoint || '/api/upload-pdf',
          vpsApiKey: config.vpsApiKey || ''
        })
      });
      const data = await response.json();
      if (data.success) {
        setVpsTestResult({ status: 'success', message: data.message });
      } else {
        setVpsTestResult({ status: 'error', message: data.error });
      }
    } catch (err: any) {
      setVpsTestResult({ status: 'error', message: err.message || 'Failed to connect to VPS.' });
    } finally {
      setIsTestingVps(false);
    }
  };

  const testS3Connection = async () => {
    setIsTestingS3(true);
    setS3TestResult(null);
    try {
      const response = await fetch('/api/test-s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      
      if (data.success) {
        setS3TestResult({ status: 'success', message: data.message });
      } else {
        setS3TestResult({ status: 'error', message: data.error });
      }
    } catch (err: any) {
      setS3TestResult({ status: 'error', message: err.message || 'Network error occurred.' });
    } finally {
      setIsTestingS3(false);
    }
  };

  const handleChange = (key: keyof ServiceConfig, value: string | boolean | number) => {
    onChange({ ...config, [key]: value });
  };

  const getInputClass = (key: keyof ServiceConfig, isPath: boolean = false) => {
    const base = "w-full text-sm px-3 py-2 rounded-lg border transition-all focus:ring-2 focus:ring-offset-1 outline-none";
    const darkClasses = "bg-slate-900 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500/20 placeholder-slate-600";
    const lightClasses = "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder-slate-400";
    return `${base} ${darkMode ? darkClasses : lightClasses}`;
  };

  const labelClass = `block text-xs font-semibold mb-1.5 uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <div className="md:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              <Server className="w-4 h-4 text-emerald-500" /> PDF Copy & URL Dispatch for AISensy
            </h3>
            <button
              onClick={(e) => { e.preventDefault(); setShowS3Help(true); }}
              className={`flex items-center justify-center p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-indigo-400' : 'hover:bg-slate-200 text-slate-500 hover:text-indigo-600'}`}
              title="Help & Setup Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Automatically copy bill PDFs from local PMS directory to your VPS, generate a direct public PDF URL, and attach it to AISensy WhatsApp messages.
          </p>
        </div>

        {/* Media Provider Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`p-1 rounded-xl border flex items-center text-xs font-medium ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...config,
                  mediaUploadType: 'vps',
                  enableVpsUpload: true,
                  enableCloudUpload: false
                });
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeProvider === 'vps'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              VPS Server (Recommended)
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...config,
                  mediaUploadType: 's3',
                  enableCloudUpload: true,
                  enableVpsUpload: false
                });
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeProvider === 's3'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              AWS S3 / Cloudflare R2
            </button>
          </div>
        </div>
      </div>

      {/* 1. VPS Media Server & PDF-to-Image Tab */}
      {activeProvider === 'vps' && (
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                VPS Configuration & PDF-to-Image Converter
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableVpsUpload"
                checked={Boolean(config.enableVpsUpload ?? true)}
                onChange={(e) => handleChange('enableVpsUpload', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="enableVpsUpload" className={`text-xs font-semibold cursor-pointer ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Enable VPS Upload & Image Conversion
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Local PDF Source Directory</label>
                <input
                  type="text"
                  value={config.localPdfPath || ''}
                  onChange={(e) => handleChange('localPdfPath', e.target.value)}
                  className={getInputClass('localPdfPath', true)}
                  placeholder="C:\ftproot\Whatsapp or C:\Bills"
                />
                <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Folder where PMS saves bills (e.g. <code>C:\ftproot\Whatsapp\[HotelCode]\[billno].pdf</code> or <code>[billno].pdf</code>).
                </p>
              </div>

              <div className="flex flex-col justify-end pb-1">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="syncRecursiveVps"
                    checked={Boolean(config.syncRecursive)}
                    onChange={(e) => handleChange('syncRecursive', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="syncRecursiveVps" className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Recursive Subdirectory Search
                  </label>
                </div>
                {config.syncRecursive && (
                  <div>
                    <input
                      type="text"
                      value={config.excludeExtensions || ''}
                      onChange={(e) => handleChange('excludeExtensions', e.target.value)}
                      className={getInputClass('excludeExtensions')}
                      placeholder="Exclude extensions (e.g. .tmp,.log)"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>VPS Host URL (IP or Domain)</label>
              <input
                type="text"
                value={config.vpsHost ?? 'http://your-vps-ip:5000'}
                onChange={(e) => handleChange('vpsHost', e.target.value)}
                className={getInputClass('vpsHost')}
                placeholder="http://123.45.67.89:5000 or https://vps.hotelierhms.com"
              />
              <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Address of your VPS where <code>vps-server.js</code> or <code>vps-upload.php</code> is hosted.
              </p>
            </div>

            <div>
              <label className={labelClass}>Upload & Convert Endpoint</label>
              <input
                type="text"
                value={config.vpsUploadEndpoint ?? '/api/upload-pdf'}
                onChange={(e) => handleChange('vpsUploadEndpoint', e.target.value)}
                className={getInputClass('vpsUploadEndpoint')}
                placeholder="/api/upload-pdf or /upload-pdf.php"
              />
              <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Endpoint that receives the local PDF, renders it to image, and outputs public Image URL.
              </p>
            </div>

            <div>
              <label className={labelClass}>VPS API Key / Secret Token (Optional)</label>
              <input
                type="password"
                value={config.vpsApiKey || ''}
                onChange={(e) => handleChange('vpsApiKey', e.target.value)}
                className={getInputClass('vpsApiKey')}
                placeholder="Leave blank for open LAN/VPS or enter bearer token"
              />
            </div>

            <div>
              <label className={labelClass}>Target Image Format</label>
              <select
                value={config.vpsImageFormat || 'png'}
                onChange={(e) => handleChange('vpsImageFormat', e.target.value as 'png' | 'jpg')}
                className={getInputClass('vpsImageFormat')}
              >
                <option value="png" className={darkMode ? 'bg-slate-900 text-white' : ''}>PNG (High Quality, Crisp Text)</option>
                <option value="jpg" className={darkMode ? 'bg-slate-900 text-white' : ''}>JPG / JPEG (Small File Size)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Public Image Base URL (Optional Override)</label>
              <input
                type="text"
                value={config.vpsPublicUrl || ''}
                onChange={(e) => handleChange('vpsPublicUrl', e.target.value)}
                className={getInputClass('vpsPublicUrl')}
                placeholder="https://media.hotelierhms.com/images (Leave blank to use VPS Host URL)"
              />
              <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                If behind an Nginx reverse proxy or domain, specify the public image URL prefix here.
              </p>
            </div>

            {/* Workflow Diagram Box */}
            <div className={`md:col-span-2 p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              darkMode ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Automated AISensy Direct PDF Workflow:</span>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] opacity-90">
                  <li><strong>Local Read:</strong> Daemon locates <code>billno.pdf</code> in local PMS folder.</li>
                  <li><strong>VPS Transfer:</strong> Copies PDF directly to VPS endpoint via HTTP POST.</li>
                  <li><strong>Instant URL:</strong> VPS saves PDF to public directory and returns public PDF URL (No image conversion needed).</li>
                  <li><strong>AISensy Push:</strong> Daemon sends AISensy payload with <code>media: &#123; url: pdfUrl, filename: 'billno.pdf' &#125;</code>.</li>
                  <li><strong>Guest WhatsApp:</strong> Guest receives the WhatsApp message with the authentic PDF invoice attached!</li>
                </ol>
              </div>
            </div>

            {/* Test VPS Button */}
            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={testVpsConnection}
                disabled={isTestingVps || !config.vpsHost}
                className={`text-xs px-3.5 py-2 rounded-lg border font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode
                    ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 shadow-xs'
                }`}
              >
                {isTestingVps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                Test VPS Connection & Endpoint
              </button>

              {vpsTestResult && (
                <div className={`text-xs flex items-center gap-1.5 font-medium ${
                  vpsTestResult.status === 'success' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {vpsTestResult.status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span>{vpsTestResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. S3 / Cloudflare R2 Tab */}
      {activeProvider === 's3' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Local PDF Source Directory</label>
              <input
                type="text"
                value={config.localPdfPath || ''}
                onChange={(e) => handleChange('localPdfPath', e.target.value)}
                className={getInputClass('localPdfPath', true)}
                placeholder="C:\ftproot\Whatsapp"
              />
            </div>
            
            <div className="flex flex-col justify-end pb-1">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="syncRecursive"
                  checked={Boolean(config.syncRecursive)}
                  onChange={(e) => handleChange('syncRecursive', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="syncRecursive" className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Recursive Folder Search
                </label>
              </div>
              {config.syncRecursive && (
                <div>
                  <input
                    type="text"
                    value={config.excludeExtensions || ''}
                    onChange={(e) => handleChange('excludeExtensions', e.target.value)}
                    className={getInputClass('excludeExtensions')}
                    placeholder="Exclude extensions (e.g. .tmp,.log)"
                  />
                  <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    Comma-separated list of extensions to ignore.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>S3 Bucket Name</label>
            <input
              type="text"
              value={config.s3Bucket || ''}
              onChange={(e) => handleChange('s3Bucket', e.target.value)}
              className={getInputClass('s3Bucket')}
              placeholder="my-hotel-pdfs"
            />
          </div>

          <div>
            <label className={labelClass}>S3 Region</label>
            <input
              type="text"
              value={config.s3Region || ''}
              onChange={(e) => handleChange('s3Region', e.target.value)}
              className={getInputClass('s3Region')}
              placeholder="us-east-1"
            />
          </div>

          <div>
            <label className={labelClass}>S3 Endpoint (Optional)</label>
            <input
              type="text"
              value={config.s3Endpoint || ''}
              onChange={(e) => handleChange('s3Endpoint', e.target.value)}
              className={getInputClass('s3Endpoint')}
              placeholder="https://s3.us-east-1.amazonaws.com"
            />
          </div>

          <div>
            <label className={labelClass}>S3 Access Key</label>
            <input
              type="text"
              value={config.s3AccessKey || ''}
              onChange={(e) => handleChange('s3AccessKey', e.target.value)}
              className={getInputClass('s3AccessKey')}
            />
          </div>

          <div>
            <label className={labelClass}>S3 Secret Key</label>
            <input
              type="password"
              value={config.s3SecretKey || ''}
              onChange={(e) => handleChange('s3SecretKey', e.target.value)}
              className={getInputClass('s3SecretKey')}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Public Domain / Base URL (Optional)</label>
            <input
              type="text"
              value={config.s3PublicUrl || ''}
              onChange={(e) => handleChange('s3PublicUrl', e.target.value)}
              className={getInputClass('s3PublicUrl')}
              placeholder="https://pub-xxxx.r2.dev (Used if bucket is not natively public)"
            />
          </div>

          <div className="md:col-span-2 p-3 rounded bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="s3PresignedUrl"
                checked={Boolean(config.s3PresignedUrl)}
                onChange={(e) => handleChange('s3PresignedUrl', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="s3PresignedUrl" className={`text-sm font-medium ${darkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                Generate Presigned URLs (Temporary Public Access)
              </label>
            </div>
            {config.s3PresignedUrl && (
              <div className="ml-6">
                <label className={labelClass}>URL Expiry Time (seconds)</label>
                <input
                  type="number"
                  value={config.s3PresignedExpiry || ''}
                  onChange={(e) => handleChange('s3PresignedExpiry', e.target.value)}
                  className={getInputClass('s3PresignedExpiry')}
                  placeholder="604800"
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={testS3Connection}
                disabled={isTestingS3 || !config.s3Bucket || !config.s3AccessKey || !config.s3SecretKey}
                className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300' : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}
                title="Performs a dry-run upload to verify write permissions"
              >
                {isTestingS3 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />} 
                Test Upload Permissions
              </button>
              {s3TestResult && (
                <div className={`text-xs flex items-center gap-1.5 ${s3TestResult.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {s3TestResult.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {s3TestResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
