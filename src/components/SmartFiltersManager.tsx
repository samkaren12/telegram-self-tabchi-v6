import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  AlertCircle,
  CheckCircle2,
  Shield,
  Clock,
  Code2,
  Play,
  RotateCcw,
  Zap,
  HelpCircle,
  Copy,
  Info,
  Tag,
  X,
  Sliders,
} from "lucide-react";
import { Language } from "../utils/i18n";
import { TelegramAccount, SmartFiltersConfig, SmartFilterRule } from "../types";

interface SmartFiltersManagerProps {
  account: TelegramAccount;
  lang: Language;
  onUpdateAccount: (account: TelegramAccount) => void;
}

const PRESET_RULES: Array<Omit<SmartFilterRule, "id">> = [
  {
    name: "استعلام قیمت و تعرفه‌ها",
    pattern: "^(قیمت|تعرفه|نرخ|هزینه|چنده|چقدره|خرید)",
    flags: "i",
    reply_text: "سلام {name} عزیز! تعرفه‌ها و لیست پلن‌های فعال در کانال پین شده است. برای خرید به بخش فروشگاه مراجعه کنید.",
    delay_seconds: 1,
    is_active: true,
    ignore_list: [],
    description: "تشخیص فوری پیام‌های مربوط به قیمت و ارجاع به پنل",
  },
  {
    name: "درخواست پشتیبانی و ادمین",
    pattern: "(پشتیبانی|ادمین|کمک|راهنمایی|تیکت|مشکل|خرابه)",
    flags: "i",
    reply_text: "درود! پیام شما دریافت شد. ادمین به زودی در ساعت کاری بررسی خواهد کرد. لطفاً جزئیات مشکل را کامل ارسال کنید.",
    delay_seconds: 2,
    is_active: true,
    ignore_list: [],
    description: "پاسخ به سوالات فنی و پشتیبانی",
  },
  {
    name: "سلام و احوالپرسی سریع",
    pattern: "^(سلام|درود|سلام علیکم|صبح بخیر|عصر بخیر|شب بخیر|hi|hello)",
    flags: "i",
    reply_text: "سلام و درود! خوش آمدید. پیام شما در ساعت {time} دریافت شد. چه کمکی از من برمی‌آید؟",
    delay_seconds: 1,
    is_active: true,
    ignore_list: [],
    description: "پاسخ خودکار گرم به احوالپرسی‌ها",
  },
  {
    name: "شناسایی لینک یا شماره تماس",
    pattern: "(https?:\\/\\/|t\\.me\\/|@\\w+|09\\d{9})",
    flags: "i",
    reply_text: "ارسال لینک و مشخصات دریافت گردید؛ پس از بررسی تایید خواهد شد.",
    delay_seconds: 3,
    is_active: false,
    ignore_list: [],
    description: "فیلتر پیام‌های حاوی لینک، آیدی یا شماره همراه",
  },
];

