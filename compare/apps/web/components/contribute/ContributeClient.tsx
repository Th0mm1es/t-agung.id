"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import type { City, Country } from "@bandinghidup/core";

export function ContributeClient() {
  const { locale } = useI18n();

  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const [cityId, setCityId] = useState("");
  const [categoryCode, setCategoryCode] = useState("housing");
  const [currencyCode, setCurrencyCode] = useState<"EUR" | "JPY" | "IDR">("EUR");
  const [amountMajor, setAmountMajor] = useState("450");
  const [housingType, setHousingType] = useState<string>("shared_room");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletionToken, setDeletionToken] = useState<string | null>(null);

  const { data: countries } = useQuery<Country[]>({
    queryKey: ["countries-contribute"],
    queryFn: async () => {
      const { data, error } = await supabase.from("countries").select("*");
      if (error) throw error;
      return data as Country[];
    },
  });

  const { data: cities } = useQuery<City[]>({
    queryKey: ["cities-contribute"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").order("name");
      if (error) throw error;
      return data as City[];
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setDeletionToken(null);

    try {
      const res = await fetch("/api/community/observe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_id: cityId,
          category_code: categoryCode,
          amount_major: parseFloat(amountMajor),
          currency_code: currencyCode,
          housing_type: categoryCode === "housing" ? housingType : undefined,
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Submission failed");
      }

      const json = await res.json();
      setDeletionToken(json.deletionToken);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <span className="badge-brand text-xs">💬 {txt("Kontribusi Anonim", "Anonymous Contribution", "完全匿名データコントリビューション")}</span>
        <h1 className="text-2xl font-display font-bold text-white">
          {txt("Bagikan Pengamatan Harga Lokal", "Share Local Price Observation", "現地の物価・生活費データを共有")}
        </h1>
        <p className="text-sm text-white/50">
          {txt(
            "Bantu sesama peserta magang & mahasiswa dengan membagikan pengamatan harga riil di kotamu. Tanpa akun, 100% anonim.",
            "Help fellow trainees & students by sharing real price observations in your city. Zero accounts, 100% anonymous.",
            "アカウント登録不要・完全匿名。あなたの街の実勢物価や家賃データを共有して、後輩の技能実習生や留学生の海外挑戦を支えましょう。"
          )}
        </p>
      </div>

      {deletionToken ? (
        <div className="glass-card p-6 space-y-4 animate-fade-in border-l-4 border-l-brand-400">
          <div className="text-xl font-bold text-brand-400">
            ✅ {txt("Pengamatan Terkirim!", "Observation Submitted!", "データが正常に送信されました！")}
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            {txt(
              "Pengamatan hargamu telah masuk ke antrean moderasi. Simpan Kunci Hapus privatmu di bawah ini jika ingin menghapusnya nanti.",
              "Your price observation has entered the moderation queue. Save your private Deletion Key below if you wish to delete it later.",
              "投稿データは確認キューに入りました。将来データを削除したい場合に備えて、以下のプライベート削除キーを保管してください。"
            )}
          </p>

          <div className="p-3 rounded-lg bg-white/5 font-mono text-xs text-brand-300 break-all select-all">
            {deletionToken}
          </div>

          <button
            onClick={() => {
              setDeletionToken(null);
              setNote("");
            }}
            className="btn-secondary w-full py-3 text-sm"
          >
            {txt("Kirim Pengamatan Lain", "Submit Another Observation", "別のデータを投稿する")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          {/* City */}
          <div className="space-y-1.5">
            <label htmlFor="contribute-city-select" className="block text-sm font-medium text-white/80">
              {txt("Kota", "City", "対象都市")}
            </label>
            <select
              id="contribute-city-select"
              required
              className="form-select text-sm"
              value={cityId}
              onChange={(e) => {
                const c = cities?.find((x) => x.id === e.target.value);
                setCityId(e.target.value);
                if (c && countries) {
                  const co = countries.find((x) => x.id === c.country_id);
                  const curr = co?.code === "DE" ? "EUR" : co?.code === "JP" ? "JPY" : "IDR";
                  setCurrencyCode(curr as any);
                }
              }}
            >
              <option value="" disabled>
                {txt("— Pilih Kota —", "— Select City —", "— 都市を選択 —")}
              </option>
              {cities?.map((c) => {
                const co = countries?.find((x) => x.id === c.country_id);
                const flag = co?.code === "DE" ? "🇩🇪" : co?.code === "JP" ? "🇯🇵" : "🇮🇩";
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({flag})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="contribute-category-select" className="block text-sm font-medium text-white/80">
              {txt("Kategori Pengeluaran", "Expense Category", "支出カテゴリー")}
            </label>
            <select
              id="contribute-category-select"
              className="form-select text-sm"
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
            >
              <option value="housing">{txt("Housing (Sewa Tempat Tinggal)", "Housing (Rent & Accommodation)", "住居費（家賃・共益費）")}</option>
              <option value="food">{txt("Food (Makanan & Groceries)", "Food (Groceries & Dining)", "食費（自炊食材・外食）")}</option>
              <option value="transport">{txt("Transport (Transportasi)", "Transport (Public Transit)", "交通費（電車・バス・定期代）")}</option>
              <option value="utilities">{txt("Utilities (Internet / SIM / Listrik)", "Utilities (Internet / Mobile / Power)", "光熱水費・通信費（電気・水道・SIM）")}</option>
              <option value="lifestyle">{txt("Lifestyle (Hiburan / Social)", "Lifestyle (Leisure & Social)", "娯楽・交際費（レジャー・外食）")}</option>
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="contribute-amount-input" className="block text-sm font-medium text-white/80">
              {txt(`Nominal (${currencyCode}/bulan)`, `Amount (${currencyCode}/month)`, `金額（${currencyCode}/月）`)}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 font-mono text-sm">
                {currencyCode === "EUR" ? "€" : currencyCode === "JPY" ? "¥" : "Rp"}
              </span>
              <input
                id="contribute-amount-input"
                type="number"
                step={currencyCode === "EUR" ? "0.01" : "100"}
                min="1"
                required
                className="form-select pl-8 text-sm"
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
              />
            </div>
          </div>

          {/* Housing Type Tag (if housing) */}
          {categoryCode === "housing" && (
            <div className="space-y-1.5">
              <label htmlFor="housing-type-select" className="block text-sm font-medium text-white/80">
                {txt("Tipe Hunian", "Housing Arrangement", "住居タイプ")}
              </label>
              <select
                id="housing-type-select"
                className="form-select text-sm"
                value={housingType}
                onChange={(e) => setHousingType(e.target.value)}
              >
                <option value="shared_room">{txt("WG / Sharehouse (Kamar Bersama)", "WG / Sharehouse (Shared / Private Room)", "ルームシェア・シェアハウス（WG）")}</option>
                <option value="dormitory">{txt("Company Dormitory (Asrama Perusahaan)", "Company Dormitory", "社員寮・会社提供宿舎")}</option>
                <option value="studio">{txt("Studio Apartment (1K / 1R / Einzelappartment)", "Studio Apartment (1K / 1R)", "ワンルーム・単身アパート（1K/1R）")}</option>
                <option value="one_bedroom">{txt("1-Bedroom Apartment (1LDK / 2-Zimmer)", "1-Bedroom Apartment (1LDK)", "1LDK・2部屋アパート")}</option>
              </select>
            </div>
          )}

          {/* Optional Note with PII Warning */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="contribute-note-input" className="block text-sm font-medium text-white/80">
                {txt("Catatan Kontekstual (Opsional)", "Contextual Note (Optional)", "補足情報・メモ（任意）")}
              </label>
              <span className="text-xs text-brand-400">🔒 Zero PII</span>
            </div>
            <textarea
              id="contribute-note-input"
              rows={2}
              maxLength={500}
              placeholder={txt(
                "Contoh: Sudah termasuk pemanas air (Warmmiete), dekat stasiun.",
                "Example: Includes heating (Warmmiete), near train station.",
                "例：光熱費込み（Warmmiete）、駅徒歩5分、築浅など。"
              )}
              className="form-select text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-white/40 italic">
              {txt(
                "⚠️ Jangan sertakan nama, nomor telepon, alamat lengkap, atau link media sosial.",
                "⚠️ Do not include names, phone numbers, full addresses, or social media handles.",
                "⚠️ 個人名、電話番号、詳細な住所、SNSアカウント等の個人情報は記載しないでください。"
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !cityId}
            className={`btn-primary w-full py-4 font-semibold text-base ${
              !cityId || isSubmitting ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "..." : txt("Kirim Pengamatan →", "Submit Observation →", "データを送信する →")}
          </button>
        </form>
      )}
    </div>
  );
}
