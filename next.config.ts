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
      {
        source: "/platform",
        destination: "/platform/dashboard",
        permanent: true,
      },
      {
        source: "/teacher",
        destination: "/teacher/dashboard",
        permanent: true,
      },
      {
        source: "/:locale(en|my)/school",
        destination: "/:locale/school/dashboard",
        permanent: true,
      },
      // TODO: it's need to disable after implemented the locale selector
      {
        source: "/:locale(en|my)/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
