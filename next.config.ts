import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400, // 31 days
  },
  async headers() {
    const immutableImageHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return [
      {
        source: "/images/:path*",
        headers: immutableImageHeaders,
      },
      {
        source: "/uploads/:path*",
        headers: immutableImageHeaders,
      },
      {
        source:
          "/:path((?!_next/|api/).*\\.(?:jpg|jpeg|JPG|JPEG|png|PNG|webp|WEBP|avif|AVIF|svg|SVG|ico|ICO|gif|GIF))",
        headers: immutableImageHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/kundali",
        destination: "/kundli-milan",
        permanent: true,
      },
      {
        // Redirect naked domain to www canonical domain (excluding backend integrations if requested)
        source: "/:path((?!api/integrations/).*)",
        has: [
          {
            type: "host",
            value: "rishteclub.com",
          },
        ],
        destination: "https://www.rishteclub.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
