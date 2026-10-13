import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { execSync } from "child_process";
import { X509Certificate } from "crypto";

export interface SslRenewalLog {
  id: string;
  timestamp: string;
  action: "check" | "renew" | "generate" | "custom" | "error";
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
let activeHttpsServer: https.Server | null = null;

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
    // Keep last 50 logs
    if (logs.length > 50) logs = logs.slice(0, 50);
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
 * Inspect certificate file expiration using Node.js built-in X509Certificate
 */
export function inspectCertStatus(status: SslStatus): SslStatus {
  if (!status.certPath || !fs.existsSync(status.certPath)) {
    return { ...status, enabled: false, daysRemaining: 0 };
  }

  try {
    const certPem = fs.readFileSync(status.certPath, "utf-8");

    // 1. Primary: Use Node built-in X509Certificate (robust, no subprocess)
    try {
      const x509 = new X509Certificate(certPem);
      if (x509.validTo) {
        const expiresDate = new Date(x509.validTo);
        if (!isNaN(expiresDate.getTime())) {
          const diffMs = expiresDate.getTime() - Date.now();
          const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          return {
            ...status,
            expiresAt: expiresDate.toISOString(),
            daysRemaining,
            enabled: daysRemaining > 0,
          };
        }
      }
    } catch (_) {}

    // 2. Secondary fallback: openssl CLI
    try {
      const out = execSync(`openssl x509 -enddate -noout -in "${status.certPath}"`, {
        encoding: "utf-8",
        timeout: 4000,
      });
      const match = out.match(/notAfter=(.+)/);
      if (match && match[1]) {
        const cleanStr = match[1].trim();
        const expiresDate = new Date(cleanStr);
        if (!isNaN(expiresDate.getTime())) {
          const diffMs = expiresDate.getTime() - Date.now();
          const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          return {
            ...status,
            expiresAt: expiresDate.toISOString(),
            daysRemaining,
            enabled: daysRemaining > 0,
          };
        }
      }
    } catch (_) {}

    // 3. Fallback: file mtime check (valid for 365 days from mtime)
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
 * Update SSL configuration parameters
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
 * Save custom SSL certificate & private key (e.g. Cloudflare Origin CA certificate)
 */
export function saveCustomSslCertificate(
  certPem: string,
  keyPem: string,
  customDomain?: string
): SslStatus {
  ensureDir(SSL_DATA_DIR);

  const cleanCert = certPem.trim();
  const cleanKey = keyPem.trim();

  if (!cleanCert.includes("BEGIN CERTIFICATE") || !cleanKey.includes("PRIVATE KEY")) {
    throw new Error("فرمت گواهی یا کلید خصوصی نامعتبر است (باید حاوی BEGIN CERTIFICATE و BEGIN PRIVATE KEY باشد).");
  }

  let daysRemaining = 365;
  let expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const x509 = new X509Certificate(cleanCert);
    if (x509.validTo) {
      const expDate = new Date(x509.validTo);
      if (!isNaN(expDate.getTime())) {
        expiresAt = expDate.toISOString();
        const diffMs = expDate.getTime() - Date.now();
        daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }
  } catch (err: any) {
    throw new Error(`خطا در اعتبارسنجی گواهی امنیتی: ${err.message}`);
  }

  const certPath = path.join(SSL_DATA_DIR, "server.crt");
  const keyPath = path.join(SSL_DATA_DIR, "server.key");

  fs.writeFileSync(certPath, cleanCert, "utf-8");
  fs.writeFileSync(keyPath, cleanKey, "utf-8");

  const current = getSslConfig();
  const domain = customDomain?.trim() || current.domain || "custom-domain";

  const newStatus: SslStatus = {
    ...current,
    enabled: true,
    type: "custom",
    domain,
    certPath,
    keyPath,
    expiresAt,
    daysRemaining,
    lastRenewCheck: new Date().toISOString(),
    lastRenewResult: `گواهی دست‌ساز / کلودفلر با موفقیت برای دامنه ${domain} ثبت شد (${daysRemaining} روز اعتبار).`,
  };

  saveSslConfig(newStatus);
  appendSslLog({
    action: "custom",
    status: "success",
    message: `گواهی اختصاصی برای دامنه ${domain} ثبت شد. اعتبار: ${daysRemaining} روز.`,
    daysRemaining,
  });

  return newStatus;
}

/**
 * Generate high-grade SAN (Subject Alternative Name) self-signed certificate or Let's Encrypt
 * NEVER drops custom domain!
 */
export async function generateServerIpSsl(customIp?: string, customDomain?: string): Promise<SslStatus> {
  ensureDir(SSL_DATA_DIR);
  const current = getSslConfig();

  const rawIp = customIp || current.serverIp || (await getPublicServerIp());
  const serverIp = /^[0-9a-fA-F.:]+$/.test(rawIp.trim()) ? rawIp.trim() : "127.0.0.1";

  // Retain existing configured domain if user didn't provide a new one
  const existingDomain = current.domain && !current.domain.includes("nip.io") && !current.domain.includes("sslip.io")
    ? current.domain
    : undefined;

  let selectedDomain = `${serverIp}.nip.io`;
  const domainCandidate = customDomain?.trim() || existingDomain;

  if (domainCandidate) {
    const cleanDom = domainCandidate.toLowerCase();
    if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(cleanDom)) {
      selectedDomain = cleanDom;
    }
  }

  const nipDomain = `${serverIp}.nip.io`;
  const sslipDomain = `${serverIp}.sslip.io`;

  const keyPath = path.join(SSL_DATA_DIR, "server.key");
  const certPath = path.join(SSL_DATA_DIR, "server.crt");
  const cnfPath = path.join(SSL_DATA_DIR, "openssl.cnf");

  // Check if Let's Encrypt cert already exists on VPS for this domain
  let certbotSucceeded = false;
  const isRealDomain = selectedDomain && !selectedDomain.includes("nip.io") && !selectedDomain.includes("sslip.io") && selectedDomain.includes(".");

  if (isRealDomain) {
    const liveCert = `/etc/letsencrypt/live/${selectedDomain}/fullchain.pem`;
    const liveKey = `/etc/letsencrypt/live/${selectedDomain}/privkey.pem`;

    // Try reading directly from live if exists
    if (fs.existsSync(liveCert) && fs.existsSync(liveKey)) {
      try {
        fs.copyFileSync(liveCert, certPath);
        fs.copyFileSync(liveKey, keyPath);
        certbotSucceeded = true;
      } catch (_) {}
    }

    // Otherwise try certbot standalone
    if (!certbotSucceeded) {
      try {
        // Free port 80 if possible
        try { execSync("fuser -k 80/tcp 2>/dev/null || true"); } catch (_) {}
        execSync(
          `certbot certonly --standalone -d "${selectedDomain}" --non-interactive --agree-tos -m "admin@${selectedDomain}" --keep-until-expiring 2>/dev/null`,
          { timeout: 30000, stdio: "ignore" }
        );
        if (fs.existsSync(liveCert) && fs.existsSync(liveKey)) {
          fs.copyFileSync(liveCert, certPath);
          fs.copyFileSync(liveKey, keyPath);
          certbotSucceeded = true;
        }
      } catch (_) {}
    }
  }

  if (!certbotSucceeded) {
    // OpenSSL SAN configuration file allowing direct IP and custom domain
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
CN = ${selectedDomain}

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${serverIp}
IP.2 = 127.0.0.1
DNS.1 = ${selectedDomain}
DNS.2 = ${serverIp}
DNS.3 = ${nipDomain}
DNS.4 = ${sslipDomain}
DNS.5 = localhost
`;

    fs.writeFileSync(cnfPath, opensslConfig, "utf-8");

    try {
      execSync(
        `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -config "${cnfPath}"`,
        { stdio: "ignore", timeout: 15000 }
      );
    } catch (err: any) {
      throw new Error(`خطا در ایجاد گواهی امنیتی OpenSSL: ${err.message}`);
    }
  }

  const newStatus: SslStatus = {
    enabled: true,
    type: certbotSucceeded ? "letsencrypt_nip" : "self_signed",
    serverIp,
    domain: selectedDomain,
    certPath,
    keyPath,
    autoRenew: current.autoRenew ?? true,
    checkIntervalHours: current.checkIntervalHours || 6,
    thresholdDays: current.thresholdDays || 30,
    httpsPort: current.httpsPort || 3443,
    isDaemonRunning: !!autoRenewTimer,
    history: getSslLogs(),
    lastRenewCheck: new Date().toISOString(),
    lastRenewResult: `گواهی SSL با موفقیت برای دامنه ${selectedDomain} صادر شد.`,
  };

  const inspected = inspectCertStatus(newStatus);
  saveSslConfig(inspected);
  appendSslLog({
    action: "generate",
    status: "success",
    message: `صدور گواهی امنیتی SSL با موفقیت برای دامنه/آی‌پی ${selectedDomain} (${serverIp}) انجام شد.`,
    daysRemaining: inspected.daysRemaining,
  });
  return inspected;
}

/**
 * Automated Renewal Worker
 * Checks expiration; if less than threshold days remain, automatically executes renewal.
 * PRESERVES CUSTOM DOMAIN!
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

  // If custom certificate (e.g. Cloudflare Origin CA) is installed and still valid, NEVER overwrite it!
  if (current.type === "custom" && !forceRenew) {
    if (daysRemaining > 0) {
      current.lastRenewCheck = nowStr;
      current.lastRenewResult = `گواهی اختصاصی کلودفلر/دستی برای ${current.domain} معتبر است (${daysRemaining} روز باقی‌مانده).`;
      saveSslConfig(current);
      return { renewed: false, message: current.lastRenewResult };
    }
  }

  if (!forceRenew && daysRemaining > threshold) {
    current.lastRenewCheck = nowStr;
    current.lastRenewResult = `گواهی معتبر است (${daysRemaining} روز باقی‌مانده برای ${current.domain || current.serverIp}، آستانه تمدید: ${threshold} روز). اتصال کاملاً امن است.`;
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
    const targetDomain = current.domain && !current.domain.includes("nip.io") && !current.domain.includes("sslip.io")
      ? current.domain
      : undefined;

    appendSslLog({
      action: "renew",
      status: "info",
      message: forceRenew
        ? `فرمان تمدید و صدور مجدد دستی برای دامنه/آی‌پی ${targetDomain || current.serverIp} صادر شد...`
        : `اعتبار گواهی (${daysRemaining} روز) کمتر از آستانه ${threshold} روز است. آغاز فرآیند تمدید خودکار پس‌زمینه برای ${targetDomain || current.serverIp}...`,
      daysRemaining,
    });

    // Pass BOTH serverIp and domain to preserve the user's custom domain!
    const updated = await generateServerIpSsl(current.serverIp, targetDomain);
    updated.lastRenewCheck = nowStr;
    updated.lastRenewResult = `تمدید گواهی SSL با موفقیت اجرا شد. اعتبار جدید: ${updated.daysRemaining} روز برای ${updated.domain || updated.serverIp}.`;
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
 * Attach or Hot-Reload HTTPS Server listener if SSL is enabled and files exist
 * Avoids EADDRINUSE by updating secure context or safely closing first
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

    // If HTTPS server is already active on this port, hot-reload the certificates without dropping the port!
    if (activeHttpsServer) {
      try {
        (activeHttpsServer as any).setSecureContext(options);
        console.log(`🔒 HTTPS SSL Server certificates reloaded successfully.`);
        return activeHttpsServer;
      } catch (_) {}
    }

    activeHttpsServer = https.createServer(options, app);
    activeHttpsServer.listen(preferredPort, "0.0.0.0", () => {
      console.log(`🔒 HTTPS SSL Server running on https://0.0.0.0:${preferredPort}`);
    });
    activeHttpsServer.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`[HTTPS] Port ${preferredPort} is already in use, continuing.`);
      } else {
        console.error("[HTTPS] Server error:", err);
      }
    });
    return activeHttpsServer;
  } catch (err) {
    console.error("Failed to start HTTPS server:", err);
    return null;
  }
}

