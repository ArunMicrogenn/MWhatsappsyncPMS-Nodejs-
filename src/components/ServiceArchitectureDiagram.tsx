import React from 'react';
import { ServiceConfig } from '../types';

interface ServiceArchitectureDiagramProps {
  config: ServiceConfig;
  darkMode?: boolean;
}

export function ServiceArchitectureDiagram({ config, darkMode }: ServiceArchitectureDiagramProps) {
  const isDark = darkMode;

  // Colors
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedTextColor = isDark ? '#94a3b8' : '#64748b';
  const strokeColor = isDark ? '#334155' : '#e2e8f0';
  
  const boxBgPrimary = isDark ? '#1e293b' : '#f8fafc';
  const boxBgAccent = isDark ? '#064e3b' : '#ecfdf5';
  const boxBorderAccent = isDark ? '#059669' : '#10b981';

  // Dependency parsing
  const dependencies = config.dependencies 
    ? config.dependencies.split(',').map(d => d.trim()).filter(Boolean)
    : [];

  return (
    <div className={`mt-6 p-6 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
        Architecture Flow
      </h3>
      
      <div className="w-full overflow-x-auto overflow-y-hidden">
        <svg 
          viewBox="0 0 800 350" 
          width="100%" 
          height="350" 
          style={{ minWidth: '700px' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
            </marker>
            <marker id="arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={boxBorderAccent} />
            </marker>
          </defs>

          {/* Windows Service Wrapper (Top Level) */}
          <rect x="50" y="20" width="700" height="280" rx="12" fill={bgColor} stroke={strokeColor} strokeWidth="2" strokeDasharray="8 4" />
          <text x="65" y="45" fill={mutedTextColor} fontSize="14" fontWeight="600" fontFamily="sans-serif">
            Windows Environment
          </text>

          {/* Dependencies Box */}
          {dependencies.length > 0 && (
            <g>
              <rect x="80" y="80" width="160" height={40 + (dependencies.length * 25)} rx="6" fill={boxBgPrimary} stroke={strokeColor} strokeWidth="1" />
              <text x="160" y="105" fill={textColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                Dependencies
              </text>
              {dependencies.map((dep, i) => (
                <text key={dep} x="160" y={130 + (i * 25)} fill={mutedTextColor} fontSize="12" fontFamily="sans-serif" textAnchor="middle">
                  {dep}
                </text>
              ))}
              
              {/* Arrow from dependencies to WinSW */}
              <path d={`M 240 ${100 + (dependencies.length * 12)} L 310 ${100 + (dependencies.length * 12)}`} stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrow)" fill="none" />
              <text x="275" y={`${92 + (dependencies.length * 12)}`} fill={mutedTextColor} fontSize="10" fontFamily="sans-serif" textAnchor="middle">Wait</text>
            </g>
          )}

          {/* WinSW / NSSM Service Manager */}
          <rect x="320" y="80" width="160" height="80" rx="8" fill={boxBgPrimary} stroke={strokeColor} strokeWidth="2" />
          <text x="400" y="105" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            Service Manager
          </text>
          <text x="400" y="125" fill={mutedTextColor} fontSize="12" fontFamily="sans-serif" textAnchor="middle">
            (WinSW / NSSM)
          </text>
          <text x="400" y="145" fill={mutedTextColor} fontSize="11" fontFamily="sans-serif" textAnchor="middle">
            {config.serviceName}
          </text>

          {/* PHP Executable */}
          <rect x="560" y="80" width="160" height="80" rx="8" fill={boxBgPrimary} stroke={strokeColor} strokeWidth="2" />
          <text x="640" y="105" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            PHP Runtime
          </text>
          <text x="640" y="130" fill={mutedTextColor} fontSize="11" fontFamily="sans-serif" textAnchor="middle" width="140">
            {config.phpPath.substring(0, 20)}{config.phpPath.length > 20 ? '...' : ''}
          </text>

          {/* Arrow WinSW -> PHP */}
          <path d="M 480 120 L 550 120" stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrow)" fill="none" />
          <text x="515" y="110" fill={mutedTextColor} fontSize="10" fontFamily="sans-serif" textAnchor="middle">Spawns</text>

          {/* Application Script (Daemon) */}
          <rect x="440" y="210" width="280" height="70" rx="8" fill={boxBgAccent} stroke={boxBorderAccent} strokeWidth="2" />
          <text x="580" y="235" fill={textColor} fontSize="14" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
            PHP Daemon Script
          </text>
          <text x="580" y="260" fill={boxBorderAccent} fontSize="11" fontFamily="sans-serif" textAnchor="middle">
            {config.scriptPath.substring(0, 40)}{config.scriptPath.length > 40 ? '...' : ''}
          </text>

          {/* Arrow PHP -> Script */}
          <path d="M 640 160 L 640 200" stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrow)" fill="none" />
          <text x="650" y="185" fill={mutedTextColor} fontSize="10" fontFamily="sans-serif">Executes</text>

          {config.enableCloudUpload && (
            <>
              {/* I/O Operations Box */}
              <rect x="80" y="210" width="280" height="70" rx="6" fill={boxBgPrimary} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 2" />
              <text x="220" y="235" fill={textColor} fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                Cloud Storage (S3) Upload
              </text>
              <text x="220" y="255" fill={mutedTextColor} fontSize="10" fontFamily="sans-serif" textAnchor="middle">
                Bucket: {config.s3Bucket || 'Not Set'}
              </text>
              <text x="220" y="270" fill={mutedTextColor} fontSize="10" fontFamily="sans-serif" textAnchor="middle">
                Path: {config.localPdfPath ? config.localPdfPath.substring(0, 30) : 'None'}
              </text>

              {/* Arrow Script -> I/O */}
              <path d="M 430 245 L 370 245" stroke={boxBorderAccent} strokeWidth="2" markerEnd="url(#arrow-accent)" fill="none" />
              <text x="400" y="235" fill={boxBorderAccent} fontSize="10" fontFamily="sans-serif" textAnchor="middle">Uploads</text>
            </>
          )}

        </svg>
      </div>
    </div>
  );
}
