import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "BandingHidup — Perbandingan Biaya Hidup Ausbildung & Kenshusei";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c1512",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#ffffff",
          border: "4px solid #14b8a6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#14b8a6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            🌏
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "36px", fontWeight: "bold", color: "#ffffff" }}>
              BandingHidup
            </span>
            <span style={{ fontSize: "18px", color: "#14b8a6" }}>
              compare.t-agung.id
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "950px" }}>
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              lineHeight: 1.15,
              color: "#ffffff",
            }}
          >
            Perbandingan Biaya Hidup & Daya Beli Nyata
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              lineHeight: 1.4,
            }}
          >
            🇩🇪 Ausbildung Jerman vs 🇯🇵 Kenshusei Jepang. Berapa sisa uang bersih masuk rekening dan yang bisa ditabung?
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #1e293b",
            paddingTop: "24px",
            fontSize: "18px",
            color: "#64748b",
          }}
        >
          <span>Data Statistik Resmi 2026 (Destatis · e-Stat · BPS)</span>
          <span style={{ color: "#14b8a6" }}>100% Gratis & Anonim</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
