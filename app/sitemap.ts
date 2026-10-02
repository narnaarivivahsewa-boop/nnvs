import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://rishteclub.com";
  const currentDate = new Date();

  const routes = [
    "",
    "/profiles",
    "/register",
    "/login",
    "/about",
    "/contact",
    "/faqs",
    "/help",
    "/terms",
    "/privacy",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === "" || route === "/profiles" ? "daily" : "monthly",
    priority: route === "" ? 1.0 : route === "/profiles" ? 0.9 : 0.7,
  }));
}
