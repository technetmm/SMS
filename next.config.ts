import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  redirects() {
    return [
      {
        source: "/school",
        destination: "/school/dashboard",
        permanent: true,
      },
    ];
  },
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/pdfkit/js/data/*",
      "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
    ],
  },
};

export default nextConfig;
