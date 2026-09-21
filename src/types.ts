export interface ServiceConfig {
  serviceName: string;
  displayName: string;
  description: string;
  runtime?: 'node' | 'php';
  nodePath?: string;
  phpPath?: string;
  scriptPath: string;
  workingDirectory: string;
  enableCloudUpload: boolean;
  localPdfPath: string;
  syncRecursive?: boolean;
  excludeExtensions?: string;
  s3Endpoint: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3PublicUrl: string;
  s3PresignedUrl: boolean;
  s3PresignedExpiry: string;
  // S3 Automatic Retry Strategy
  s3MaxRetries?: number;
  s3RetryBackoff?: boolean;
  s3InitialBackoffMs?: number;
  s3BackoffMultiplier?: number;
  logMode: string;
  startMode: string;
  onFailure: string;
  delaySeconds: string;
  dependencies: string;
  generateHealthCheck?: boolean;
  odbcDriver?: string;
}

export interface GeneratedFiles {
  "winsw.xml": string;
  "install-service.bat": string;
  "install-service.ps1"?: string;
  "uninstall-service.bat": string;
  "install-task-scheduler.bat"?: string;
  "install-pm2.bat"?: string;
  "ecosystem.config.js"?: string;
  "run-hidden.vbs"?: string;
  "whatsapp-daemon.js"?: string;
  "whatsapp-daemon.php"?: string;
  "package.json"?: string;
  "install-node-windows.js"?: string;
  "uninstall-node-windows.js"?: string;
  "manage-service.ps1": string;
  "README.md": string;
  "health-check.js"?: string;
  "health-check.php"?: string;
  [key: string]: string | undefined;
}

