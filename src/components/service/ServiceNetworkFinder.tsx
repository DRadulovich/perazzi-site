"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ServiceLocation, ServiceLocationType } from "@/types/service";
import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type ServiceNetworkFinderProps = {
  locations: ServiceLocation[];
};

const staticMap = {
  url: "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  alt: "Abstract map placeholder",
  aspectRatio: 4 / 3,
};

export function ServiceNetworkFinder({ locations }: ServiceNetworkFinderProps) {
  const analyticsRef = useAnalyticsObserver("ServiceNetworkSeen");
  const [filter, setFilter] = useState<ServiceLocationType | "All">("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.toLowerCase());
      console.log("[analytics] FinderFilterChange");
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesType = filter === "All" || location.type === filter;
      const haystack = `${location.name} ${location.addressHtml}`.toLowerCase();
      const matchesSearch = !debouncedSearch || haystack.includes(debouncedSearch);
      return matchesType && matchesSearch;
    });
  }, [locations, filter, debouncedSearch]);

  const types: (ServiceLocationType | "All")[] = ["All", "Factory", "Service Center", "Specialist"];

  const defaultMapSrc =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44746.87813164304!2d10.2902568!3d45.5199988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47817776ebf93163%3A0x7b1471b5b8b3b944!2sPerazzi!5e0!3m2!1sen!2sit!4v1720000000000!5m2!1sen!2sit";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="ServiceNetworkSeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="service-network-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Service network
        </p>
        <h2
          id="service-network-heading"
          className="text-2xl font-semibold text-ink"
        >
          Authorized locations worldwide
        </h2>
      </div>
      <form role="search" className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex w-full flex-col text-xs font-semibold uppercase tracking-[0.3em] text-ink">
          Location type
          <select
            className="mt-1 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as ServiceLocationType | "All");
              console.log("[analytics] FinderFilterChange");
            }}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full flex-col text-xs font-semibold uppercase tracking-[0.3em] text-ink">
          Search by city or name
          <input
            type="search"
            className="mt-1 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="e.g. London, Botticino"
          />
        </label>
      </form>
      <p className="text-xs text-ink-muted" aria-live="polite">
        {filteredLocations.length} locations available.
      </p>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ul role="list" className="space-y-4">
          {filteredLocations.map((location) => (
            <li
              key={location.id}
              className="rounded-2xl border border-border/70 bg-card/70 p-4"
            >
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                  {location.type}
                </p>
                <h3 className="text-lg font-semibold text-ink">{location.name}</h3>
                <div
                  className="text-sm text-ink-muted"
                  dangerouslySetInnerHTML={{ __html: location.addressHtml }}
                />
                <div className="text-sm text-ink">
                  {location.phone ? <div>{location.phone}</div> : null}
                  {location.email ? (
                    <a
                      href={`mailto:${location.email}`}
                      className="text-perazzi-red focus-ring"
                    >
                      {location.email}
                    </a>
                  ) : null}
                  {location.website ? (
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-perazzi-red focus-ring"
                      onClick={() =>
                        console.log(`[analytics] FinderResultClick:${location.id}`)
                      }
                    >
                      Website<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : null}
                </div>
                {location.notesHtml ? (
                  <div
                    className="text-xs text-ink-muted"
                    dangerouslySetInnerHTML={{ __html: location.notesHtml }}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <div className="space-y-3">
          <div
            className="relative overflow-hidden rounded-2xl border border-border/70 bg-neutral-200"
            style={{ aspectRatio: staticMap.aspectRatio }}
          >
            {mapOpen ? (
              <iframe
                src={defaultMapSrc}
                title="Map of authorized service network"
                className="h-full w-full"
                loading="lazy"
              />
            ) : (
              <Image
                src={staticMap.url}
                alt={staticMap.alt}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            )}
          </div>
          {!mapOpen ? (
            <Button
              variant="secondary"
              onClick={() => {
                setMapOpen(true);
                console.log("[analytics] FinderMapOpen");
              }}
            >
              Load interactive map
            </Button>
          ) : null}
          <a
            href="/service/request"
            className="inline-flex items-center gap-2 text-sm font-semibold text-perazzi-red focus-ring"
          >
            Request service
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
