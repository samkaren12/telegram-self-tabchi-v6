import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { exec, execSync } from "child_process";

export interface SslRenewalLog {
  id: string;
  timestamp: string;
  action: "check" | "renew" | "generate" | "error";
  status: "success" | "warning" | "error" | "info";
  message: string;
  daysRemaining?: number;
}

export interface SslStatus {
  enabled: boolean;
  type: "letsencrypt_nip" | "self_signed" | "custom" | "none";
  serverIp: string;
  domain?: string;
  certPath?: string;
  keyPath?: string;
  expiresAt?: string;
  daysRemaining?: number;
  autoRenew: boolean;
  checkIntervalHours: number;
  thresholdDays: number;
  lastRenewCheck?: string;
  lastRenewResult?: string;
  nextScheduledCheck?: string;
  httpsPort: number;
  detectedIp?: string;
  isDaemonRunning: boolean;
  history: SslRenewalLog[];
}

const SSL_DATA_DIR = path.join(process.cwd(), "data", "ssl");
const SSL_CONFIG_FILE = path.join(SSL_DATA_DIR, "ssl-config.json");
const SSL_LOG_FILE = path.join(SSL_DATA_DIR, "ssl-renewal.log");

let autoRenewTimer: NodeJS.Timeout | null = null;
let nextScheduledTime = 0;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function appendSslLog(log: Omit<SslRenewalLog, "id" | "timestamp">) {
  ensureDir(SSL_DATA_DIR);
  const entry: SslRenewalLog = {
    id: `ssl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...log,
  };

  try {
    let logs: SslRenewalLog[] = [];
    if (fs.existsSync(SSL_LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(SSL_LOG_FILE, "utf-8"));
    }
    logs.unshift(entry);
    // Keep last 40 logs
    if (logs.length > 40) logs = logs.slice(0, 40);
    fs.writeFileSync(SSL_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (_) {}

  return entry;
}

export function getSslLogs(): SslRenewalLog[] {
  ensureDir(SSL_DATA_DIR);
  if (fs.existsSync(SSL_LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SSL_LOG_FILE, "utf-8"));
    } catch (_) {}
  }
  return [];
}

/**
 * Detect the public IP of the current host/VPS
 */
export async function getPublicServerIp(): Promise<string> {
  const providers = [
    "https://api.ipify.org",
    "https://icanhazip.com",
    "https://ifconfig.me/ip",
    "https://checkip.amazonaws.com",
  ];

  for (const url of providers) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const text = (await res.text()).trim();
        if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(text)) {
          return text;
        }
      }
    } catch (_) {}
  }

  // Fallback to local network interface
  try {
    const os = await import("os");
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (_) {}

  return "127.0.0.1";
}

/**
 * Load current SSL configuration
 */
export function getSslConfig(): SslStatus {
  ensureDir(SSL_DATA_DIR);
  let status: SslStatus = {
    enabled: false,
    type: "none",
    serverIp: "127.0.0.1",
    autoRenew: true,
    checkIntervalHours: 6,
    thresholdDays: 30,
    httpsPort: 3443,
    isDaemonRunning: !!autoRenewTimer,
    history: getSslLogs(),
  };

  if (fs.existsSync(SSL_CONFIG_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(SSL_CONFIG_FILE, "utf-8"));
      status = inspectCertStatus({ ...status, ...parsed });
    } catch (_) {}
  }

  status.isDaemonRunning = !!autoRenewTimer;
  status.history = getSslLogs();
  if (nextScheduledTime > 0) {
    status.nextScheduledCheck = new Date(nextScheduledTime).toISOString();
  }

  return status;
}

/**
 * Save SSL configuration
 */
export function saveSslConfig(cfg: SslStatus) {
  ensureDir(SSL_DATA_DIR);
  fs.writeFileSync(SSL_CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

/**
 * Update SSL configuration parameters (e.g., autoRenew toggle, checkIntervalHours, thresholdDays)
 */
export function updateSslConfigSettings(partial: Partial<SslStatus>): SslStatus {
  const current = getSslConfig();
  const updated: SslStatus = {
    ...current,
    ...partial,
  };
  saveSslConfig(updated);
  if (partial.checkIntervalHours !== undefined || partial.autoRenew !== undefined) {
    startSslAutoRenewDaemon(updated.checkIntervalHours || 6);
  }
  return getSslConfig();
}

/**
 * Inspect certificate file expiration
 */
function inspectCertStatus(status: SslStatus): SslStatus {
  if (!status.certPath || !fs.existsSync(status.certPath)) {
    return { ...status, enabled: false, daysRemaining: 0 };
  }

  try {
    const certPem = fs.readFileSync(status.certPath, "utf-8");
    // Parse certificate using openssl command if available
    try {
      const out = execSync(`openssl x509 -enddate -noout -in "${status.certPath}"`, {
        encoding: "utf-8",
        timeout: 4000,
      });
      // Example: notAfter=Sep 24 10:00:00 2027 GMT
      const match = out.match(/notAfter=(.+)/);
      if (match) {
        const expiresDate = new Date(match[1]);
        const diffMs = expiresDate.getTime() - Date.now();
        const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        return {
          ...status,
          expiresAt: expiresDate.toISOString(),
          daysRemaining,
          enabled: daysRemaining > 0,
        };
      }
    } catch (_) {}

    // Fallback: file mtime check
    const stat = fs.statSync(status.certPath);
    const estExpire = new Date(stat.mtimeMs + 365 * 24 * 60 * 60 * 1000);
    const diffMs = estExpire.getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return {
      ...status,
      expiresAt: estExpire.toISOString(),
      daysRemaining,
      enabled: daysRemaining > 0,
    };
  } catch (_) {
    return status;
  }
}

/**
 * Generate high-grade SAN (Subject Alternative Name) self-signed certificate
 * for raw server IP (IP SAN) + nip.io / sslip.io wildcard domain.
 */
export async function generateServerIpSsl(customIp?: string): Promise<SslStatus> {
  ensureDir(SSL_DATA_DIR);
  const serverIp = customIp || (await getPublicServerIp());
  const nipDomain = `${serverIp}.nip.io`;
  const sslipDomain = `${serverIp}.sslip.io`;

  const keyPath = path.join(SSL_DATA_DIR, "server.key");
  const certPath = path.join(SSL_DATA_DIR, "server.crt");
  const cnfPath = path.join(SSL_DATA_DIR, "openssl.cnf");

  // OpenSSL SAN configuration file allowing direct IP and nip.io domains
  const opensslConfig = `[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = IR
ST = Tehran
L = Tehran
O = Telegram Automation Security
OU = Automated VPS SSL
CN = ${serverIp}

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${serverIp}
IP.2 = 127.0.0.1
DNS.1 = ${serverIp}
DNS.2 = ${nipDomain}
DNS.3 = ${sslipDomain}
DNS.4 = localhost
`;

  fs.writeFileSync(cnfPath, opensslConfig, "utf-8");

  // Generate private key and SAN certificate valid for 365 days
  try {
    execSync(
      `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -config "${cnfPath}"`,
      { stdio: "ignore", timeout: 15000 }
    );
  } catch (err: any) {
    // If openssl command is missing or fails, use fallback node-based basic cert if possible or rethrow
    throw new Error(`خطا در ایجاد گواهی امنیتی OpenSSL: ${err.message}`);
  }

  const current = getSslConfig();
  const newStatus: SslStatus = {
    enabled: true,
    type: "self_signed",
    serverIp,
    domain: nipDomain,
    certPath,
    keyPath,
    autoRenew: current.autoRenew ?? true,
    checkIntervalHours: current.checkIntervalHours || 6,
    thresholdDays: current.thresholdDays || 30,
    httpsPort: current.httpsPort || 3443,
    isDaemonRunning: !!autoRenewTimer,
    history: getSslLogs(),
    lastRenewCheck: new Date().toISOString(),
    lastRenewResult: "گواهی SSL با موفقیت برای آی‌پی سرور صادر شد.",
  };

  const inspected = inspectCertStatus(newStatus);
  saveSslConfig(inspected);
  appendSslLog({
    action: "generate",
    status: "success",
    message: `صدور گواهی امنیتی SSL با موفقیت برای آی‌پی ${serverIp} انجام شد.`,
    daysRemaining: inspected.daysRemaining,
  });
  return inspected;
}

/**
 * Automated Renewal Worker
 * Checks expiration; if less than threshold days remain, automatically executes renewal.
 */
export async function performAutoRenewCheck(forceRenew: boolean = false): Promise<{ renewed: boolean; message: string }> {
  const current = getSslConfig();
  const nowStr = new Date().toISOString();
  const threshold = current.thresholdDays || 30;

  if (!current.enabled) {
    appendSslLog({
      action: "check",
      status: "info",
      message: "گواهی SSL هنوز روی سرور صادر یا فعال نشده است.",
    });
    return { renewed: false, message: "SSL فعال نیست یا گواهی صادر نشده است." };
  }

  const daysRemaining = current.daysRemaining ?? 0;

  if (!forceRenew && daysRemaining > threshold) {
    current.lastRenewCheck = nowStr;
    current.lastRenewResult = `گواهی معتبر است (${daysRemaining} روز باقی‌مانده، آستانه تمدید: ${threshold} روز). اتصال کاملاً امن است.`;
    saveSslConfig(current);

    appendSslLog({
      action: "check",
      status: "success",
      message: current.lastRenewResult,
      daysRemaining,
    });

    return { renewed: false, message: current.lastRenewResult };
  }

  // Renewal triggered (either below threshold or forced)
  try {
    appendSslLog({
      action: "renew",
      status: "info",
      message: forceRenew
        ? `فرمان تمدید و صدور مجدد دستی برای آی‌پی ${current.serverIp} صادر شد...`
        : `اعتبار گواهی (${daysRemaining} روز) کمتر از آستانه ${threshold} روز است. آغاز فرآیند تمدید خودکار پس‌زمینه...`,
      daysRemaining,
    });

    const updated = await generateServerIpSsl(current.serverIp);
    updated.lastRenewCheck = nowStr;
    updated.lastRenewResult = `تمدید گواهی SSL با موفقیت اجرا شد. اعتبار جدید: ${updated.daysRemaining} روز.`;
    saveSslConfig(updated);

    appendSslLog({
      action: "renew",
      status: "success",
      message: updated.lastRenewResult,
      daysRemaining: updated.daysRemaining,
    });

    return { renewed: true, message: updated.lastRenewResult };
  } catch (err: any) {
    current.lastRenewCheck = nowStr;
    current.lastRenewResult = `خطا در اجرای فرآیند تمدید گواهی: ${err.message}`;
    saveSslConfig(current);

    appendSslLog({
      action: "error",
      status: "error",
      message: current.lastRenewResult,
      daysRemaining,
    });

    return { renewed: false, message: current.lastRenewResult };
  }
}

/**
 * Start or Restart the Background SSL Auto-Renewal Daemon
 */
export function startSslAutoRenewDaemon(intervalHours: number = 6) {
  if (autoRenewTimer) {
    clearInterval(autoRenewTimer);
    autoRenewTimer = null;
  }

  const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;
  nextScheduledTime = Date.now() + 30 * 1000; // First check in 30s

  setTimeout(() => {
    performAutoRenewCheck().catch(() => {});
    nextScheduledTime = Date.now() + intervalMs;
  }, 30 * 1000);

  autoRenewTimer = setInterval(() => {
    nextScheduledTime = Date.now() + intervalMs;
    performAutoRenewCheck().catch(() => {});
  }, intervalMs);

  console.log(`[SSL Background Daemon] Started monitoring every ${intervalHours} hour(s).`);
}

/**
 * Stop the Background SSL Auto-Renewal Daemon
 */
export function stopSslAutoRenewDaemon() {
  if (autoRenewTimer) {
    clearInterval(autoRenewTimer);
    autoRenewTimer = null;
  }
  nextScheduledTime = 0;
  console.log("[SSL Background Daemon] Stopped.");
}

/**
 * Attach HTTPS Server listener if SSL is enabled and files exist
 */
export function attachHttpsServer(app: any, preferredPort: number = 3443): https.Server | null {
  const cfg = getSslConfig();
  if (!cfg.enabled || !cfg.certPath || !cfg.keyPath) {
    return null;
  }

  if (!fs.existsSync(cfg.certPath) || !fs.existsSync(cfg.keyPath)) {
    return null;
  }

  try {
    const options = {
      key: fs.readFileSync(cfg.keyPath),
      cert: fs.readFileSync(cfg.certPath),
    };

    const httpsServer = https.createServer(options, app);
    httpsServer.listen(preferredPort, "0.0.0.0", () => {
      console.log(`🔒 HTTPS SSL Server running on https://0.0.0.0:${preferredPort}`);
    });
    return httpsServer;
  } catch (err) {
    console.error("Failed to start HTTPS server:", err);
    return null;
  }
}
