import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const normalizeHostname = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const hostname = withoutProtocol.split("/")[0]?.trim();
  return hostname || null;
};

const isDefined = (value: string | null): value is string => value !== null;

const bigCommerceHostnames = (
  process.env.BIGCOMMERCE_CDN_HOSTNAME ?? "*.bigcommerce.com"
)
  .split(",")
  .map((hostname) => normalizeHostname(hostname))
  .filter(isDefined);

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
