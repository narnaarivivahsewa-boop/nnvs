import { MetadataRoute } from "next";
import { LANDING_PAGES } from "@/lib/constants/landing-pages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.rishteclub.com";
  const currentDate = new Date();

  // Core Canonical Public Routes
  const staticRoutes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/profiles", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/astrology", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/services", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/faqs", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/help", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/refund", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Canonical Location & Community Hubs
  const hubEntries = Object.keys(LANDING_PAGES).map((slug) => ({
    url: `${baseUrl}/matrimony/${slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [...staticEntries, ...hubEntries];
}

