"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface SubscribeOptInProps {
  cityName: string;
  countryCode?: string;
  thresholdPercent?: number;
}

export function SubscribeOptIn({
  cityName,
  countryCode,
  thresholdPercent = 5,
}: SubscribeOptInProps) {
  const { locale } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const txt = (idStr: string, enStr: string, deStr: string, jaStr: string) => {
    if (locale === "de") return deStr;
    if (locale === "ja") return jaStr;
    if (locale === "en") return enStr;
    return idStr;
  };

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage(
        txt(
          "Masukkan alamat email yang valid.",
          "Please enter a valid email address.",
          "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
          "有効なメールアドレスを入力してください。"
        )
      );
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cityName,
          countryCode,
          thresholdPercent,
          locale,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Gagal mendaftar");
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Terjadi kesalahan saat mendaftar");
    }
  }

  return (
    <div className="glass-card p-5 border border-line rounded-xl bg-panel-2 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🔔</span>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          {txt(
            `Pantau Perubahan Biaya di ${cityName}`,
            `Track Living Cost Shifts in ${cityName}`,
            `Kostenveränderungen in ${cityName} verfolgen`,
            `${cityName}の生活費変動アラート`
          )}
        </h4>
      </div>

      {status === "success" ? (
        <div className="p-3.5 rounded-lg bg-[var(--accent-soft)] border border-line-strong text-xs text-[var(--accent)] font-medium space-y-1 animate-fade-in">
          <div className="font-bold flex items-center gap-1.5">
            <span>✅</span>
            <span>
              {txt(
                "Email Anda telah tersimpan!",
                "Subscription registered!",
                "Erfolgreich angemeldet!",
                "登録が完了しました！"
              )}
            </span>
          </div>
          <p className="text-fg-70 text-[11px]">
            {txt(
              `Kami akan mengirimkan notifikasi jika biaya hidup di ${cityName} bergeser >${thresholdPercent}%. Anda dapat berhenti berlangganan kapan saja melalui tautan di email.`,
              `We will notify you if living costs in ${cityName} shift >${thresholdPercent}%. You can unsubscribe anytime via the link in the email.`,
              `Wir benachrichtigen Sie, wenn sich die Lebenshaltungskosten in ${cityName} um mehr als ${thresholdPercent}% ändern. Abmeldung jederzeit per Link in der Mail möglich.`,
              `${cityName}の主要指標が${thresholdPercent}%以上変動した場合にお知らせします。メール内のリンクからいつでも解除可能です。`
            )}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-2.5">
          <p className="text-xs text-fg-70 leading-relaxed">
            {txt(
              `Kirim update jika angka di ${cityName} berubah >${thresholdPercent}%:`,
              `Send me updates if living costs in ${cityName} shift >${thresholdPercent}%:`,
              `Updates senden, wenn sich die Zahlen in ${cityName} um >${thresholdPercent}% ändern:`,
              `${cityName}の相場が${thresholdPercent}%以上変動した際に通知を受け取る:`
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="form-select flex-1 text-xs py-2 px-3 rounded-lg bg-panel border-line text-[var(--text)] focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-primary py-2 px-4 text-xs font-semibold whitespace-nowrap rounded-lg shadow-sm"
            >
              {status === "loading"
                ? txt("Menyimpan...", "Saving...", "Speichern...", "保存中...")
                : txt("Dapatkan Update", "Get Updates", "Aktivieren", "通知を受け取る")}
            </button>
          </div>

          {status === "error" && (
            <p className="text-[11px] text-red-400 font-medium">
              {errorMessage}
            </p>
          )}

          <p className="text-[10px] text-fg-soft leading-normal">
            {txt(
              "🔒 Tanpa spam, 100% anonim. Mudah berhenti langganan dengan 1 klik pada setiap email pemberitahuan.",
              "🔒 Zero spam, 100% anonymous. Easily unsubscribe with 1 click in every notification email.",
              "🔒 Kein Spam, 100% anonym. Mit einem Klick in jeder Benachrichtigungs-E-Mail abbestellbar.",
              "🔒 スパムなし・完全匿名。配信されるすべての通知メールから1クリックで簡単に配信停止できます。"
            )}
          </p>
        </form>
      )}
    </div>
  );
}
