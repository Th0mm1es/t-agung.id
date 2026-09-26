import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const domain = process.env["NEXT_PUBLIC_APP_DOMAIN"] || "https://compare.t-agung.id";
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/s/", "/admin"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
