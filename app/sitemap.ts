import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.rishteclub.com";
  const currentDate = new Date();

  // Core Static Routes
  const staticRoutes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/profiles", priority: 0.95, changeFrequency: "daily" as const },
    { path: "/astrology", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/services", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/event-planner", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/register", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/faqs", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/help", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamic Profiles for Maximum Google Indexing
  let profileEntries: MetadataRoute.Sitemap = [];
  try {
    const visibleProfiles = await prisma.profile.findMany({
      where: {
        isVisible: true,
        OR: [
          { paymentCompleted: true },
          { approvalStatus: "APPROVED" },
        ],
      },
      select: {
        profileId: true,
        updatedAt: true,
      },
      take: 1000,
    });

    profileEntries = visibleProfiles.map((p) => ({
      url: `${baseUrl}/profile/${p.profileId}`,
      lastModified: p.updatedAt || currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (e) {
    console.error("Error fetching profiles for sitemap:", e);
  }

  return [...staticEntries, ...profileEntries];
}

