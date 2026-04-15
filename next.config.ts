import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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

export default withNextIntl(nextConfig);
