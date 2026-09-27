"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import type { City, Country } from "@bandinghidup/core";

export function ContributeClient() {
  const { locale } = useI18n();

  const txt = (idStr: string, enStr: string, deOrJaStr: string, jaStr?: string) => {
    if (jaStr !== undefined) {
      if (locale === "ja") return jaStr;
      if (locale === "de") return deOrJaStr;
      if (locale === "en") return enStr;
      return idStr;
    }
    if (locale === "ja") return deOrJaStr;
    if (locale === "de") return enStr;
    if (locale === "en") return enStr;
    return idStr;
  };

  const [cityId, setCityId] = useState("");
  const [categoryCode, setCategoryCode] = useState("housing");
  const [currencyCode, setCurrencyCode] = useState<"EUR" | "JPY" | "IDR">("EUR");
  const [amountMajor, setAmountMajor] = useState("450");
  const [housingType, setHousingType] = useState<string>("shared_room");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletionToken, setDeletionToken] = useState<string | null>(null);
  const [submittedCity, setSubmittedCity] = useState<string>("");
  const [submittedCategory, setSubmittedCategory] = useState<string>("");
  const [activeCount, setActiveCount] = useState<number>(48);

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

  // Query live count of approved observations
  const { data: observeData } = useQuery({
    queryKey: ["community-observe-count"],
    queryFn: async () => {
      const res = await fetch("/api/community/observe?status=approved");
      if (!res.ok) return { count: 48 };
      return res.json();
    },
  });

  const liveActiveCount = observeData?.count || activeCount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setDeletionToken(null);

    const selectedCityObj = cities?.find((c) => c.id === cityId);
    const cityNameStr = selectedCityObj?.name || "kotamu";

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
      setSubmittedCity(cityNameStr);
      setSubmittedCategory(categoryCode);
      if (json.activeCount) {
        setActiveCount(json.activeCount);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="badge-brand text-xs">💬 {txt("Kontribusi Anonim", "Anonymous Contribution", "完全匿名データコントリビューション")}</span>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            🌱 {liveActiveCount} {txt("pengamatan aktif", "active observations", "件の有効観測データ")}
          </span>
        </div>
        <h1 className="text-2xl font-display font-bold text-[var(--text)]">
          {txt("Bagikan Pengamatan Harga Lokal", "Share Local Price Observation", "現地の物価・生活費データを共有")}
        </h1>
        <p className="text-sm text-fg-muted">
          {txt(
            "Bantu sesama peserta magang & mahasiswa dengan membagikan pengamatan harga riil di kotamu. Tanpa akun, 100% anonim.",
            "Help fellow trainees & students by sharing real price observations in your city. Zero accounts, 100% anonymous.",
            "アカウント登録不要・完全匿名。あなたの街の実勢物価や家賃データを共有して、後輩の技能実習生や留学生の海外挑戦を支えましょう。"
          )}
        </p>
      </div>

      {deletionToken ? (
        <div className="glass-card p-6 space-y-5 animate-fade-in border-l-4 border-l-[var(--accent)] bg-panel">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="text-lg font-bold text-[var(--text)]">
                {txt("Pengamatan Terkirim & Masuk Antrean!", "Observation Queued for Review!", "データが正常に送信されました！")}
              </h3>
              <p className="text-xs text-[var(--accent)] font-medium">
                {txt(
                  `Pengamatanmu masuk antrean moderasi — setelah diterima, masuk ke median ${submittedCategory} ${submittedCity}.`,
                  `Your observation entered the moderation queue — once approved, it feeds the ${submittedCategory} median for ${submittedCity}.`,
                  `送信データは確認キューに入りました。承認後、${submittedCity}の${submittedCategory}中央値データに統合されます。`
                )}
              </p>
            </div>
          </div>

          {/* Explanation of Data Usage */}
          <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2 text-xs text-fg-70">
            <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>🔒</span>
              <span>{txt("Bagaimana Data Anda Digunakan?", "How Your Data Is Used", "データの活用方針とプライバシー保護")}</span>
            </div>
            <ul className="space-y-1 text-[11px] text-fg-60 list-disc list-inside">
              <li>{txt("Moderasi Ketat: Setiap entri diverifikasi agar bebas spam dan tidak ada outlier ekstrem.", "Strict Moderation: Every entry is reviewed to filter spam and extreme outliers.", "厳格な審査: スパムや極端な外れ値を除外するため事前確認を実施。")}</li>
              <li>{txt("Agregasi Nilai Median: Data hanya digabungkan ke median kota — tidak pernah dipublikasikan secara mentah atau perorangan.", "Median Aggregation: Data is only merged into the city median — never published as raw individual rows.", "中央値集計: 都市全体の中央値として統計処理され、個別データがそのまま公開されることはありません。")}</li>
              <li>{txt("100% Anonim: Tidak ada pelacakan identitas, IP terenkripsi, bebas tanpa login.", "100% Anonymous: Zero identity tracking, encrypted IPs, no login required.", "完全匿名: 個人情報の追跡なし、ログイン不要。")}</li>
            </ul>
          </div>

          {/* Live community count callout */}
          <div className="p-3 rounded-lg bg-[var(--accent-soft)] border border-line-strong flex items-center justify-between text-xs text-[var(--accent)]">
            <span>🌱 {txt("Kontribusi Anda memperkuat basis data:", "Your contribution empowers the community:", "コミュニティの共有資産となります:")}</span>
            <span className="font-mono font-bold">{liveActiveCount + 1} {txt("total pengamatan", "total entries", "件")}</span>
          </div>

          {/* Deletion key section */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-fg-muted block">
              {txt("Kunci Hapus Privat (Simpan jika ingin menghapus pengamatan ini di masa depan):", "Private Deletion Key (Save if you want to delete later):", "プライベート削除キー (後で削除したい場合に保管):")}
            </label>
            <div className="p-3 rounded-lg bg-panel-2 font-mono text-xs text-[var(--accent)] break-all select-all border border-line">
              {deletionToken}
            </div>
          </div>

          {/* Review timeline callout */}
          <div className="p-3.5 rounded-xl bg-accent-500/10 border border-accent-500/20 text-xs space-y-1">
            <div className="font-bold text-accent-300 flex items-center gap-1.5">
              <span>⏱️</span>
              <span>{txt("Estimasi Timeline Review", "Estimated Review Timeline", "Geschätzte Prüfzeit", "審査の所要時間目安")}</span>
            </div>
            <p className="text-[11px] text-fg-70 leading-relaxed">
              {txt(
                "Data Anda akan diverifikasi dan dimoderasi dalam 24–48 jam kerja sebelum diintegrasikan ke perhitungan median harga publik.",
                "Your observation will be verified and reviewed within 24–48 business hours before inclusion in public median benchmarks.",
                "Ihre Eingabe wird innerhalb von 24–48 Arbeitsstunden geprüft und anschließend in die öffentlichen Medianwerte übernommen.",
                "投稿データは24〜48営業時間以内に審査・照合され、承認後に公的中央値統計に反映されます。"
              )}
            </p>
          </div>

          {/* Follow-Action Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a
              href="/"
              className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-line bg-panel hover:bg-panel-2 transition-all flex items-center justify-center gap-2 text-fg-80 hover:text-[var(--text)] shadow-sm"
            >
              <span>←</span>
              <span>{txt("Kembali ke Beranda", "Back to Home", "Zurück zur Startseite", "ホームに戻る")}</span>
            </a>

            <a
              href="/persentil"
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-line-strong hover:bg-[var(--accent)] hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm font-bold"
            >
              <span>📊</span>
              <span>{txt("Jelajahi Persentil Gaji", "Explore Income Percentiles", "Gehaltsperzentile ansehen", "給与パーセンタイルを閲覧")}</span>
            </a>
          </div>

          <button
            onClick={() => {
              setDeletionToken(null);
              setNote("");
            }}
            className="btn-secondary w-full py-2.5 text-xs font-semibold"
          >
            {txt("Kirim Pengamatan Lain", "Submit Another Observation", "Weitere Beobachtung einreichen", "別のデータを投稿する")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          {/* City */}
          <div className="space-y-1.5">
            <label htmlFor="contribute-city-select" className="block text-sm font-medium text-fg-80">
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
            <label htmlFor="contribute-category-select" className="block text-sm font-medium text-fg-80">
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
            <label htmlFor="contribute-amount-input" className="block text-sm font-medium text-fg-80">
              {txt(`Nominal (${currencyCode}/bulan)`, `Amount (${currencyCode}/month)`, `金額（${currencyCode}/月）`)}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] font-mono text-sm">
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
              <label htmlFor="housing-type-select" className="block text-sm font-medium text-fg-80">
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
              <label htmlFor="contribute-note-input" className="block text-sm font-medium text-fg-80">
                {txt("Catatan Kontekstual (Opsional)", "Contextual Note (Optional)", "補足情報・メモ（任意）")}
              </label>
              <span className="text-xs text-[var(--accent)]">🔒 Zero PII</span>
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
            <p className="text-xs text-fg-soft italic">
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
