import "server-only";

import { groq } from "next-sanity";

import type { FactoryAsset } from "@/types/content";
import type { ExperienceNetworkData } from "@/types/experience";
import { sanityClient } from "../../../sanity/client";
import { imageWithMetaFields, mapImageResult, type SanityImageResult } from "./utils";

type ExperienceHomeResponse = {
  hero?: {
    title?: string;
    subheading?: string;
    background?: SanityImageResult;
  };
  picker?: Array<{
    _key?: string;
    title?: string;
    summary?: string;
    href?: string;
    media?: SanityImageResult;
  }>;
  mosaic?: SanityImageResult[];
};

type ExperienceNetworkResponse = {
  scheduledEvents?: Array<{
    _id?: string;
    eventName?: string;
    eventLocation?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  }>;
  dealers?: Array<{
    _id?: string;
    dealerName?: string;
    state?: string;
    address?: string;
    city?: string;
  }>;
  serviceCenters?: Array<{
    _id?: string;
    centerName?: string;
    state?: string;
    address?: string;
    city?: string;
    phone?: string;
    contact?: string;
  }>;
};

export interface ExperienceHomePayload {
  hero?: {
    title?: string;
    subheading?: string;
    background?: FactoryAsset;
  };
  picker?: Array<{
    id: string;
    title?: string;
    summary?: string;
    href?: string;
    media?: FactoryAsset;
  }>;
  mosaic?: FactoryAsset[];
}

const experienceHomeQuery = groq`
  *[_type == "experienceHome"][0]{
    hero{
      title,
      subheading,
      background{
        ${imageWithMetaFields}
      }
    },
    picker[]{
      _key,
      title,
      summary,
      href,
      media{
        ${imageWithMetaFields}
      }
    },
    mosaic[]{
      ${imageWithMetaFields}
    }
  }
`;

const experienceNetworkQuery = groq`
{
  "scheduledEvents": *[_type == "scheduledEvent"] | order(startDate asc, endDate asc) {
    _id,
    eventName,
    eventLocation,
    startDate,
    endDate,
    location
  },
  "dealers": *[_type == "authorizedDealer"] | order(state asc, dealerName asc) {
    _id,
    dealerName,
    state,
    address,
    city
  },
  "serviceCenters": *[_type == "recommendedServiceCenter"] | order(state asc, centerName asc) {
    _id,
    centerName,
    state,
    address,
    city,
    phone,
    contact
  }
}
`;

export async function getExperienceHome(): Promise<ExperienceHomePayload | null> {
  const data = await sanityClient.fetch<ExperienceHomeResponse | null>(experienceHomeQuery).catch(() => null);
  if (!data) return null;

  return {
    hero: data.hero
      ? {
          title: data.hero.title ?? undefined,
          subheading: data.hero.subheading ?? undefined,
          background: mapImageResult(data.hero.background ?? null),
        }
      : undefined,
    picker: data.picker
      ?.filter((item): item is typeof item & { _key: string } => Boolean(item?._key))
      .map((item) => ({
        id: item._key as string,
        title: item.title ?? undefined,
        summary: item.summary ?? undefined,
        href: item.href ?? undefined,
        media: mapImageResult(item.media ?? null),
      })),
    mosaic: data.mosaic
      ?.map((asset) => mapImageResult(asset ?? null))
      .filter(Boolean) as FactoryAsset[] | undefined,
  };
}

export async function getExperienceNetworkData(): Promise<ExperienceNetworkData> {
  const data = await sanityClient.fetch<ExperienceNetworkResponse | null>(experienceNetworkQuery).catch(() => null);

  const scheduledEvents = (data?.scheduledEvents ?? [])
    .map((item) => {
      if (!item?._id || !item.eventName || !item.eventLocation) return null;
      return {
        _id: item._id,
        eventName: item.eventName,
        eventLocation: item.eventLocation,
        startDate: item.startDate ?? undefined,
        endDate: item.endDate ?? undefined,
        location: item.location ?? undefined,
      };
    })
    .filter((item): item is ExperienceNetworkData["scheduledEvents"][number] => Boolean(item));

  const dealers = (data?.dealers ?? [])
    .map((item) => {
      if (!item?._id || !item.dealerName || !item.state) return null;
      return {
        _id: item._id,
        dealerName: item.dealerName,
        state: item.state,
        address: item.address ?? "",
        city: item.city ?? "",
      };
    })
    .filter((item): item is ExperienceNetworkData["dealers"][number] => Boolean(item));

  const serviceCenters = (data?.serviceCenters ?? [])
    .map((item) => {
      if (!item?._id || !item.centerName || !item.state) return null;
      return {
        _id: item._id,
        centerName: item.centerName,
        state: item.state,
        address: item.address ?? "",
        city: item.city ?? "",
        phone: item.phone ?? "",
        contact: item.contact ?? "",
      };
    })
    .filter((item): item is ExperienceNetworkData["serviceCenters"][number] => Boolean(item));

  return {
    scheduledEvents,
    dealers,
    serviceCenters,
  };
}
