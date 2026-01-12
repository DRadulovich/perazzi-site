import "server-only";

import { getBigCommerceConfig } from "./constants";

type GraphQLError = {
  message?: string;
};

type GraphQLResponse = {
  errors?: GraphQLError[];
};

export type BigCommerceFetchOptions = {
  query: string;
  variables?: Record<string, unknown>;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export async function bigCommerceFetch<T>({
  query,
  variables,
  headers,
  cache = "force-cache",
}: BigCommerceFetchOptions): Promise<{ status: number; body: T }> {
  const { graphqlEndpoint, storefrontToken, channelId } = getBigCommerceConfig();

  const response = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${storefrontToken}`,
      "content-type": "application/json",
      "x-bc-channel-id": channelId,
      ...headers,
    },
    body: JSON.stringify({
      query,
      ...(variables ? { variables } : {}),
    }),
    cache,
  });

  let body: (T & GraphQLResponse) | null = null;

  try {
    body = (await response.json()) as T & GraphQLResponse;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      body?.errors?.[0]?.message ??
      (body as { message?: string } | null)?.message ??
      response.statusText;
    throw new Error(`BigCommerce request failed (${response.status}): ${message}`);
  }

  if (body?.errors?.length) {
    const message = body.errors[0]?.message ?? "BigCommerce GraphQL error";
    throw new Error(message);
  }

  if (!body) {
    throw new Error("BigCommerce response was not valid JSON.");
  }

  return {
    status: response.status,
    body,
  };
}
