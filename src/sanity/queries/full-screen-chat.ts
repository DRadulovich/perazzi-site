import "server-only";

import { groq } from "next-sanity";

import { sanityFetch } from "../lib/live";

type FullScreenChatPageResponse = {
  header?: {
    label?: string;
    title?: string;
    description?: string;
  };
  seo?: {
    title?: string;
    description?: string;
  };
};

export interface FullScreenChatPagePayload {
  header?: {
    label?: string;
    title?: string;
    description?: string;
  };
  seo?: {
    title?: string;
    description?: string;
  };
}

const fullScreenChatQuery = groq`
  *[_type == "fullScreenChatPage"][0]{
    header{
      label,
      title,
      description
    },
    seo{
      title,
      description
    }
  }
`;

export async function getFullScreenChatPage(): Promise<FullScreenChatPagePayload | null> {
  const result = await sanityFetch({
    query: fullScreenChatQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as FullScreenChatPageResponse | null) ?? null;
  if (!data) return null;

  return {
    header: data.header
      ? {
          label: data.header.label ?? undefined,
          title: data.header.title ?? undefined,
          description: data.header.description ?? undefined,
        }
      : undefined,
    seo: data.seo
      ? {
          title: data.seo.title ?? undefined,
          description: data.seo.description ?? undefined,
        }
      : undefined,
  };
}
