import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { CurrencyProvider } from "@/lib/currencyContext";
import { Navbar } from "@/components/layout/Navbar";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "BandingHidup — Perbandingan Biaya Hidup Ausbildung & Kenshusei",
    template: "%s | BandingHidup",
  },
  description:
    "Perbandingan biaya hidup realistis untuk peserta Ausbildung di Jerman dan Kenshusei di Jepang. Gratis, anonim, dan jujur. Realistic cost-of-living comparison for vocational trainees.",
  keywords: [
    "ausbildung",
    "kenshusei",
    "technical intern",
    "biaya hidup jerman",
    "biaya hidup jepang",
    "cost of living germany",
    "cost of living japan",
    "gaji ausbildung",
    "gaji kenshusei",
    "perbandingan biaya hidup",
    "magang vokasi",
  ],
  metadataBase: new URL("https://compare.t-agung.id"),
  alternates: {
    canonical: "https://compare.t-agung.id",
  },
  authors: [{ name: "BandingHidup", url: "https://compare.t-agung.id" }],
  creator: "BandingHidup",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    alternateLocale: "en_US",
    url: "https://compare.t-agung.id",
    siteName: "BandingHidup",
    title: "BandingHidup — Perbandingan Biaya Hidup Ausbildung & Kenshusei",
    description:
      "Perbandingan biaya hidup realistis untuk peserta Ausbildung di Jerman dan Kenshusei di Jepang.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BandingHidup — Perbandingan Biaya Hidup Ausbildung & Kenshusei",
    description:
      "Gratis, anonim, jujur. Biaya hidup Jerman vs Jepang untuk magang vokasi.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1a16",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// ─── Root Layout ─────────────────────────────────────────────────────────────

interface RootLayoutProps {
  children: any;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const defaultLocale =
    (process.env["NEXT_PUBLIC_DEFAULT_LOCALE"] as "id" | "en" | undefined) ??
    "id";

  return (
    <html
      lang={defaultLocale}
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  if (t === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.removeAttribute('data-theme');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <ReactQueryProvider>
          <I18nProvider defaultLocale={defaultLocale}>
            <CurrencyProvider>
              <Navbar />
              {children}
            </CurrencyProvider>
          </I18nProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
