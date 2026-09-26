"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currencyContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencyEditModal } from "@/components/common/CurrencyEditModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ReferenceCurrency } from "@/lib/exchangeRate";

export function Navbar() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const { refCurrency, setRefCurrency, exchangeRates, isCustomized } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [feedbackCurrency, setFeedbackCurrency] = useState<ReferenceCurrency | null>(null);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSelectCurrency = (c: ReferenceCurrency) => {
    setRefCurrency(c);
    setFeedbackCurrency(c);
    setTimeout(() => setFeedbackCurrency(null), 2200);
  };

  // Compute conversion equation relative to active selected reference currency
  const conversionSummary = React.useMemo(() => {
    if (!exchangeRates || !exchangeRates.rates) {
      return "1 EUR = Rp 17.200 · ¥163.5 · $1.08";
    }

    const rates = exchangeRates.rates;
    const baseRate = rates[refCurrency] ?? (refCurrency === "EUR" ? 1 : 1);

    const formatRate = (curr: ReferenceCurrency) => {
      const r = rates[curr] ?? (curr === "EUR" ? 1 : 1);
      const val = r / baseRate;
      if (curr === "IDR") return `Rp ${Math.round(val).toLocaleString("id-ID")}`;
      if (curr === "JPY") return `¥${val.toFixed(1)}`;
      if (curr === "USD") return `$${val.toFixed(2)}`;
      return `€${val.toFixed(2)}`;
    };

    const targets: ReferenceCurrency[] = (["EUR", "JPY", "IDR", "USD"] as ReferenceCurrency[]).filter(
      (c) => c !== refCurrency
    );

    const parts = targets.map((t) => formatRate(t));
    return `1 ${refCurrency} = ${parts.join(" · ")}`;
  }, [refCurrency, exchangeRates]);

  const navLinks: Array<{
    href: "/" | "/gaji-setara" | "/compare" | "/wizard" | "/persentil";
    label: string;
    exact?: boolean;
  }> = [
    {
      href: "/",
      label:
        locale === "id"
          ? "⚖️ Banding Hidup"
          : locale === "de"
          ? "⚖️ Vergleich"
          : locale === "ja"
          ? "⚖️ 生活費比較"
          : "⚖️ Cost Comparison",
      exact: true,
    },
    {
      href: "/gaji-setara",
      label:
        locale === "id"
          ? "🌐 Gaji Setara"
          : locale === "de"
          ? "🌐 Gehaltsäquivalent"
          : locale === "ja"
          ? "🌐 必要給与"
          : "🌐 Equivalent Salary",
    },
    {
      href: "/compare",
      label:
        locale === "id"
          ? "🎓 Magang Azubi/JP"
          : locale === "de"
          ? "🎓 Azubi vs. JP"
          : locale === "ja"
          ? "🎓 実習・新卒比較"
          : "🎓 Trainee Compare",
    },
    {
      href: "/wizard",
      label:
        locale === "id"
          ? "🧮 Kalkulator 7-Langkah"
          : locale === "de"
          ? "🧮 7-Schritte"
          : locale === "ja"
          ? "🧮 7段階計算機"
          : "🧮 7-Step Budget",
    },
    {
      href: "/persentil",
      label:
        locale === "id"
          ? "📊 Persentil"
          : locale === "de"
          ? "📊 Perzentile"
          : locale === "ja"
          ? "📊 所得順位"
          : "📊 Percentile",
    },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full transition-colors"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--header-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand Logo & Left Nav */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold transition-transform group-hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  boxShadow: "0 2px 8px var(--accent-soft)",
                  color: "#ffffff",
                }}
              >
                🌏
              </div>
              <div>
                <div className="font-display font-bold text-base leading-none tracking-tight text-[var(--text)]">
                  BandingHidup
                </div>
                <div className="text-[10px] text-[var(--accent)] font-mono leading-none mt-0.5">
                  compare.t-agung.id
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium ml-3 border-l border-[var(--border)] pl-3">
              {navLinks.map((link) => {
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold border border-[var(--border-strong)]"
                        : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Side: Currency Box + Theme Toggle + Language Switcher */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Currency Control Box */}
            <div
              className="flex flex-col items-end gap-0.5 p-1.5 rounded-xl transition-colors"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-1">
                {(["EUR", "JPY", "IDR", "USD"] as ReferenceCurrency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectCurrency(c)}
                    className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                      refCurrency === c
                        ? "bg-[var(--accent)] text-white font-bold shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {c}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className={`ml-1 px-1.5 py-0.5 text-[11px] rounded transition-all flex items-center gap-1 ${
                    isCustomized
                      ? "bg-amber-500/20 text-amber-500 font-bold border border-amber-500/40"
                      : "text-[var(--soft)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                  }`}
                  title={
                    locale === "id"
                      ? "Sesuaikan Nilai Kurs Bank/Wise"
                      : locale === "ja"
                      ? "為替レート手動調整（Wise/銀行）"
                      : "Adjust Custom Bank Rates"
                  }
                >
                  <span>✏️</span>
                  <span className="hidden xl:inline text-[10px]">
                    {isCustomized
                      ? locale === "id" ? "Kustom" : "Custom"
                      : locale === "id" ? "Kurs" : "Rate"}
                  </span>
                </button>
              </div>

              {/* Conversion Subtext */}
              <div className="text-[10px] font-mono tracking-tight px-1 flex items-center gap-1.5">
                {feedbackCurrency ? (
                  <span className="text-[var(--accent)] font-bold animate-pulse">
                    ✓ {refCurrency} aktif
                  </span>
                ) : (
                  <span className="text-[var(--soft)]">{conversionSummary}</span>
                )}
              </div>
            </div>

            {/* Theme Toggle (Dark / Light) Upper Right */}
            <ThemeToggle />

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>

          {/* Mobile Right Controls: Compact Currency + ThemeToggle + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-2 py-1 rounded-lg text-xs font-mono text-[var(--accent)] flex items-center gap-1 border border-[var(--border)] bg-[var(--surface)]"
            >
              <span>{refCurrency}</span>
              <span className="text-[9px] text-[var(--soft)]">✏️</span>
            </button>

            <ThemeToggle />

            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-all focus:outline-none"
              aria-label="Toggle Navigation Menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu Sheet */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden border-t px-4 py-4 space-y-4 animate-fade-in shadow-xl"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
          >
            {/* Nav links list */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-[var(--soft)] uppercase tracking-widest px-2 mb-1">
                {locale === "id" ? "Menu Utama" : "Navigation"}
              </div>
              {navLinks.map((link) => {
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] font-bold border border-[var(--border-strong)]"
                        : "text-[var(--text)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Language Switcher in Mobile Drawer */}
            <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
              <div className="text-[10px] font-semibold text-[var(--soft)] uppercase tracking-widest px-1">
                {locale === "id" ? "Pilih Bahasa" : locale === "de" ? "Sprache wählen" : locale === "ja" ? "言語選択" : "Select Language"}
              </div>
              <LanguageSwitcher fullLabels={true} />
            </div>

            {/* External Links */}
            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
              <a
                href="https://t-agung.id"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                🏠 t-agung.id
              </a>
              <a
                href="https://t-agung.id/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                📝 Blog
              </a>
            </div>

            {/* Currency selector inside mobile drawer */}
            <div className="pt-3 border-t border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted)]">
                  {locale === "id" ? "Mata Uang Acuan:" : "Currency:"}
                </span>
                <span className="text-[11px] text-[var(--accent)] font-mono font-bold">
                  {refCurrency} aktif
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(["EUR", "JPY", "IDR", "USD"] as ReferenceCurrency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectCurrency(c)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                      refCurrency === c
                        ? "bg-[var(--accent)] text-white font-bold shadow-sm"
                        : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full py-2 text-xs rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-3)] flex items-center justify-center gap-1.5"
              >
                <span>✏️</span>
                <span>
                  {locale === "id" ? "Sesuaikan Nilai Kurs Sendiri" : "Adjust Custom Exchange Rates"}
                </span>
              </button>

              <div className="text-[10px] font-mono text-[var(--soft)] text-center pt-1">
                {conversionSummary}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Edit Currency Modal */}
      <CurrencyEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
