import path from "node:path";
import type { NextConfig } from "next";

const intlRequestConfigPath = "./src/i18n/request.ts";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  webpack(config) {
    config.resolve.alias["next-intl/config"] = path.resolve(
      intlRequestConfigPath,
    );
    return config;
  },
  turbopack: {
    resolveAlias: {
      "next-intl/config": intlRequestConfigPath,
    },
  },
};

export default nextConfig;
