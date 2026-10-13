import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RishteClub Matrimony - by NNVS",
    short_name: "RishteClub",
    description: "Verified Matrimony & AI Kundli Milan by Nar Naari Vivah Sewa",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#4A121A",
    orientation: "portrait",
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/nnvs-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
    shortcuts: [
      {
        name: "Browse Profiles",
        short_name: "Profiles",
        description: "View verified matrimonial profiles",
        url: "/profiles",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Register Profile",
        short_name: "Register",
        description: "Register a bride or groom profile",
        url: "/register",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Kundli Milan",
        short_name: "Astrology",
        description: "Free Kundli Matching & Horoscope analysis",
        url: "/astrology",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}

