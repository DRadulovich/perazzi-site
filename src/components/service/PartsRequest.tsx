"use client";

import { ServiceRequest } from "./ServiceRequest";

type PartsRequestProps = {
  embedSrc: string;
  fallbackHref: string;
};

export function PartsRequest({ embedSrc, fallbackHref }: PartsRequestProps) {
  return (
    <ServiceRequest
      title="Request parts advice"
      description="Let us confirm availability, fitment, and installation guidance for factory parts."
      buttonLabel="Open parts request"
      embedSrc={embedSrc}
      fallbackHref={fallbackHref}
      analyticsOpenId="RequestPartsOpen"
    />
  );
}
