import React, { useState } from 'react';
import { Cloud, Loader2, CheckCircle2, XCircle, HelpCircle, RotateCcw, Sliders } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              <Cloud className="w-4 h-4 text-slate-500" /> Cloud Storage PDF Upload (S3 API)
            </h3>
            <button
              onClick={(e) => { e.preventDefault(); setShowS3Help(true); }}
              className={`flex items-center justify-center p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-indigo-400' : 'hover:bg-slate-200 text-slate-500 hover:text-indigo-600'}`}
              title="How to get S3 API keys"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Automatically upload local PDFs to an S3-compatible cloud bucket (AWS S3, Cloudflare R2, DigitalOcean Spaces) to generate a public URL for AISensy.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
               // Let's trigger the file input inside ConfigWizard
               const fileInput = document.getElementById('env-upload-input');
               if (fileInput) fileInput.click();
            }}
            className={`text-xs px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}`}
            title="Auto-fill credentials from a .env or AWS credentials file"
          >
            <Cloud className="w-3.5 h-3.5" /> Import Config
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableCloudUpload"
              checked={Boolean(config.enableCloudUpload)}
              onChange={(e) => handleChange('enableCloudUpload', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="enableCloudUpload" className={`text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Enable Upload</label>
          </div>
        </div>
      </div>

      {config.enableCloudUpload && (
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
            <p className={`text-[11px] mt-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              If provided, the generated URL will use this base instead of the API endpoint. E.g. Cloudflare R2 Public Dev URL.
            </p>
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
                <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  Default: 604800 (7 days). Maximum is typically 7 days for AWS Signature V4.
                </p>
              </div>
            )}
          </div>

          {/* Dedicated S3 Upload Failure & Retry Strategy Section */}
          <div className={`md:col-span-2 p-4 rounded-xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-500" />
                <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Automatic Retry & Exponential Backoff Strategy
                </h4>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                (config.s3MaxRetries ?? 3) > 0 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {(config.s3MaxRetries ?? 3) > 0 ? `${config.s3MaxRetries ?? 3} Retries Active` : 'Retries Disabled'}
              </span>
            </div>
            
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Protect against transient network glitches, S3 rate limits (HTTP 503 SlowDown), and timeout spikes by automatically retrying failed PDF uploads with exponential backoff delays.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Max Retry Attempts</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={config.s3MaxRetries ?? 3}
                  onChange={(e) => handleChange('s3MaxRetries', Math.max(0, parseInt(e.target.value) || 0))}
                  className={getInputClass('s3MaxRetries')}
                  placeholder="3"
                />
                <span className={`text-[10px] block mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Default: 3 attempts (0 to disable)
                </span>
              </div>

              <div>
                <label className={labelClass}>Initial Backoff Delay (ms)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={config.s3InitialBackoffMs ?? 1000}
                  onChange={(e) => handleChange('s3InitialBackoffMs', Math.max(100, parseInt(e.target.value) || 1000))}
                  className={getInputClass('s3InitialBackoffMs')}
                  placeholder="1000"
                />
                <span className={`text-[10px] block mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  First retry delay (e.g. 1000ms = 1s)
                </span>
              </div>

              <div>
                <label className={labelClass}>Backoff Multiplier</label>
                <select
                  value={config.s3BackoffMultiplier ?? 2}
                  onChange={(e) => handleChange('s3BackoffMultiplier', parseFloat(e.target.value) || 2)}
                  className={getInputClass('s3BackoffMultiplier')}
                >
                  <option value="1.5">1.5x (Gentle growth)</option>
                  <option value="2">2.0x (Standard exponential)</option>
                  <option value="3">3.0x (Aggressive spacing)</option>
                </select>
                <span className={`text-[10px] block mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Multiplier per retry step
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="s3RetryBackoff"
                  checked={config.s3RetryBackoff ?? true}
                  onChange={(e) => handleChange('s3RetryBackoff', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="s3RetryBackoff" className={`text-xs font-medium cursor-pointer ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Enable Exponential Jitter / Backoff (Recommended)
                </label>
              </div>

              {(config.s3MaxRetries ?? 3) > 0 && (
                <div className={`text-[11px] font-mono ${darkMode ? 'text-emerald-400/90' : 'text-emerald-700'}`}>
                  Delay sequence: {config.s3RetryBackoff ?? true
                    ? Array.from({ length: Math.min(config.s3MaxRetries ?? 3, 4) })
                        .map((_, i) => `${((config.s3InitialBackoffMs ?? 1000) * Math.pow(config.s3BackoffMultiplier ?? 2, i)) / 1000}s`)
                        .join(' → ')
                    : `${((config.s3InitialBackoffMs ?? 1000) / 1000)}s fixed`}
                </div>
              )}
            </div>
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
