import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const domain = process.env["NEXT_PUBLIC_APP_DOMAIN"] || "https://compare.t-agung.id";
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const now = new Date();

  const publicRoutes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/compare", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/wizard", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/gaji-setara", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/persentil", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/metode", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/contribute", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
