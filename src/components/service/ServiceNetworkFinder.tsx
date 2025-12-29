"use client";

import { useEffect, useMemo, useState } from "react";
import SafeHtml from "@/components/SafeHtml";
import { Heading, Input, Section, Text } from "@/components/ui";

import type { NetworkFinderUi, ServiceLocation, ServiceLocationType } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type ServiceNetworkFinderProps = Readonly<{
  locations: ServiceLocation[];
  ui: NetworkFinderUi;
}>;

const defaultMapSrc =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44746.87813164304!2d10.2902568!3d45.5199988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47817776ebf93163%3A0x7b1471b5b8b3b944!2sPerazzi!5e0!3m2!1sen!2sit!4v1720000000000!5m2!1sen!2sit";
const defaultMapLink = "https://maps.google.com/?q=Perazzi+service+network";

export function ServiceNetworkFinder({ locations, ui }: ServiceNetworkFinderProps) {
  const analyticsRef = useAnalyticsObserver("ServiceNetworkSeen");
  const [filter, setFilter] = useState<ServiceLocationType | "All">("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeLocationId, setActiveLocationId] = useState<string | null>(() => locations[0]?.id ?? null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.toLowerCase());
      logAnalytics("FinderFilterChange");
    }, 200);
    return () => { clearTimeout(timer); };
  }, [search]);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesType = filter === "All" || location.type === filter;
      const haystack = `${location.name} ${location.addressHtml}`.toLowerCase();
      const matchesSearch = !debouncedSearch || haystack.includes(debouncedSearch);
      return matchesType && matchesSearch;
    });
  }, [locations, filter, debouncedSearch]);

  const resolvedActiveLocationId = useMemo(() => {
    if (!filteredLocations.length) return null;
    if (activeLocationId && filteredLocations.some((location) => location.id === activeLocationId)) {
      return activeLocationId;
    }
    return filteredLocations[0]?.id ?? null;
  }, [filteredLocations, activeLocationId]);

  const activeLocation =
    filteredLocations.find((location) => location.id === resolvedActiveLocationId) ?? null;

  const types: (ServiceLocationType | "All")[] = ["All", "Factory", "Service Center", "Specialist"];

  const mapSrc = activeLocation ? buildMapSrc(activeLocation) : defaultMapSrc;
  const mapLinkHref = activeLocation ? buildMapLink(activeLocation) : defaultMapLink;
  const heading = ui.heading ?? "Authorized US Service Locations";
  const subheading = ui.subheading;
  const directionsLabel = ui.directionsButtonLabel ?? "Open in Maps";
  const primaryLabel = ui.primaryButtonLabel ?? "Request service";

  return (
    <Section
      ref={analyticsRef}
      data-analytics-id="ServiceNetworkSeen"
      padding="md"
      className="space-y-6"
      aria-labelledby="service-network-heading"
    >
      <div className="space-y-2">
        <Text size="label-tight" muted>
          Service network
        </Text>
        <Heading id="service-network-heading" level={2} size="xl" className="text-ink">
          {heading}
        </Heading>
        {subheading ? (
          <Text size="md" muted leading="relaxed">
            {subheading}
          </Text>
        ) : null}
      </div>
      <form role="search" className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex w-full flex-col type-label-tight text-ink">
          <span>Location type</span>
          <select
            className="mt-1 min-h-10 rounded-2xl border border-border/60 bg-card px-3 py-2 type-body-sm text-ink focus-ring sm:border-border/70"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as ServiceLocationType | "All");
              logAnalytics("FinderFilterChange");
            }}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full flex-col type-label-tight text-ink">
          <span>Search by State or Name</span>
          <Input
            type="search"
            className="mt-1 min-h-10 sm:border-border/70"
            value={search}
            onChange={(event) => { setSearch(event.target.value); }}
            placeholder="e.g. FL, TX"
          />
        </label>
      </form>
      <output className="block type-caption text-ink-muted" aria-live="polite">
        {filteredLocations.length} locations available.
      </output>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ul className="space-y-4">
          {filteredLocations.length === 0 ? (
            <li className="rounded-2xl border border-border/60 bg-card/40 p-4 type-body-sm text-ink-muted sm:bg-card/70 sm:border-border/70">
              No locations match your filters. Try clearing the search or selecting a different type.
            </li>
          ) : (
            filteredLocations.map((location) => {
              const isActive = activeLocation?.id === location.id;
              return (
                <li key={location.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    className={cn(
                      "flex flex-col gap-2 rounded-2xl border p-4 transition-colors focus-ring",
                      isActive
                        ? "border-perazzi-red bg-perazzi-red/5"
                        : "border-border/60 bg-card/40 sm:border-border/70 sm:bg-card/70",
                    )}
                    onClick={() => {
                      setActiveLocationId(location.id);
                      logAnalytics(`FinderResultClick:${location.id}`);
                    }}
                  >
                    <Text size="label-tight" muted>
                      {location.type}
                    </Text>
                    <Heading level={3} size="md" className="text-ink">
                      {location.name}
                    </Heading>
                    <SafeHtml
                      className="type-body-sm text-ink-muted"
                      html={location.addressHtml}
                    />
                    <div className="type-body-sm text-ink">
                      {location.contact ? (
                        <div>
                          <span>Contact:</span> {location.contact}
                        </div>
                      ) : null}
                      {location.phone ? (
                        <div>
                          <span>Phone:</span> {location.phone}
                        </div>
                      ) : null}
                      {location.email ? (
                        <a href={`mailto:${location.email}`} className="text-perazzi-red focus-ring">
                          {location.email}
                        </a>
                      ) : null}
                      {location.website ? (
                        <a
                          href={location.website}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-perazzi-red focus-ring"
                        >
                          Website<span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : null}
                    </div>
                    {location.notesHtml ? (
                      <SafeHtml
                        className="type-caption text-ink-muted"
                        html={location.notesHtml}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-(--color-canvas) aspect-[3/2]">
            <iframe
              key={mapSrc}
              src={mapSrc}
              title={activeLocation ? `Map of ${activeLocation.name}` : "Map of authorized service network"}
              className="h-full w-full"
              loading="lazy"
            />
          </div>
          <a
            href={mapLinkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="type-button inline-flex items-center gap-2 text-perazzi-red focus-ring"
          >
            {directionsLabel}
            <span aria-hidden="true">→</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            href="/service/request"
            className="type-button inline-flex items-center gap-2 text-perazzi-red focus-ring"
            onClick={() => logAnalytics("FinderResultClick:request")}
          >
            {primaryLabel}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </Section>
  );
}

function stripHtml(value?: string) {
  if (!value) return "";
  return value.replaceAll(/<[^>]+>/g, " ").replaceAll(/\s+/g, " ").trim();
}

function buildMapQuery(location: ServiceLocation) {
  if (location.mapQuery) return location.mapQuery;
  const address = stripHtml(location.addressHtml);
  return address || location.name;
}

function buildMapSrc(location: ServiceLocation) {
  const query = buildMapQuery(location);
  if (!query) return defaultMapSrc;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function buildMapLink(location: ServiceLocation) {
  const query = buildMapQuery(location);
  if (!query) return defaultMapLink;
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}
