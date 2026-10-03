import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
