import React, { useState } from "react";
import {
  FolderPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Layers,
  ArrowUpDown,
  Smile,
  Palette,
  Eye,
  Plus,
  RefreshCw,
  Info,
} from "lucide-react";
import { StoreCategory } from "../../types";
import { Language } from "../../utils/i18n";
import { useConfirm } from "../ui/ConfirmProvider";

interface CategoriesManagerProps {
  categories: StoreCategory[];
  lang: Language;
  onRefresh: () => void;
  showToast: (type: "success" | "error", text: string) => void;
}

const COLOR_OPTIONS = [
  { id: "cyan", name: "فیروزه‌ای سایبر (Cyan)", bg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { id: "emerald", name: "سبز ماتریکس (Emerald)", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "purple", name: "بنفش کهکشانی (Purple)", bg: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "amber", name: "طلایی لوکس (Amber)", bg: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "rose", name: "قرمز آتشین (Rose)", bg: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  { id: "blue", name: "آبی کلاسیک (Blue)", bg: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
];

const POPULAR_EMOJIS = ["💎", "🚀", "⚡", "👑", "🔥", "🛡️", "🌟", "🪐", "🤖", "💰", "🔮", "✨"];

export function CategoriesManager({
  categories,
  lang,
  onRefresh,
  showToast,
}: CategoriesManagerProps) {
  const { confirm } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("💎");
  const [badge, setBadge] = useState("");
  const [color, setColor] = useState("cyan");
  const [customEmojiId, setCustomEmojiId] = useState("");
  const [orderIndex, setOrderIndex] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingCategory(null);
    setTitle("");
    setDescription("");
    setIcon("💎");
    setBadge("");
    setColor("cyan");
    setCustomEmojiId("");
    setOrderIndex(categories.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: StoreCategory) => {
    setEditingCategory(cat);
    setTitle(cat.title);
    setDescription(cat.description || "");
    setIcon(cat.icon || "💎");
    setBadge(cat.badge || "");
    setColor(cat.color || "cyan");
    setCustomEmojiId(cat.customEmojiId || "");
    setOrderIndex(cat.orderIndex || 1);
    setIsActive(cat.isActive !== false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("error", "عنوان دسته‌بندی را وارد کنید.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        icon,
        badge: badge.trim(),
        color,
        customEmojiId: customEmojiId.trim(),
        orderIndex: Number(orderIndex) || 1,
        isActive,
      };

      const url = editingCategory
        ? `/api/store-bot/categories/${editingCategory.id}`
        : `/api/store-bot/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "خطا در ذخیره دسته‌بندی");
      }

      showToast(
        "success",
        editingCategory
          ? "دسته‌بندی با موفقیت ویرایش شد."
          : "دسته‌بندی جدید با موفقیت اضافه شد."
      );
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: StoreCategory) => {
    try {
      const res = await fetch(`/api/store-bot/categories/${cat.id}/toggle`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "خطا در تغییر وضعیت دسته‌بندی");
      }
      showToast("success", json.message || "وضعیت دسته‌بندی بروز شد.");
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDelete = async (cat: StoreCategory) => {
    const ok = await confirm({
      title: `حذف دسته‌بندی «${cat.title}»`,
      message:
        "آیا مطمئن هستید که می‌خواهید این دسته‌بندی را حذف کنید؟ این تغییر بلافاصله از ربات تلگرام حذف خواهد شد.",
      confirmText: "بله، حذف کن",
      cancelText: "انصراف",
      danger: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/store-bot/categories/${cat.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "خطا در حذف دسته‌بندی");
      }
      showToast("success", "دسته‌بندی با موفقیت حذف گردید.");
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-cyan-950/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-100">
              مدیریت دسته‌بندی‌های ربات فروشگاه
            </h3>
            <span className="px-2 py-0.5 text-xs bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/30">
              {categories.length} دسته
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            دسته‌بندی‌های اختصاصی بسازید، آن‌ها را فعال/غیرفعال یا حذف کنید، رنگ دکمه، ترتیب نمایش و ایموجی پرمیوم تلگرام را به دلخواه تنظیم نمایید.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
        >
          <FolderPlus className="w-4 h-4" />
          افزودن دسته‌بندی جدید
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, idx) => {
          const colorObj = COLOR_OPTIONS.find((c) => c.id === cat.color) || COLOR_OPTIONS[0];

          return (
            <div
              key={cat.id}
              className={`relative bg-slate-900/70 border rounded-2xl p-5 backdrop-blur-lg transition-all duration-200 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-950/20 flex flex-col justify-between ${
                cat.isActive
                  ? "border-slate-800/90 shadow-md"
                  : "border-slate-800/40 opacity-70 bg-slate-950/60"
              }`}
            >
              {/* Badge & Order indicator */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                    {cat.icon || "📁"}
                  </span>
                  <div>
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: {cat.id}
                    </span>
                    <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      {cat.title}
                    </h4>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {cat.badge && (
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${colorObj.bg}`}
                    >
                      {cat.badge}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">
                    ترتیب: #{cat.orderIndex || idx + 1}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 mb-4 line-clamp-2 min-h-[32px]">
                {cat.description || "بدون توضیح اختصاصی."}
              </p>

              {/* Telegram Premium Emoji ID Indicator */}
              {cat.customEmojiId && (
                <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate font-mono">
                    ایموجی پرمیوم: {cat.customEmojiId}
                  </span>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    cat.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
                  }`}
                >
                  {cat.isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      فعال در ربات
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      غیرفعال و مخفی
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                    title="ویرایش دسته‌بندی"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="حذف دسته‌بندی"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                <h4 className="text-base font-bold text-slate-100">
                  {editingCategory ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}
                </h4>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title & Icon */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    عنوان دسته‌بندی *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: اکانت‌های سلف زمان‌دار VIP"
                    required
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    آیکون
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-2 text-center text-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Quick Emojis Bar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">انتخاب سریع:</span>
                {POPULAR_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setIcon(em)}
                    className={`px-2 py-1 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 transition-all ${
                      icon === em ? "ring-2 ring-cyan-400" : ""
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  توضیحات کوتاه
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحاتی که زیر عنوان در ربات و پنل نمایش داده می‌شود..."
                  rows={2}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Badge & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    بج یا نشان تبلیغاتی (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="مثال: پرفروش، محبوب‌ترین"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ترتیب نمایش در منو
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Color Scheme */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  رنگ نشان و تم دکمه
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold text-right transition-all flex items-center justify-between ${
                        c.bg
                      } ${color === c.id ? "ring-2 ring-white shadow-lg" : "opacity-75"}`}
                    >
                      <span className="truncate">{c.name.split(" ")[0]}</span>
                      {color === c.id && <span className="text-white text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telegram Custom Premium Emoji ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  شناسه ایموجی پرمیوم تلگرام (Custom Emoji ID)
                </label>
                <input
                  type="text"
                  value={customEmojiId}
                  onChange={(e) => setCustomEmojiId(e.target.value)}
                  placeholder="مثال: 5368324170671202288"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  در صورت داشتن اشتراک پرمیوم تلگرام، می‌توانید آیدی ایموجی‌های متحرک و سفارشی را وارد کنید تا در دکمه‌های شیشه‌ای نمایش داده شود.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300">
                  وضعیت فعال‌سازی در ربات تلگرام
                </span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {isActive ? "🟢 فعال (نمایش در منو)" : "🔴 غیرفعال (پنهان)"}
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingCategory ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
