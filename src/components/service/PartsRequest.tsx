"use client";

import type { PartsRequestBlock } from "@/types/service";
import { ServiceRequest } from "./ServiceRequest";

type PartsRequestProps = {
  partsRequestBlock: PartsRequestBlock;
};

export function PartsRequest({ partsRequestBlock }: PartsRequestProps) {
  return (
    <ServiceRequest
      title={partsRequestBlock.title}
      description={partsRequestBlock.description ?? ""}
      buttonLabel={partsRequestBlock.primaryButtonLabel}
      embedSrc={partsRequestBlock.embedUrl}
      fallbackHref={partsRequestBlock.fallbackUrl}
      fallbackLinkLabel={partsRequestBlock.secondaryButtonLabel}
      analyticsOpenId="RequestPartsOpen"
    />
  );
}
