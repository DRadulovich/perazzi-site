import "server-only";

type BigCommerceConfig = {
  storeHash: string;
  storefrontToken: string;
  channelId: string;
  graphqlEndpoint: string;
};

const readEnv = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value.trim();
};

export const BIGCOMMERCE_CDN_HOSTNAME =
  process.env.BIGCOMMERCE_CDN_HOSTNAME ?? "*.bigcommerce.com";

export const getBigCommerceConfig = (): BigCommerceConfig => {
  const storeHash = readEnv("BIGCOMMERCE_STORE_HASH");
  const storefrontToken = readEnv("BIGCOMMERCE_STOREFRONT_TOKEN");
  const channelId = readEnv("BIGCOMMERCE_CHANNEL_ID", "1");

  return {
    storeHash,
    storefrontToken,
    channelId,
    graphqlEndpoint: `https://store-${storeHash}.mybigcommerce.com/graphql`,
  };
};
