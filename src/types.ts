export interface TelegramAccountFeatures {
  self_access?: {
    enabled: boolean;
    expires_at: string | null;
  };
  tabchi_access?: {
    enabled: boolean;
    expires_at: string | null;
  };
  self_time: {
    active: boolean;
    format: string; // e.g. "HH:mm" or "HH:mm ⚡"
    font_style: "bold" | "italic" | "monospace" | "double" | "sans" | "gothic" | "normal";
    original_last_name: string | null;
    last_updated?: string;
  };
  auto_reply: {
    active: boolean;
    messages: string[];
    delay_seconds: number;
    last_replied_at?: string;
    ai_enabled?: boolean;
    ai_api_key?: string;
    ai_prompt?: string;
    ai_model?: string;
  };
  mandatory_join: {
    active: boolean;
    channels: Array<{ name: string; ref: string }>;
  };
  broadcast: {
    active: boolean;
    message: string;
    interval_seconds: number;
    max_recipients: number;
    recipients: Record<string, { last_seen: string }>;
    last_message_hash?: string | null;
    status?: "idle" | "broadcasting" | "stopped";
    total_sent?: number;
  };
  tools: {
    calculator_active: boolean;
    market_active: boolean;
  };
  font: {
    active: boolean;
    style: "bold" | "italic" | "bold_italic" | "monospace" | "double" | "sans" | "gothic" | "normal" | "default";
    scopes: {
      self_time: boolean;
      manual_messages: boolean;
      auto_reply: boolean;
      mandatory_join: boolean;
      tabchi: boolean;
      remote_ui: boolean;
    };
  };
  tabchi: {
    active: boolean;
    message: string;
    interval_seconds: number;
    repeat_rounds: number;
    repeat_infinite: boolean;
    total_sent: number;
    total_failed: number;
    last_run?: string;
    status: "idle" | "broadcasting" | "stopped" | "error";
    target_mode: "all" | "selected";
    targets: string[];
  };
  keep_alive: boolean;
}

export interface AccountSubscription {
  is_unlimited: boolean;
  days_total?: number;
  expires_at?: string | null; // ISO date timestamp, null if unlimited
  status: "active" | "expired";
  created_at: string;
  extended_at?: string;
  notes?: string;
}

export interface ClientCredentials {
  username: string;
  password: string;
  created_at?: string;
  last_login?: string;
}

export interface AccountBotConfig {
  bot_token: string;
  enabled: boolean;
  owner_id?: number;
  bot_username?: string;
  bot_first_name?: string;
  status?: "connected" | "disconnected" | "error";
  last_error?: string;
  last_active?: string;
}

export type UserRole = "owner" | "customer";

export interface AuthSession {
  role: UserRole;
  username: string;
  customerPhone?: string;
  accountName?: string;
}

export interface TelegramAccount {
  phone: string;
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  sessionString: string;
  connectedAt: string;
  isOnline: boolean;
  features: TelegramAccountFeatures;
  apiId?: number;
  apiHash?: string;
  subscription?: AccountSubscription;
  client_credentials?: ClientCredentials;
  bot?: AccountBotConfig;
}

export interface BotSettings {
  bot_token: string;
  owner_id: number;
  enabled: boolean;
  bot_username?: string;
  bot_first_name?: string;
  api_id?: number;
  api_hash?: string;
  status?: "connected" | "disconnected" | "error";
  last_error?: string;
  last_active?: string;
}

export interface MarketQuote {
  asset: string;
  symbol: string;
  name_fa?: string;
  category: "fiat" | "crypto" | "gold";
  amount: number;
  unit_usd: number;
  total_usd: number;
  unit_toman: number;
  total_toman: number;
  unit_irr: number;
  total_irr: number;
  change_24h_percent?: number;
  high_24h_toman?: number;
  low_24h_toman?: number;
  high_24h_usd?: number;
  low_24h_usd?: number;
  trend?: "up" | "down" | "neutral";
  chart_url?: string;
  chart_svg?: string;
  history?: Array<{ time: string; price_usd: number; price_toman: number }>;
  updated_at: string;
  profitLossText?: string;
}

export interface SendCodeResponse {
  success: boolean;
  sessionId?: string;
  phoneCodeHash?: string;
  isCodeViaApp?: boolean;
  timeout?: number;
  message?: string;
  errorCode?: string;
}

export interface SignInResponse {
  success: boolean;
  requires2FA?: boolean;
  hint?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    phone: string;
  };
  message?: string;
  errorCode?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  accountPhone?: string;
  module: "auth" | "self_time" | "auto_reply" | "tabchi" | "mandatory_join" | "tools" | "broadcast" | "bot" | "system";
  message: string;
  details?: any;
}

export interface SystemHealth {
  status: "online" | "degraded" | "offline";
  uptimeSeconds: number;
  connectedAccountsCount: number;
  activeAccounts: string[];
  nodeVersion: string;
  memoryUsageMb: number;
  defaultApiId: number;
  hasCustomBotToken: boolean;
  botStatus?: {
    configured: boolean;
    enabled: boolean;
    owner_id: number;
    token_masked?: string;
  };
  serverTime: string;
}

