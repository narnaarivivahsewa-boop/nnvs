import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RishteClub Matrimony",
    short_name: "RishteClub",
    description: "RishteClub Official Matrimonial Matchmaking & Management Portal (Associated with NNVS Matrimony)",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6EF",
    theme_color: "#4A121A",
    orientation: "portrait",
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/nnvs-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/nnvs-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
