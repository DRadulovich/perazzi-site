import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import { sanityClient } from "../../../sanity/client";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type ServiceHomeResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
};

type RecommendedServiceCenterResponse = {
  _id?: string;
  centerName?: string;
  state?: string;
  address?: string;
  city?: string;
  phone?: string;
  contact?: string;
};

export interface ServiceHomePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
}

export interface RecommendedServiceCenterPayload {
  id: string;
  centerName: string;
  address: string;
  city: string;
  state?: string;
  phone?: string;
  contact?: string;
}

const serviceHomeQuery = groq`
  *[_type == "serviceHome"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    }
  }
`;

const recommendedServiceCentersQuery = groq`
  *[_type == "recommendedServiceCenter"] | order(state asc, centerName asc){
    _id,
    centerName,
    state,
    address,
    city,
    phone,
    contact
  }
`;

export async function getServiceHome(): Promise<ServiceHomePayload | null> {
  const data = await sanityClient.fetch<ServiceHomeResponse | null>(serviceHomeQuery).catch(() => null);
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
  };
}

export async function getRecommendedServiceCenters(): Promise<RecommendedServiceCenterPayload[]> {
  const data = await sanityClient
    .fetch<RecommendedServiceCenterResponse[] | null>(recommendedServiceCentersQuery)
    .catch(() => null);

  return (
    data
      ?.filter(
        (center): center is RecommendedServiceCenterResponse & { _id: string; centerName: string; address: string; city: string } =>
          Boolean(center?._id && center?.centerName && center?.address && center?.city),
      )
      .map((center) => ({
        id: center._id as string,
        centerName: center.centerName as string,
        address: center.address as string,
        city: center.city as string,
        state: center.state ?? undefined,
        phone: center.phone ?? undefined,
        contact: center.contact ?? undefined,
      })) ?? []
  );
}
