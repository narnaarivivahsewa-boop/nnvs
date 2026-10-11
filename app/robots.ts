import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/dashboard",
          "/dashboard/*",
          "/payment",
          "/payment/*",
          "/invoice",
          "/invoice/*",
        ],
      },
    ],
    sitemap: "https://www.rishteclub.com/sitemap.xml",
  };
}
