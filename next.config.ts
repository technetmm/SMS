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
};

export default nextConfig;
