import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const bigCommerceHostnames = (
  process.env.BIGCOMMERCE_CDN_HOSTNAME ?? "*.bigcommerce.com"
)
  .split(",")
  .map((hostname) => hostname.trim())
  .filter(Boolean);

const bigCommerceRemotePatterns = bigCommerceHostnames.map(
  (hostname): { protocol: "https"; hostname: string } => ({
    protocol: "https",
    hostname,
  }),
);

const nextConfig: NextConfig = {
  images: {
    qualities: [100, 75],
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "www.perazzi.it",
      },
      ...bigCommerceRemotePatterns,
    ],
  },
};

export default withNextIntl(nextConfig);