export const SmartFiltersManager: React.FC<SmartFiltersManagerProps> = ({
  account,
  lang,
  onUpdateAccount,
}) => {
  const currentConfig: SmartFiltersConfig = account.features.smart_filters || {
    active: false,
    global_ignore_list: [],
    global_delay_seconds: 1,
    case_insensitive: true,
    log_matches: true,
    rules: [],
  };

  const [active, setActive] = useState<boolean>(Boolean(currentConfig.active));
  const [globalDelay, setGlobalDelay] = useState<number>(currentConfig.global_delay_seconds ?? 1);
  const [caseInsensitive, setCaseInsensitive] = useState<boolean>(currentConfig.case_insensitive !== false);
  const [logMatches, setLogMatches] = useState<boolean>(currentConfig.log_matches !== false);
  const [globalIgnoreList, setGlobalIgnoreList] = useState<string[]>(currentConfig.global_ignore_list || []);
  const [newIgnoreInput, setNewIgnoreInput] = useState<string>("");
  const [rules, setRules] = useState<SmartFilterRule[]>(currentConfig.rules || []);

  // Modal / Form state for creating or editing rule
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [rulePattern, setRulePattern] = useState("");
  const [ruleFlags, setRuleFlags] = useState("i");
  const [ruleReplyText, setRuleReplyText] = useState("");
  const [ruleDelay, setRuleDelay] = useState(1);
  const [ruleActive, setRuleActive] = useState(true);
  const [ruleDescription, setRuleDescription] = useState("");
  const [ruleIgnoreList, setRuleIgnoreList] = useState<string[]>([]);
  const [ruleIgnoreInput, setRuleIgnoreInput] = useState("");

  // Live Regex Simulator state
  const [testText, setTestText] = useState("سلام قیمت پنل سلف چنده؟");
  const [testSender, setTestSender] = useState("user_102030");
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    matched: boolean;
    ignored?: boolean;
    reason?: string;
    matches?: string[];
    replyPreview?: string;
  } | null>(null);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add ignore tag
  const handleAddGlobalIgnore = () => {
    const val = newIgnoreInput.trim().replace(/^@/, "");
    if (!val) return;
    if (!globalIgnoreList.includes(val)) {
      setGlobalIgnoreList([...globalIgnoreList, val]);
    }
    setNewIgnoreInput("");
  };

  const handleRemoveGlobalIgnore = (item: string) => {
    setGlobalIgnoreList(globalIgnoreList.filter((x) => x !== item));
  };

  const handleAddRuleIgnore = () => {
    const val = ruleIgnoreInput.trim().replace(/^@/, "");
    if (!val) return;
    if (!ruleIgnoreList.includes(val)) {
      setRuleIgnoreList([...ruleIgnoreList, val]);
    }
    setRuleIgnoreInput("");
  };

  const handleRemoveRuleIgnore = (item: string) => {
    setRuleIgnoreList(ruleIgnoreList.filter((x) => x !== item));
  };

  // Open form for new rule
  const handleOpenNewRule = () => {
    setEditingRuleId(null);
    setRuleName("");
    setRulePattern("");
    setRuleFlags("i");
    setRuleReplyText("");
    setRuleDelay(globalDelay);
    setRuleActive(true);
    setRuleDescription("");
    setRuleIgnoreList([]);
    setRuleIgnoreInput("");
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEditRule = (rule: SmartFilterRule) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRulePattern(rule.pattern);
    setRuleFlags(rule.flags || "i");
    setRuleReplyText(rule.reply_text);
    setRuleDelay(rule.delay_seconds ?? 1);
    setRuleActive(rule.is_active);
    setRuleDescription(rule.description || "");
    setRuleIgnoreList(rule.ignore_list || []);
    setRuleIgnoreInput("");
    setIsFormOpen(true);
  };

  // Apply preset
  const handleApplyPreset = (preset: Omit<SmartFilterRule, "id">) => {
    const newRule: SmartFilterRule = {
      ...preset,
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      match_count: 0,
    };
    setRules([...rules, newRule]);
    setFeedback({
      type: "success",
      text: `الگوی پیش‌فرض «${preset.name}» با موفقیت افزوده شد.`,
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Save rule from modal
  const handleSaveRuleForm = () => {
    if (!ruleName.trim()) {
      alert("لطفاً نام قانون را وارد کنید.");
      return;
    }
    if (!rulePattern.trim()) {
      alert("لطفاً الگوی رِجکس (Regex Pattern) را وارد کنید.");
      return;
    }
    if (!ruleReplyText.trim()) {
      alert("متن پاسخ خودکار نمی‌تواند خالی باشد.");
      return;
    }

    // Validate regex syntax
    try {
      new RegExp(rulePattern.trim(), ruleFlags || "i");
    } catch (e: any) {
      alert(`خطای نگارشی در رِجکس: ${e.message}`);
      return;
    }

    if (editingRuleId) {
      setRules(
        rules.map((r) =>
          r.id === editingRuleId
            ? {
                ...r,
                name: ruleName.trim(),
                pattern: rulePattern.trim(),
                flags: ruleFlags,
                reply_text: ruleReplyText.trim(),
                delay_seconds: Number(ruleDelay) || 0,
                is_active: ruleActive,
                description: ruleDescription.trim(),
                ignore_list: ruleIgnoreList,
              }
            : r
        )
      );
    } else {
      const newRule: SmartFilterRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: ruleName.trim(),
        pattern: rulePattern.trim(),
        flags: ruleFlags,
        reply_text: ruleReplyText.trim(),
        delay_seconds: Number(ruleDelay) || 0,
        is_active: ruleActive,
        description: ruleDescription.trim(),
        ignore_list: ruleIgnoreList,
        match_count: 0,
      };
      setRules([...rules, newRule]);
    }

    setIsFormOpen(false);
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    if (!confirm("آیا از حذف این فیلتر هوشمند اطمینان دارید؟")) return;
    setRules(rules.filter((r) => r.id !== id));
  };

  // Toggle rule status
  const handleToggleRuleStatus = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  // Live Test against pattern or current rules
  const handleTestSimulator = () => {
    const sender = testSender.trim().toLowerCase().replace(/^@/, "");

    // Check global ignore list
    if (globalIgnoreList.some((x) => x.toLowerCase() === sender || sender.includes(x.toLowerCase()))) {
      setTestResult({
        tested: true,
        matched: false,
        ignored: true,
        reason: `کاربر ${testSender} در لیست سیاه کلی (Global Ignore List) قرار دارد.`,
      });
      return;
    }

    // If form is open, test the form pattern, else test against rules
    const patternToTest = isFormOpen ? rulePattern : rules.find((r) => r.is_active)?.pattern;
    const flagsToTest = isFormOpen ? ruleFlags : "i";
    const replyTemplate = isFormOpen ? ruleReplyText : rules.find((r) => r.is_active)?.reply_text;
    const currentRuleIgnores = isFormOpen ? ruleIgnoreList : [];

    if (currentRuleIgnores.some((x) => x.toLowerCase() === sender || sender.includes(x.toLowerCase()))) {
      setTestResult({
        tested: true,
        matched: false,
        ignored: true,
        reason: `کاربر ${testSender} در لیست نادیده‌گرفته‌شده‌های این قانون قرار دارد.`,
      });
      return;
    }

    if (!patternToTest) {
      setTestResult({
        tested: true,
        matched: false,
        reason: "هیچ قانون فعالی برای آزمودن یافت نشد.",
      });
      return;
    }

    try {
      const rx = new RegExp(patternToTest, flagsToTest);
      const matched = rx.test(testText);
      const matches = matched ? Array.from(testText.match(rx) || []) : [];

      let formattedReply = replyTemplate || "پاسخ تستی";
      formattedReply = formattedReply
        .replace(/\{match\}/g, matches[0] || "")
        .replace(/\{name\}/g, account.firstName || "کاربر")
        .replace(/\{time\}/g, "14:30");

      setTestResult({
        tested: true,
        matched,
        matches,
        replyPreview: matched ? formattedReply : undefined,
        reason: matched ? "الگوی رِجکس تطبیق داده شد ✅" : "الگوی رِجکس تطبیق نیافت ⛔",
      });
    } catch (e: any) {
      setTestResult({
        tested: true,
        matched: false,
        reason: `خطای رِجکس: ${e.message}`,
      });
    }
  };

  // Save all smart filters to backend
  const handleSaveAll = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload: SmartFiltersConfig = {
        active,
        global_ignore_list: globalIgnoreList,
        global_delay_seconds: Number(globalDelay) || 1,
        case_insensitive: caseInsensitive,
        log_matches: logMatches,
        rules,
      };

      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/smart-filters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smart_filters: payload }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ذخیره فیلترهای هوشمند");
      }

      account.features.smart_filters = data.smart_filters;
      onUpdateAccount({ ...account });

      setFeedback({
        type: "success",
        text: `تنظیمات فیلترهای هوشمند رِجکس (${rules.length} قانون) با موفقیت ذخیره شد ✅`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "خطا در برقراری ارتباط با سرور",
      });
    } finally {
      setSaving(false);
    }
  };

  const activeRulesCount = rules.filter((r) => r.is_active).length;
  const totalMatchesCount = rules.reduce((acc, r) => acc + (r.match_count || 0), 0);

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden border border-amber-500/30">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex-shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                {lang === "fa" ? "فیلترهای هوشمند رِجکس (Smart Filters ⚡)" : "Smart Filters & Regex Engine"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PRO ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "fa"
                ? "قوانین شرطی پاسخ خودکار بر اساس الگوهای منظم رِجکس، تنظیم دقیق ثانیه تاخیر و لیست سیاه نادیده‌گرفته‌شده‌ها (Ignore-List)"
                : "Regex-based conditional auto-replies with fine-tuned delays and sender ignore lists"}
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 border transition-all active:scale-95 shadow-md ${
              active
                ? "bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 border-emerald-400 shadow-emerald-500/20 font-black"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                active ? "bg-black animate-ping" : "bg-slate-600"
              }`}
            />
            <span>
              {active
                ? lang === "fa"
                  ? "موتور فیلترها فعال است ✅"
                  : "Engine Active ✅"
                : lang === "fa"
                ? "موتور فیلترها خاموش ⛔"
                : "Engine Disabled ⛔"}
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-black/50 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            {lang === "fa" ? "کل قوانین تعریف‌شده" : "Total Rules"}
          </span>
          <span className="text-lg font-mono font-black text-white">{rules.length}</span>
        </div>
        <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-1">
          <span className="text-emerald-400 text-[11px] block">
            {lang === "fa" ? "قوانین فعال" : "Active Rules"}
          </span>
          <span className="text-lg font-mono font-black text-emerald-300">{activeRulesCount}</span>
        </div>
        <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/30 space-y-1">
          <span className="text-amber-400 text-[11px] block">
            {lang === "fa" ? "کل پاسخ‌های ارسالی" : "Matched & Replied"}
          </span>
          <span className="text-lg font-mono font-black text-amber-300">{totalMatchesCount}</span>
        </div>
        <div className="p-3 rounded-2xl bg-black/50 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            {lang === "fa" ? "لیست سیاه سراسری" : "Global Ignore List"}
          </span>
          <span className="text-lg font-mono font-black text-rose-400">{globalIgnoreList.length}</span>
        </div>
      </div>

      {/* GLOBAL SETTINGS ACCORDION */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>{lang === "fa" ? "تنظیمات عمومی موتور فیلتر و تاخیر" : "Global Engine & Delay Settings"}</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Global Delay Slider */}
          <div className="space-y-2 p-3 rounded-xl bg-black/60 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === "fa" ? "تاخیر پیش‌فرض ارسال پاسخ (ثانیه):" : "Default Delay (Seconds):"}</span>
              </span>
              <span className="font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                {globalDelay} {lang === "fa" ? "ثانیه" : "sec"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={globalDelay}
              onChange={(e) => setGlobalDelay(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0s (فوری)</span>
              <span>5s</span>
              <span>10s</span>
              <span>30s</span>
            </div>
          </div>

          {/* Engine Toggles */}
          <div className="space-y-2 p-3 rounded-xl bg-black/60 border border-slate-800/80">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={caseInsensitive}
                onChange={(e) => setCaseInsensitive(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span className="text-slate-300">
                {lang === "fa"
                  ? "نادیده گرفتن حروف کوچک و بزرگ (Case-Insensitive)"
                  : "Case-Insensitive matching (flag /i)"}
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={logMatches}
                onChange={(e) => setLogMatches(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span className="text-slate-300">
                {lang === "fa"
                  ? "ثبت تطبیق‌ها و لاگ زنده سیستم هنگام ارسال پاسخ"
                  : "Log rule matches in live system logs"}
              </span>
            </label>
          </div>
        </div>

        {/* Global Ignore List */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="block text-slate-300 font-semibold text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>{lang === "fa" ? "لیست سیاه سراسری (Global Ignore-List):" : "Global Ignore-List:"}</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {lang === "fa" ? "آیدی یا یوزرنیم کاربرانی که هرگز پاسخی دریافت نمی‌کنند" : "User IDs or @usernames to ignore"}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newIgnoreInput}
              onChange={(e) => setNewIgnoreInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGlobalIgnore();
                }
              }}
              placeholder="e.g. 123456789 یا @spammer"
              className="flex-1 bg-black border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none font-mono"
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleAddGlobalIgnore}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === "fa" ? "افزودن به بلک‌لیست" : "Add to Ignore"}</span>
            </button>
          </div>

          {/* Ignore Tags */}
          {globalIgnoreList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {globalIgnoreList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-[11px]"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGlobalIgnore(tag)}
                    className="hover:text-white cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUICK PRESETS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{lang === "fa" ? "الگوهای آماده و رِجکس‌های محبوب:" : "Quick Preset Templates:"}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {PRESET_RULES.map((preset, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-black/60 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-2.5 group"
            >
              <div className="space-y-1">
                <span className="font-bold text-white text-xs block truncate group-hover:text-amber-300">
                  {preset.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block truncate" dir="ltr">
                  {preset.pattern}
                </span>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="w-full py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{lang === "fa" ? "افزودن این الگو" : "Apply Preset"}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RULES LIST & ADD BUTTON */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>{lang === "fa" ? "فهرست قوانین فیلتر هوشمند:" : "Smart Filter Rules List:"}</span>
            <span className="text-xs text-slate-400 font-mono">({rules.length})</span>
          </h4>

          <button
            type="button"
            onClick={handleOpenNewRule}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{lang === "fa" ? "قانون رِجکس جدید ➕" : "Create Regex Rule ➕"}</span>
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="p-8 rounded-2xl bg-black/40 border border-dashed border-slate-800 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-amber-500/40 mx-auto" />
            <p className="text-slate-400 text-xs font-semibold">
              {lang === "fa"
                ? "هنوز هیچ قانون رِجکسی ایجاد نکرده‌اید."
                : "No smart filter rules configured yet."}
            </p>
            <p className="text-[11px] text-slate-500">
              {lang === "fa"
                ? "می‌توانید با زدن دکمه «قانون رِجکس جدید» یا استفاده از الگوهای آماده بالا شروع کنید."
                : "Click Create Regex Rule or pick a preset above to begin."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  rule.is_active
                    ? "bg-black/70 border-slate-800 hover:border-amber-500/50"
                    : "bg-slate-950/40 border-slate-900 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h5 className="font-bold text-white text-xs sm:text-sm truncate">
                        {rule.name}
                      </h5>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          rule.is_active
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}
                      >
                        {rule.is_active ? (lang === "fa" ? "فعال" : "Active") : (lang === "fa" ? "غیرفعال" : "Disabled")}
                      </span>

                      {rule.delay_seconds !== undefined && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{rule.delay_seconds}s delay</span>
                        </span>
                      )}

                      {rule.match_count !== undefined && rule.match_count > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300">
                          {rule.match_count} {lang === "fa" ? "بار ارسال" : "matches"}
                        </span>
                      )}
                    </div>

                    {/* Regex Badge */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 select-all" dir="ltr">
                        /{rule.pattern}/{rule.flags || "i"}
                      </span>
                      {rule.description && (
                        <span className="text-[11px] text-slate-400 truncate">
                          {rule.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRuleStatus(rule.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        rule.is_active
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                      title={rule.is_active ? "غیرفعال کردن" : "فعال کردن"}
                    >
                      {rule.is_active ? "روشن" : "خاموش"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditRule(rule)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reply Message Preview */}
                <div className="p-2.5 rounded-xl bg-[#020504] border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <span className="text-[10px] text-slate-500 font-mono block mb-1">
                    {lang === "fa" ? "متن پاسخ خودکار:" : "Auto-Reply Text:"}
                  </span>
                  <span>{rule.reply_text}</span>
                </div>

                {/* Ignore List if any */}
                {rule.ignore_list && rule.ignore_list.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
                    <span className="text-rose-400 font-semibold">{lang === "fa" ? "لیست سیاه این قانون:" : "Ignore List:"}</span>
                    {rule.ignore_list.map((ign) => (
                      <span key={ign} className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 font-mono text-[10px]">
                        {ign}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIVE REGEX SIMULATOR & TESTER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-3.5 shadow-inner">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs sm:text-sm text-cyan-300 flex items-center gap-2">
            <Play className="w-4 h-4 text-cyan-400 fill-current" />
            <span>{lang === "fa" ? "شبیه‌ساز و تست زنده الگو (Live Simulator):" : "Live Regex Simulator & Tester:"}</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            {lang === "fa" ? "تست فوری بدون ارسال به تلگرام" : "Instant local dry-run"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-slate-300 font-medium text-[11px]">
              {lang === "fa" ? "پیام ورودی فرضی مشتری:" : "Simulated incoming text:"}
            </label>
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              placeholder="پیام تستی..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium text-[11px]">
              {lang === "fa" ? "شناسه فرستنده فرضی:" : "Simulated sender ID / @user:"}
            </label>
            <input
              type="text"
              value={testSender}
              onChange={(e) => setTestSender(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
              placeholder="@test_user یا 102030"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleTestSimulator}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{lang === "fa" ? "بررسی و آزمودن تطبیق 🧪" : "Run Match Test 🧪"}</span>
          </button>
        </div>

        {/* Test Result Box */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
              testResult.ignored
                ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                : testResult.matched
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {testResult.ignored ? (
                <Shield className="w-4 h-4 text-rose-400" />
              ) : testResult.matched ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-slate-400" />
              )}
              <span>{testResult.reason}</span>
            </div>

            {testResult.matches && testResult.matches.length > 0 && (
              <div className="text-[11px] font-mono space-x-1">
                <span className="text-slate-400">بخش تطبیق‌یافته: </span>
                <span className="px-2 py-0.5 rounded bg-black/60 text-amber-300 border border-slate-800">
                  {testResult.matches[0]}
                </span>
              </div>
            )}

            {testResult.replyPreview && (
              <div className="p-2 rounded-lg bg-black/50 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-mono">
                  {lang === "fa" ? "پیش‌نمایش پیام ارسالی به تلگرام:" : "Generated Reply Preview:"}
                </span>
                <p className="text-white text-xs">{testResult.replyPreview}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER SAVE BUTTON */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div>
          {feedback && (
            <div
              className={`text-xs font-bold flex items-center gap-1.5 animate-in fade-in ${
                feedback.type === "success" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4 stroke-[3]" />
          )}
          <span>{saving ? (lang === "fa" ? "در حال ذخیره..." : "Saving...") : (lang === "fa" ? "ذخیره تمام تنظیمات فیلترها 💾" : "Save All Filters 💾")}</span>
        </button>
      </div>

      {/* RULE EDITOR MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div
            className="w-full max-w-lg bg-[#050b07] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-4 max-h-[92vh] overflow-y-auto"
            dir={lang === "fa" ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span>
                  {editingRuleId
                    ? lang === "fa"
                      ? "ویرایش قانون فیلتر هوشمند"
                      : "Edit Regex Rule"
                    : lang === "fa"
                    ? "ایجاد قانون فیلتر هوشمند جدید"
                    : "Create New Regex Rule"}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  {lang === "fa" ? "نام یا عنوان قانون:" : "Rule Name / Title:"}
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="مثال: پاسخ خودکار استعلام قیمت"
                  className="w-full bg-black border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Regex Pattern & Flags */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    {lang === "fa" ? "الگوی رِجکس (Regex Pattern):" : "Regex Pattern:"}
                  </label>
                  <input
                    type="text"
                    value={rulePattern}
                    onChange={(e) => setRulePattern(e.target.value)}
                    placeholder="^(قیمت|تعرفه|نرخ)"
                    className="w-full bg-black border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono placeholder-slate-600 focus:border-amber-500 focus:outline-none text-xs"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    {lang === "fa" ? "فلگ‌ها (Flags):" : "Flags:"}
                  </label>
                  <input
                    type="text"
                    value={ruleFlags}
                    onChange={(e) => setRuleFlags(e.target.value)}
                    placeholder="i"
                    className="w-full bg-black border border-slate-800 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-amber-500 focus:outline-none text-xs text-center"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="p-2 rounded-xl bg-black/40 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                <span className="text-amber-400 font-bold block">راهنمای سریع الگوها:</span>
                <span>• <code>^کلمه</code>: پیام باید با این کلمه شروع شود.</span>
                <span className="block">• <code>(الف|ب|ج)</code>: تطبیق با هر یک از این گزینه‌ها.</span>
                <span className="block">• <code>\b</code>: مرز کلمه انگلیسی | <code>09\d&#123;9&#125;</code>: شماره موبایل ایران</span>
              </div>

              {/* Reply Text */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block flex justify-between">
                  <span>{lang === "fa" ? "متن پاسخ خودکار:" : "Auto-Reply Message Text:"}</span>
                  <span className="text-slate-500 text-[10px]">
                    متغیرها: {"{match}"} ، {"{name}"} ، {"{time}"}
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={ruleReplyText}
                  onChange={(e) => setRuleReplyText(e.target.value)}
                  placeholder="سلام {name} عزیز! قیمت‌ها در کانال پین شده است."
                  className="w-full bg-black border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Delay Slider */}
              <div className="space-y-1.5 p-3 rounded-xl bg-black/50 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{lang === "fa" ? "تاخیر قبل از ارسال پاسخ (ثانیه):" : "Reply Delay (Seconds):"}</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                    {ruleDelay} {lang === "fa" ? "ثانیه" : "s"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={ruleDelay}
                  onChange={(e) => setRuleDelay(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Rule Ignore List */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block flex justify-between">
                  <span>{lang === "fa" ? "لیست سیاه اختصاصی این قانون (Ignore-List):" : "Rule-Specific Ignore List:"}</span>
                  <span className="text-slate-500 text-[10px]">شناسه یا @آیدی</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ruleIgnoreInput}
                    onChange={(e) => setRuleIgnoreInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRuleIgnore();
                      }
                    }}
                    placeholder="@spambot یا 12345"
                    className="flex-1 bg-black border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs placeholder-slate-600"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleAddRuleIgnore}
                    className="px-3 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold"
                  >
                    افزودن
                  </button>
                </div>

                {ruleIgnoreList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ruleIgnoreList.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[10px] font-mono"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRuleIgnore(tag)}
                          className="hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  {lang === "fa" ? "توضیحات اختیاری:" : "Optional Description:"}
                </label>
                <input
                  type="text"
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="یادداشت جهت مدیریت آسان‌تر"
                  className="w-full bg-black border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={ruleActive}
                  onChange={(e) => setRuleActive(e.target.checked)}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
                <span className="text-slate-200 font-bold">
                  {lang === "fa" ? "این قانون فوراً فعال شود" : "Enable this rule immediately"}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveRuleForm}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{editingRuleId ? "ثبت تغییرات قانون" : "افزودن قانون به فهرست"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
