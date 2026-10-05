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
  smart_filters?: SmartFiltersConfig;
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
  lock_pv?: {
    active: boolean;
    warning_message?: string;
    auto_block: boolean;
    auto_delete: boolean;
    allowed_user_ids?: string[];
  };
  media_saver?: {
    active: boolean;
    save_photos: boolean;
    save_videos: boolean;
    save_voice: boolean;
    save_self_destruct: boolean;
    forward_to: "saved_messages" | "custom_channel";
    target_channel_id?: string;
    caption_sender_info: boolean;
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

export interface SmartFilterRule {
  id: string;
  name: string;
  pattern: string; // Regex pattern, e.g. "^(قیمت|نرخ|تعرفه)" or "\\b(support|admin)\\b"
  flags?: string; // Regex flags e.g. "i", "g", "m"
  reply_text: string;
  delay_seconds: number; // Delay in seconds (0 to 60)
  is_active: boolean;
  priority?: number;
  match_count?: number;
  last_matched_at?: string;
  ignore_list?: string[]; // List of user IDs or usernames to ignore for this specific rule
  description?: string;
}

export interface SmartFiltersConfig {
  active: boolean;
  global_ignore_list: string[]; // Global user IDs or @usernames to ignore
  global_delay_seconds: number; // Default delay in seconds
  case_insensitive: boolean;
  log_matches: boolean;
  rules: SmartFilterRule[];
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

export interface OwnerCredentials {
  username: string;
  password?: string;
  updated_at?: string;
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
  web_app_url?: string;
  button_layout?: "3-cols" | "2-cols" | "1-col"; // aiogram-style row arrangement
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
  module: "auth" | "self" | "self_time" | "auto_reply" | "smart_filters" | "tabchi" | "mandatory_join" | "tools" | "broadcast" | "bot" | "system";
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

// ==========================================
// STORE BOT (فروشگاه اشتراک سلف و تبچی)
// ==========================================

export type StoreKeyboardMode = "inline" | "reply" | "hybrid";
export type StoreKeyboardColumns = 1 | 2 | 3;
export type TelegramButtonStyle = "primary" | "success" | "danger";

export type StoreButtonTheme =
  | "cyber_neon"
  | "galaxy_purple"
  | "luxury_gold"
  | "crypto_cyan"
  | "fire_red"
  | "emerald_matrix"
  | "rainbow_vivid"
  | "aiogram_colored"; // aiogram-style primary/success/danger

export interface StorePlan {
  id: string;
  title: string;
  category: "self" | "tabchi" | "combo" | "subscription";
  durationDays: number; // 0 = unlimited
  isUnlimited: boolean;
  priceToman: number;
  priceUsdt: number;
  description: string;
  features: string[];
  badge?: string;
  color?: string; // "emerald" | "cyan" | "purple" | "amber" | "rose"
  isActive: boolean;
  orderIndex: number;
}

export interface StorePaymentCard {
  enabled: boolean;
  bankName: string;
  cardNumber: string;
  cardHolder: string;
  shabaNumber?: string;
  instructions?: string;
}

export interface StorePaymentCardItem {
  id: string;
  bankName: string;
  cardNumber: string;
  cardHolder: string;
  shabaNumber?: string;
  instructions?: string;
  isActive: boolean;
  color?: string; // e.g. "cyan" | "emerald" | "purple" | "blue" | "amber"
}

export interface StorePaymentCryptoNetwork {
  id: string;
  name: string; // e.g. USDT (TRC20), TON, TRX
  symbol: string;
  walletAddress: string;
  network: string;
  memo?: string;
  isActive: boolean;
  instructions?: string;
}

export interface StorePaymentSettings {
  cardPayment: StorePaymentCard;
  cards?: StorePaymentCardItem[];
  cryptoPayment: {
    enabled: boolean;
    networks: StorePaymentCryptoNetwork[];
    generalInstructions?: string;
  };
}

export interface StoreBotButtonLabels {
  buySelf: string;
  buyTabchi: string;
  buyCombo: string;
  plansCatalog: string;
  myOrders: string;
  myAccount: string;
  support: string;
  helpGuide: string;
  applyDiscount: string;
  switchKeyboard?: string;
}

export interface StoreBotSettings {
  botToken: string;
  botUsername?: string;
  botFirstName?: string;
  ownerTelegramId: number | string;
  supportUsername: string;
  channelUsername?: string;
  forceJoinChannel: boolean;
  enabled: boolean;
  status: "online" | "polling" | "stopped" | "error";
  lastError?: string;
  lastActive?: string;
  keyboardMode: StoreKeyboardMode;
  keyboardColumns?: StoreKeyboardColumns; // 1 | 2 | 3
  replyKeyboardColumns?: StoreKeyboardColumns; // 1 | 2 | 3
  allowCustomerKeyboardSwitch: boolean;
  buttonTheme: StoreButtonTheme;
  buttonLabels: StoreBotButtonLabels;
  welcomeText: string;
  rulesText?: string;
  stats: {
    totalUsers: number;
    totalOrders: number;
    totalRevenueToman: number;
    totalRevenueUsdt: number;
  };
}

export interface StoreOrder {
  id: string;
  planId: string;
  planTitle: string;
  category: "self" | "tabchi" | "combo" | "subscription";
  durationDays: number;
  isUnlimited: boolean;
  userId: number | string;
  userUsername?: string;
  userFirstName?: string;
  priceToman: number;
  priceUsdt: number;
  discountAmount?: number;
  finalPriceToman: number;
  finalPriceUsdt: number;
  paymentMethod: "card" | "crypto";
  paymentDetails: {
    cryptoNetwork?: string;
    walletAddress?: string;
    receiptProof?: string;
    receiptType?: "image" | "text" | "txid";
  };
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  generatedCredentials?: {
    licenseCode?: string;
    accountPhone?: string;
    portalUrl?: string;
    password?: string;
    notes?: string;
  };
}

export interface StoreCoupon {
  id: string;
  code: string;
  discountPercent: number;
  discountToman: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
}

export interface StoreSubscriptionExtension {
  id: string;
  timestamp: string;
  durationDays: number; // 0 = unlimited / lifetime
  previousExpiresAt?: string | null;
  newExpiresAt?: string | null;
  planTitle?: string;
  actionType: "manual_bulk" | "manual_single" | "order_approved";
  adminNote?: string;
}

export interface StoreCustomer {
  userId: number | string;
  username?: string;
  firstName?: string;
  lastName?: string;
  joinedAt: string;
  ordersCount: number;
  activePlan?: string;
  expiresAt?: string | null;
  preferredKeyboardMode?: StoreKeyboardMode;
  extensionsHistory?: StoreSubscriptionExtension[];
}

export interface StoreAdminCredentials {
  username: string;
  password?: string;
  updatedAt?: string;
  isDefault?: boolean;
}

export interface StoreData {
  settings: StoreBotSettings;
  plans: StorePlan[];
  payments: StorePaymentSettings;
  orders: StoreOrder[];
  coupons: StoreCoupon[];
  customers: StoreCustomer[];
  adminCredentials?: StoreAdminCredentials;
}

// ==========================================
// SUPPORT BOT TYPES (ربات پشتیبانی تیکتینگ)
// ==========================================

export interface SupportBotSettings {
  enabled: boolean;
  botToken: string;
  adminChatId?: string | number; // Telegram ID of owner to receive tickets
  welcomeMessage: string;
  ticketSubmittedMessage: string;
  closedTicketMessage: string;
  supportName: string;
  workingHoursText?: string;
  autoFaqEnabled?: boolean;
}

export interface SupportTicketMessage {
  id: string;
  sender: "user" | "admin";
  senderName: string;
  text: string;
  timestamp: string;
  telegramMessageId?: number;
}

export interface SupportTicket {
  id: string;
  ticketNumber: number;
  userId: number | string;
  userUsername?: string;
  userFullName: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
  messages: SupportTicketMessage[];
}

export interface SupportFaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
}

export interface SupportBotData {
  settings: SupportBotSettings;
  tickets: SupportTicket[];
  faqs: SupportFaqItem[];
}

// ==========================================
// BATCH CHANNEL & GROUP CREATOR TYPES (گروه‌ساز و کانال‌ساز انبوه)
// ==========================================

export type BatchTargetType = "channel" | "group" | "supergroup";
export type BatchNamingLanguage = "fa" | "en" | "ar" | "ru" | "mixed";
export type BatchThemeTopic = "crypto" | "tech" | "business" | "gaming" | "entertainment" | "vip" | "general";

export interface BatchCreatedItem {
  id: string;
  telegramId?: string | number;
  title: string;
  about?: string;
  type: BatchTargetType;
  inviteLink?: string;
  username?: string;
  createdAt: string;
  status: "success" | "failed";
  error?: string;
}

export interface BatchCreationTask {
  id: string;
  sessionId: string;
  phone: string;
  targetType: BatchTargetType;
  count: number;
  completedCount: number;
  failedCount?: number;
  progressPercent: number; // 0 to 100
  currentAction?: string;
  language: BatchNamingLanguage;
  topic: BatchThemeTopic;
  delaySeconds: number;
  status: "idle" | "running" | "completed" | "stopped" | "error";
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
  items: BatchCreatedItem[];
  broadcastTask?: BatchBroadcastTask;
}

export interface BatchBroadcastTask {
  sessionId: string;
  phone: string;
  message: string;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  progressPercent: number; // 0 to 100
  delaySeconds: number;
  status: "idle" | "running" | "completed" | "stopped" | "error";
  startedAt?: string;
  completedAt?: string;
  currentChatTitle?: string;
  lastError?: string;
  logs?: Array<{
    chatId: string;
    title: string;
    status: "success" | "failed";
    error?: string;
    time: string;
  }>;
}

export interface BatchBroadcastRequest {
  message: string;
  delaySeconds?: number;
  targetTypes?: ("created" | "dialogs_channels" | "dialogs_groups")[];
  targetChatIds?: string[];
}

export interface BatchCreationRequest {
  targetType: BatchTargetType;
  count: number;
  language: BatchNamingLanguage;
  topic: BatchThemeTopic;
  delaySeconds: number;
  customPrefix?: string;
  customSuffix?: string;
  customNamesList?: string[];
  customAbout?: string;
  autoBroadcastWelcome?: boolean;
  welcomeMessage?: string;
}

// ==========================================
// DASHBOARD ACTIVITY & ANALYTICS TYPES
// ==========================================

export interface HourlyActivityPoint {
  hour: string;
  sentMessages: number;
  receivedMessages: number;
  autoReplies: number;
  blockedUsers: number;
  savedMedia: number;
}

export interface AccountActivityStat {
  phone: string;
  firstName: string;
  totalSent: number;
  totalReceived: number;
  autoReplies: number;
  tabchiSent: number;
  savedMediaCount: number;
  blockedCount: number;
  interactionRate: number; // percentage
  status: "online" | "offline";
}

export interface ActivityDashboardData {
  overview: {
    totalAccounts: number;
    onlineAccounts: number;
    totalMessagesSentToday: number;
    totalMessagesReceivedToday: number;
    avgInteractionRate: number;
    totalMediaSaved: number;
    totalBlocked: number;
  };
  hourlyTimeline: HourlyActivityPoint[];
  accountStats: AccountActivityStat[];
  moduleDistribution: Array<{
    name: string;
    activeCount: number;
    percentage: number;
    color: string;
  }>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tehranTime: string;
  accountPhone: string;
  accountName?: string;
  action: string;
  actionLabel: string;
  category: "auth" | "features" | "tabchi" | "subscription" | "batch" | "system" | "bot" | "security";
  status: "success" | "failed" | "warning";
  statusCode?: number;
  durationMs?: number;
  details?: Record<string, any>;
  errorMessage?: string;
  troubleshootingHint?: string;
  ip?: string;
  source: string;
}

export interface AuditLogSummary {
  totalCount: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  successRate: number;
  last24hCount: number;
  byCategory: Record<string, number>;
  byAccount: Record<string, number>;
}



