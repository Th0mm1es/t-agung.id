"use client";

import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function CommentsSection() {
  const { locale } = useI18n();
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Isso script is already loaded
    const scriptId = "isso-embed-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://comments.t-agung.id/js/embed.min.js";
      script.setAttribute("data-isso", "https://comments.t-agung.id/");
      script.async = true;
      script.onerror = () => setHasError(true);
      document.body.appendChild(script);
    } else {
      // Re-init if window.Isso is already present
      try {
        (window as any).Isso?.init();
      } catch {
        setHasError(true);
      }
    }

    // Gracefully detect if Isso was blocked by CORS or failed to mount within 3 seconds
    const timer = setTimeout(() => {
      const threadEl = document.getElementById("isso-thread");
      if (threadEl && threadEl.children.length === 0) {
        setHasError(true);
      } else if (threadEl && threadEl.children.length > 0) {
        setIsLoaded(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const txt = (idStr: string, enStr: string, deStr: string, jaStr: string) => {
    if (locale === "de") return deStr;
    if (locale === "ja") return jaStr;
    if (locale === "en") return enStr;
    return idStr;
  };

  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="py-16 px-4 sm:px-6"
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Admin Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <h2
              id="comments-title"
              className="text-2xl sm:text-3xl font-display font-bold text-[var(--text)]"
            >
              {txt(
                "Diskusi, Masukan & Tanya Jawab",
                "Discussion, Feedback & Inquiries",
                "Diskussion, Feedback & Fragen",
                "フィードバック・質問・コメント"
              )}
            </h2>
          </div>

          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {txt(
              "Punya masukan estimasi biaya, koreksi data gaji, atau pertanyaan seputar Ausbildung & Kenshusei? Tuliskan komentar Anda di bawah secara anonim atau hubungi admin langsung via LinkedIn:",
              "Have feedback on living costs, salary adjustments, or questions about Ausbildung & Kenshusei? Post your comment below anonymously or connect with the admin via LinkedIn:",
              "Haben Sie Feedback zu Lebenshaltungskosten, Gehaltskorrekturen oder Fragen? Hinterlassen Sie unten Ihren Kommentar oder kontaktieren Sie den Administrator direkt via LinkedIn:",
              "生活費や給与データの補正、制度に関するご質問やご意見がございましたら、下記にコメントをご記入いただくか、LinkedInより管理者へご連絡ください:"
            )}
          </p>

          {/* Admin Contact Card */}
          <div
            className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border-strong)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                👨‍💻
              </div>
              <div>
                <div className="text-xs text-[var(--muted)]">Admin & Maintainer</div>
                <div className="text-sm font-bold text-[var(--text)]">Thomas Agung</div>
              </div>
            </div>

            <a
              href="https://www.linkedin.com/in/thomasagung/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{
                background: "#0a66c2",
                boxShadow: "0 2px 8px rgba(10, 102, 194, 0.3)",
              }}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span>{txt("Hubungi via LinkedIn", "Connect on LinkedIn", "Über LinkedIn kontaktieren", "LinkedInで連絡")}</span>
            </a>
          </div>
        </div>

        {/* Isso Thread Mount Point */}
        <div
          className="tagung-card p-5 sm:p-6 rounded-2xl min-h-[160px]"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          {hasError && !isLoaded && (
            <div className="p-4 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <span>⚙️</span>
                <span>
                  {txt(
                    "Koneksi Server Komentar Sedang Disinkronkan",
                    "Comments Service Syncing Cross-Origin Access",
                    "Kommentardienst synchronisiert Cross-Origin-Zugriff",
                    "コメントサーバーの接続許可を同期中"
                  )}
                </span>
              </div>
              <p className="text-amber-200/80 leading-relaxed">
                {txt(
                  "Layanan komentar mandiri (Isso) sedang memperbarui izin CORS untuk subdomain compare.t-agung.id. Anda tetap dapat mengirimkan koreksi data, saran, atau pertanyaan langsung ke Thomas Agung via LinkedIn di atas.",
                  "The standalone comment service (Isso) is updating its CORS allowlist for compare.t-agung.id. In the meantime, you can reach Thomas Agung directly on LinkedIn above.",
                  "Der Kommentardienst (Isso) aktualisiert derzeit seine CORS-Ursprünge für compare.t-agung.id. Sie können Thomas Agung direkt auf LinkedIn kontaktieren.",
                  "コメントサーバー（Isso）のCORS設定を更新中です。お問い合わせやデータ修正のご提案は、上記のLinkedInより管理者までお気軽にご連絡ください。"
                )}
              </p>
            </div>
          )}

          <section id="isso-thread" className="tagung-comments-thread"></section>
          <noscript>
            <p className="text-xs text-[var(--muted)]">
              {txt(
                "Aktifkan JavaScript untuk memuat form komentar Isso.",
                "Please enable JavaScript to view comments.",
                "Bitte aktivieren Sie JavaScript, um die Kommentare zu laden.",
                "コメントを表示するにはJavaScriptを有効にしてください。"
              )}
            </p>
          </noscript>
        </div>
      </div>
    </section>
  );
}
