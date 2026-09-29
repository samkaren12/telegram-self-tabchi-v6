import React, { useState } from "react";
import {
  CreditCard,
  Coins,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Wallet,
  Landmark,
} from "lucide-react";
import {
  StorePaymentSettings,
  StorePaymentCardItem,
  StorePaymentCryptoNetwork,
} from "../../types";

interface PaymentMethodsManagerProps {
  payments: StorePaymentSettings;
  onUpdatePayments: (updated: StorePaymentSettings) => void;
  showToast: (type: "success" | "error", text: string) => void;
}

export function PaymentMethodsManager({
  payments,
  onUpdatePayments,
  showToast,
}: PaymentMethodsManagerProps) {
  // Bank card modal state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<StorePaymentCardItem | null>(null);
  const [cardForm, setCardForm] = useState<Partial<StorePaymentCardItem>>({
    bankName: "",
    cardNumber: "",
    cardHolder: "",
    shabaNumber: "",
    instructions: "",
    isActive: true,
    color: "cyan",
  });

  // Crypto modal state
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState<StorePaymentCryptoNetwork | null>(null);
  const [cryptoForm, setCryptoForm] = useState<Partial<StorePaymentCryptoNetwork>>({
    name: "",
    symbol: "USDT",
    network: "TRC20",
    walletAddress: "",
    memo: "",
    instructions: "",
    isActive: true,
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cards = payments.cards || [
    {
      id: "card-primary",
      bankName: payments.cardPayment.bankName || "بانک سامان",
      cardNumber: payments.cardPayment.cardNumber || "6219861012345678",
      cardHolder: payments.cardPayment.cardHolder || "مدیریت سرور",
      shabaNumber: payments.cardPayment.shabaNumber,
      instructions: payments.cardPayment.instructions,
      isActive: payments.cardPayment.enabled,
      color: "cyan",
    },
  ];

  const cryptoNetworks = payments.cryptoPayment.networks || [];

  // Toggle Card
  const handleToggleCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/store-bot/payments/cards/${cardId}/toggle`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (json.success) {
        const updatedCards = cards.map((c) => (c.id === cardId ? json.card : c));
        onUpdatePayments({ ...payments, cards: updatedCards });
        showToast("success", json.message);
      } else {
        // Fallback local toggle
        const updatedCards = cards.map((c) => (c.id === cardId ? { ...c, isActive: !c.isActive } : c));
        onUpdatePayments({ ...payments, cards: updatedCards });
        showToast("success", "وضعیت حساب بروز شد.");
      }
    } catch (_) {
      const updatedCards = cards.map((c) => (c.id === cardId ? { ...c, isActive: !c.isActive } : c));
      onUpdatePayments({ ...payments, cards: updatedCards });
      showToast("success", "وضعیت حساب بروز شد.");
    }
  };

  // Delete Card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("آیا از حذف این حساب بانکی اطمینان دارید؟")) return;
    try {
      await fetch(`/api/store-bot/payments/cards/${cardId}`, { method: "DELETE" });
      const updatedCards = cards.filter((c) => c.id !== cardId);
      onUpdatePayments({ ...payments, cards: updatedCards });
      showToast("success", "حساب بانکی حذف شد.");
    } catch (_) {
      const updatedCards = cards.filter((c) => c.id !== cardId);
      onUpdatePayments({ ...payments, cards: updatedCards });
      showToast("success", "حساب بانکی حذف شد.");
    }
  };

  // Save Card (Add or Edit)
  const handleSaveCard = async () => {
    if (!cardForm.bankName || !cardForm.cardNumber || !cardForm.cardHolder) {
      showToast("error", "نام بانک، شماره کارت و نام صاحب حساب الزامی هستند.");
      return;
    }

    try {
      if (editingCard) {
        const res = await fetch(`/api/store-bot/payments/cards/${editingCard.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cardForm),
        });
        const json = await res.json();
        const updated = json.card || { ...editingCard, ...cardForm };
        const updatedCards = cards.map((c) => (c.id === editingCard.id ? updated : c));
        onUpdatePayments({ ...payments, cards: updatedCards });
        showToast("success", "اطلاعات حساب بانکی بروزرسانی شد.");
      } else {
        const res = await fetch("/api/store-bot/payments/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cardForm),
        });
        const json = await res.json();
        const newCard = json.card || {
          ...cardForm,
          id: `card-${Date.now()}`,
          isActive: true,
        };
        onUpdatePayments({ ...payments, cards: [...cards, newCard] });
        showToast("success", "حساب بانکی جدید با موفقیت اضافه شد.");
      }
      setIsCardModalOpen(false);
      setEditingCard(null);
    } catch (_) {
      showToast("error", "خطا در برقراری ارتباط با سرور");
    }
  };

  // Toggle Crypto
  const handleToggleCrypto = async (netId: string) => {
    try {
      const res = await fetch(`/api/store-bot/payments/crypto/${netId}/toggle`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (json.success) {
        const updatedNets = cryptoNetworks.map((n) => (n.id === netId ? json.network : n));
        onUpdatePayments({
          ...payments,
          cryptoPayment: { ...payments.cryptoPayment, networks: updatedNets },
        });
        showToast("success", json.message);
      } else {
        const updatedNets = cryptoNetworks.map((n) => (n.id === netId ? { ...n, isActive: !n.isActive } : n));
        onUpdatePayments({
          ...payments,
          cryptoPayment: { ...payments.cryptoPayment, networks: updatedNets },
        });
        showToast("success", "وضعیت والت بروزرسانی شد.");
      }
    } catch (_) {
      const updatedNets = cryptoNetworks.map((n) => (n.id === netId ? { ...n, isActive: !n.isActive } : n));
      onUpdatePayments({
        ...payments,
        cryptoPayment: { ...payments.cryptoPayment, networks: updatedNets },
      });
      showToast("success", "وضعیت والت بروزرسانی شد.");
    }
  };

  // Delete Crypto
  const handleDeleteCrypto = async (netId: string) => {
    if (!confirm("آیا از حذف این والت ارز دیجیتال اطمینان دارید؟")) return;
    try {
      await fetch(`/api/store-bot/payments/crypto/${netId}`, { method: "DELETE" });
      const updatedNets = cryptoNetworks.filter((n) => n.id !== netId);
      onUpdatePayments({
        ...payments,
        cryptoPayment: { ...payments.cryptoPayment, networks: updatedNets },
      });
      showToast("success", "کیف پول با موفقیت حذف گردید.");
    } catch (_) {
      const updatedNets = cryptoNetworks.filter((n) => n.id !== netId);
      onUpdatePayments({
        ...payments,
        cryptoPayment: { ...payments.cryptoPayment, networks: updatedNets },
      });
      showToast("success", "کیف پول حذف شد.");
    }
  };

  // Save Crypto (Add or Edit)
  const handleSaveCrypto = async () => {
    if (!cryptoForm.name || !cryptoForm.walletAddress) {
      showToast("error", "نام ارز و آدرس کیف پول الزامی هستند.");
      return;
    }

    try {
      if (editingCrypto) {
        const res = await fetch(`/api/store-bot/payments/crypto/${editingCrypto.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cryptoForm),
        });
        const json = await res.json();
        const updated = json.network || { ...editingCrypto, ...cryptoForm };
        const updatedNets = cryptoNetworks.map((n) => (n.id === editingCrypto.id ? updated : n));
        onUpdatePayments({
          ...payments,
          cryptoPayment: { ...payments.cryptoPayment, networks: updatedNets },
        });
        showToast("success", "اطلاعات والت کریپتو بروزرسانی شد.");
      } else {
        const res = await fetch("/api/store-bot/payments/crypto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cryptoForm),
        });
        const json = await res.json();
        const newNet = json.network || {
          ...cryptoForm,
          id: `net-${Date.now()}`,
          isActive: true,
        };
        onUpdatePayments({
          ...payments,
          cryptoPayment: { ...payments.cryptoPayment, networks: [...cryptoNetworks, newNet] },
        });
        showToast("success", "ارز دیجیتال جدید اضافه شد.");
      }
      setIsCryptoModalOpen(false);
      setEditingCrypto(null);
    } catch (_) {
      showToast("error", "خطا در برقراری ارتباط با سرور");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. BANK CARDS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">حساب‌ها و کارت‌های بانکی شتاب (کارت به کارت)</h3>
              <p className="text-xs text-slate-400">
                افزودن و فعال/غیرفعال‌سازی چندین شماره کارت بانکی برای پرداخت مشتریان در ربات
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingCard(null);
              setCardForm({
                bankName: "",
                cardNumber: "",
                cardHolder: "",
                shabaNumber: "",
                instructions: "لطفاً پس از واریز، تصویر فیش یا کد پیگیری را ارسال نمایید.",
                isActive: true,
                color: "cyan",
              });
              setIsCardModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all self-end sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن حساب بانکی جدید</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div
              key={c.id}
              className={`bg-slate-900/80 border rounded-2xl p-5 space-y-4 relative flex flex-col justify-between transition-all shadow-lg ${
                c.isActive ? "border-cyan-500/40 shadow-cyan-500/5" : "border-slate-800/60 opacity-60"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span>{c.bankName}</span>
                  </span>
                  <button
                    onClick={() => handleToggleCard(c.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      c.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                    <span>{c.isActive ? "فعال در ربات" : "غیرفعال"}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">شماره کارت:</span>
                    <button
                      onClick={() => copyToClipboard(c.cardNumber, c.id + "_card")}
                      className="text-cyan-300 hover:text-cyan-200 text-xs font-bold tracking-wider flex items-center gap-1"
                    >
                      {copiedId === c.id + "_card" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{c.cardNumber.replace(/(\d{4})/g, "$1 ").trim()}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400">به نام: </span>
                    <strong>{c.cardHolder}</strong>
                  </div>

                  {c.shabaNumber && (
                    <div className="text-[11px] text-slate-400 truncate" dir="ltr">
                      IBAN: {c.shabaNumber}
                    </div>
                  )}
                </div>

                {c.instructions && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {c.instructions}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setEditingCard(c);
                    setCardForm(c);
                    setIsCardModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="ویرایش حساب"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCard(c.id)}
                  className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors"
                  title="حذف حساب"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CRYPTO NETWORKS SECTION */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ارزهای دیجیتال و کیف‌پول‌ها (USDT, TON, TRX, BTC)</h3>
              <p className="text-xs text-slate-400">
                تعریف شبکه‌ها و والت‌های جدید جهت پرداخت دلاری و بین‌المللی مشتریان
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingCrypto(null);
              setCryptoForm({
                name: "",
                symbol: "USDT",
                network: "TRC20",
                walletAddress: "",
                memo: "",
                instructions: "پس از واریز هش تراکنش (TXID) را ارسال نمایید.",
                isActive: true,
              });
              setIsCryptoModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all self-end sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن ارز دیجیتال جدید</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoNetworks.map((n) => (
            <div
              key={n.id}
              className={`bg-slate-900/80 border rounded-2xl p-5 space-y-4 relative flex flex-col justify-between transition-all shadow-lg ${
                n.isActive ? "border-purple-500/40 shadow-purple-500/5" : "border-slate-800/60 opacity-60"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">{n.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300">
                      {n.network}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleCrypto(n.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      n.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${n.isActive ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                    <span>{n.isActive ? "فعال" : "غیرفعال"}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
                  <div className="text-slate-400 text-[11px]">آدرس والت:</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-purple-300 break-all text-[11px]" dir="ltr">
                      {n.walletAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(n.walletAddress, n.id + "_addr")}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 flex-shrink-0"
                    >
                      {copiedId === n.id + "_addr" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {n.memo && (
                    <div className="text-[11px] text-amber-300 pt-1 border-t border-slate-800">
                      تگ / ممو: {n.memo}
                    </div>
                  )}
                </div>

                {n.instructions && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {n.instructions}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setEditingCrypto(n);
                    setCryptoForm(n);
                    setIsCryptoModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="ویرایش والت"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCrypto(n.id)}
                  className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors"
                  title="حذف والت"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD / EDIT BANK CARD */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingCard ? "ویرایش حساب بانکی" : "افزودن حساب و کارت بانکی جدید"}
              </h3>
              <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">نام بانک</label>
                <input
                  type="text"
                  value={cardForm.bankName || ""}
                  onChange={(e) => setCardForm({ ...cardForm, bankName: e.target.value })}
                  placeholder="مثال: بانک سامان / ملی / بلوبانک"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">شماره کارت ۱۶ رقمی</label>
                <input
                  type="text"
                  value={cardForm.cardNumber || ""}
                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                  placeholder="6219861012345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-cyan-300 tracking-wider outline-none focus:border-cyan-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">نام و نام خانوادگی صاحب حساب</label>
                <input
                  type="text"
                  value={cardForm.cardHolder || ""}
                  onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                  placeholder="نام دارنده حساب"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">شماره شبا (اختیاری)</label>
                <input
                  type="text"
                  value={cardForm.shabaNumber || ""}
                  onChange={(e) => setCardForm({ ...cardForm, shabaNumber: e.target.value })}
                  placeholder="IR120560000000000000000000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white outline-none focus:border-cyan-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">توضیحات واریز برای مشتری</label>
                <textarea
                  rows={2}
                  value={cardForm.instructions || ""}
                  onChange={(e) => setCardForm({ ...cardForm, instructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={cardForm.isActive}
                  onChange={(e) => setCardForm({ ...cardForm, isActive: e.target.checked })}
                  className="rounded bg-slate-800 text-cyan-500"
                />
                <span className="text-xs text-slate-300 font-semibold">این حساب در ربات فعال باشد</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveCard}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md"
              >
                ذخیره حساب بانکی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CRYPTO NETWORK */}
      {isCryptoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingCrypto ? "ویرایش ارز دیجیتال" : "افزودن ارز دیجیتال یا والت جدید"}
              </h3>
              <button onClick={() => setIsCryptoModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">نام ارز و شبکه</label>
                <input
                  type="text"
                  value={cryptoForm.name || ""}
                  onChange={(e) => setCryptoForm({ ...cryptoForm, name: e.target.value })}
                  placeholder="مثال: USDT (TRC20) یا Bitcoin (BTC)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">نماد ارز (Symbol)</label>
                  <input
                    type="text"
                    value={cryptoForm.symbol || ""}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, symbol: e.target.value.toUpperCase() })}
                    placeholder="USDT / TON / BTC"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white uppercase outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">شبکه انتقال (Network)</label>
                  <input
                    type="text"
                    value={cryptoForm.network || ""}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, network: e.target.value })}
                    placeholder="TRC-20 / TON / BEP-20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">آدرس کیف پول (Wallet Address)</label>
                <input
                  type="text"
                  value={cryptoForm.walletAddress || ""}
                  onChange={(e) => setCryptoForm({ ...cryptoForm, walletAddress: e.target.value })}
                  placeholder="آدرس کیف پول..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-purple-300 outline-none focus:border-purple-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">تگ یا ممو (اختیاری)</label>
                <input
                  type="text"
                  value={cryptoForm.memo || ""}
                  onChange={(e) => setCryptoForm({ ...cryptoForm, memo: e.target.value })}
                  placeholder="Tag / Memo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white outline-none focus:border-purple-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">توضیحات واریز ارزی</label>
                <textarea
                  rows={2}
                  value={cryptoForm.instructions || ""}
                  onChange={(e) => setCryptoForm({ ...cryptoForm, instructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={cryptoForm.isActive}
                  onChange={(e) => setCryptoForm({ ...cryptoForm, isActive: e.target.checked })}
                  className="rounded bg-slate-800 text-purple-500"
                />
                <span className="text-xs text-slate-300 font-semibold">این درگاه ارزی در ربات فعال باشد</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsCryptoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveCrypto}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
              >
                ذخیره والت کریپتو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
