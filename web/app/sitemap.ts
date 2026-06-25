import type { MetadataRoute } from "next";

const BASE = "https://litpass.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`,            lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/passport`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/badges`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/leaderboard`, lastModified: now, changeFrequency: "hourly",  priority: 0.7 },
  ];
}
