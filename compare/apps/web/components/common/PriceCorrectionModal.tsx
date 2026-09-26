"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface PriceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityId: string;
  cityName: string;
  categoryCode: string;
  categoryLabel: string;
  currentValueMajor: number;
  currencyCode: "EUR" | "JPY" | "IDR" | "USD";
  onSuccess?: (newValMajor: number) => void;
}

export function PriceCorrectionModal({
  isOpen,
  onClose,
  cityId,
  cityName,
  categoryCode,
  categoryLabel,
  currentValueMajor,
  currencyCode,
  onSuccess,
}: PriceCorrectionModalProps) {
  const { locale } = useI18n();
  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const [newPrice, setNewPrice] = useState(currentValueMajor.toString());
  const [userName, setUserName] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currencySymbol =
    currencyCode === "EUR" ? "€" : currencyCode === "JPY" ? "¥" : currencyCode === "IDR" ? "Rp" : "$";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const parsedPrice = parseFloat(newPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error(txt("Masukkan nominal harga yang valid", "Please enter a valid price", "有効な金額を入力してください"));
      }

      const res = await fetch("/api/benchmarks/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_id: cityId,
          category_code: categoryCode,
          corrected_value_major: parsedPrice,
          currency_code: currencyCode,
          user_identifier: userName.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || txt("Gagal memperbarui harga", "Failed to update price", "価格の更新に失敗しました"));
      }

      setSuccessMessage(
        txt(
          "✅ Berhasil! Harga baru tersimpan dan tercatat di database.",
          "✅ Success! Updated price is recorded in the database.",
          "✅ 成功！更新された価格がデータベースに記録されました。"
        )
      );

      if (onSuccess) {
        onSuccess(parsedPrice);
      }

      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 space-y-5 border border-white/15 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition-colors"
        >
          ✕
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <h3 className="text-lg font-bold text-white">
              {txt("Koreksi / Update Harga", "Correct / Update Price", "価格の修正・更新")}
            </h3>
          </div>
          <p className="text-xs text-white/60">
            {cityName} • {categoryLabel}
          </p>
        </div>

        {successMessage ? (
          <div className="rounded-xl p-4 bg-brand-500/10 border border-brand-500/30 text-brand-300 text-sm font-medium text-center">
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {errorMessage && (
              <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                {txt(`Harga Saat Ini (${currencySymbol})`, `Current Value (${currencySymbol})`, `現在の登録価格 (${currencySymbol})`)}
              </label>
              <div className="font-mono text-sm text-white/40 bg-white/5 p-2.5 rounded-lg border border-white/5">
                {currencySymbol} {currentValueMajor.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                {txt(`Harga Baru / Hasil Pengamatan (${currencySymbol})`, `New Observed Price (${currencySymbol})`, `新しい実勢価格 (${currencySymbol})`)}
              </label>
              <input
                type="number"
                step="any"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="form-input w-full font-mono text-base font-semibold text-brand-300 bg-white/10 border-brand-500/50 focus:border-brand-400"
                placeholder="550"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                {txt("Nama / Panggilan (Opsional)", "Your Name / Nickname (Optional)", "ニックネーム（任意）")}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="form-input w-full text-xs"
                placeholder={txt("Anonim / Mahasiswa Hamburg", "Anonymous / Local Resident", "匿名 / 現地在住者")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                {txt("Catatan Sumber / Kondisi (Opsional)", "Notes / Source Context (Optional)", "補足情報・メモ（任意）")}
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-input w-full text-xs resize-none"
                placeholder={txt("Contoh: Kontrak baru WG 2026 sudah naik...", "e.g. Recent housing price jump in 2026...", "例：2026年契約改定で値上がり...")}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                {txt("Batal", "Cancel", "キャンセル")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 py-2 text-xs font-semibold"
              >
                {isSubmitting
                  ? txt("Menyimpan...", "Saving...", "保存中...")
                  : txt("💾 Simpan ke Database", "💾 Save to Database", "💾 データベースに保存")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
