"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import SafeHtml from "@/components/SafeHtml";
import { Heading, Input, Section, Text } from "@/components/ui";

import type { NetworkFinderUi, ServiceLocation, ServiceLocationType } from "@/types/service";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { homeMotion } from "@/lib/motionConfig";

type ServiceNetworkFinderProps = Readonly<{
  locations: ServiceLocation[];
  ui: NetworkFinderUi;
}>;

type LocationFilter = ServiceLocationType | "All";

const defaultMapSrc =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44746.87813164304!2d10.2902568!3d45.5199988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47817776ebf93163%3A0x7b1471b5b8b3b944!2sPerazzi!5e0!3m2!1sen!2sit!4v1720000000000!5m2!1sen!2sit";
const defaultMapLink = "https://maps.google.com/?q=Perazzi+service+network";
const locationTypes: LocationFilter[] = ["All", "Factory", "Service Center", "Specialist"];
const searchDebounceMs = 200;

export function ServiceNetworkFinder({ locations, ui }: ServiceNetworkFinderProps) {
  const analyticsRef = useAnalyticsObserver("ServiceNetworkSeen");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
  const [filter, setFilter] = useState<LocationFilter>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeLocationId, setActiveLocationId] = useState<string | null>(() => locations[0]?.id ?? null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(normalizeSearch(search));
      logAnalytics("FinderFilterChange");
    }, searchDebounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => matchesLocation(location, filter, debouncedSearch));
  }, [locations, filter, debouncedSearch]);

  const resolvedActiveLocationId = useMemo(() => {
    return resolveActiveLocationId(filteredLocations, activeLocationId);
  }, [filteredLocations, activeLocationId]);

  const activeLocation = useMemo(() => {
    if (!resolvedActiveLocationId) return null;
    return filteredLocations.find((location) => location.id === resolvedActiveLocationId) ?? null;
  }, [filteredLocations, resolvedActiveLocationId]);

  const mapSrc = activeLocation ? buildMapSrc(activeLocation) : defaultMapSrc;
  const mapLinkHref = activeLocation ? buildMapLink(activeLocation) : defaultMapLink;
  const heading = ui.heading ?? "Authorized US Service Locations";
  const subheading = ui.subheading;
  const directionsLabel = ui.directionsButtonLabel ?? "Open in Maps";
  const primaryLabel = ui.primaryButtonLabel ?? "Request service";

  const handleFilterChange = (nextFilter: LocationFilter) => {
    setFilter(nextFilter);
    logAnalytics("FinderFilterChange");
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
  };

  const handleLocationSelect = (locationId: string) => {
    setActiveLocationId(locationId);
    logAnalytics(`FinderResultClick:${locationId}`);
  };

  const handleRequestClick = () => {
    logAnalytics("FinderResultClick:request");
  };

  return (
    <Section
      ref={analyticsRef}
      data-analytics-id="ServiceNetworkSeen"
      padding="md"
      className="group relative space-y-6 overflow-hidden"
      aria-labelledby="service-network-heading"
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <ServiceNetworkHeading
        heading={heading}
        subheading={subheading}
        motionEnabled={motionEnabled}
      />

      <ServiceNetworkFilters
        filter={filter}
        search={search}
        motionEnabled={motionEnabled}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      <ServiceNetworkCount count={filteredLocations.length} motionEnabled={motionEnabled} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ServiceNetworkResults
          locations={filteredLocations}
          activeLocationId={resolvedActiveLocationId}
          motionEnabled={motionEnabled}
          onSelect={handleLocationSelect}
        />
        <ServiceNetworkMap
          activeLocation={activeLocation}
          mapSrc={mapSrc}
          mapLinkHref={mapLinkHref}
          directionsLabel={directionsLabel}
          primaryLabel={primaryLabel}
          motionEnabled={motionEnabled}
          onRequestClick={handleRequestClick}
        />
      </div>
    </Section>
  );
}

type ServiceNetworkHeadingProps = Readonly<{
  heading: string;
  subheading?: string;
  motionEnabled: boolean;
}>;

function ServiceNetworkHeading({ heading, subheading, motionEnabled }: ServiceNetworkHeadingProps) {
  return (
    <motion.div
      className="space-y-2"
      initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
      transition={motionEnabled ? homeMotion.revealFast : undefined}
    >
      <p className="type-section text-ink">Service network</p>
      <Heading id="service-network-heading" level={2} className="type-section-subtitle text-ink">
        {heading}
      </Heading>
      {subheading ? (
        <Text size="md" muted leading="relaxed">
          {subheading}
        </Text>
      ) : null}
    </motion.div>
  );
}

type ServiceNetworkFiltersProps = Readonly<{
  filter: LocationFilter;
  search: string;
  motionEnabled: boolean;
  onFilterChange: (filter: LocationFilter) => void;
  onSearchChange: (search: string) => void;
}>;

function ServiceNetworkFilters({
  filter,
  search,
  motionEnabled,
  onFilterChange,
  onSearchChange,
}: ServiceNetworkFiltersProps) {
  return (
    <motion.form
      role="search"
      className="flex flex-col gap-3 md:flex-row md:items-end"
      initial={motionEnabled ? { opacity: 0, y: 12, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
      transition={motionEnabled ? homeMotion.revealFast : undefined}
    >
      <label className="flex w-full flex-col type-label-tight text-ink">
        <span>Location type</span>
        <select
          className="mt-1 min-h-10 rounded-2xl border border-border/60 bg-card px-3 py-2 type-body-sm text-ink focus-ring sm:border-border/70"
          value={filter}
          onChange={(event) => {
            onFilterChange(event.target.value as LocationFilter);
          }}
        >
          {locationTypes.map((type) => (
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
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          placeholder="e.g. FL, TX"
        />
      </label>
    </motion.form>
  );
}

type ServiceNetworkCountProps = Readonly<{
  count: number;
  motionEnabled: boolean;
}>;

function ServiceNetworkCount({ count, motionEnabled }: ServiceNetworkCountProps) {
  return (
    <motion.output
      className="block type-caption text-ink-muted"
      aria-live="polite"
      initial={motionEnabled ? { opacity: 0 } : false}
      whileInView={motionEnabled ? { opacity: 1 } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
      transition={motionEnabled ? homeMotion.micro : undefined}
    >
      {count} locations available.
    </motion.output>
  );
}

type ServiceNetworkResultsProps = Readonly<{
  locations: ServiceLocation[];
  activeLocationId: string | null;
  motionEnabled: boolean;
  onSelect: (locationId: string) => void;
}>;

function ServiceNetworkResults({
  locations,
  activeLocationId,
  motionEnabled,
  onSelect,
}: ServiceNetworkResultsProps) {
  return (
    <LayoutGroup id="service-network-results">
      <motion.ul
        className="space-y-4"
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: motionEnabled ? 0.06 : 0 } },
        }}
      >
        {locations.length === 0 ? (
          <motion.li
            className="rounded-2xl border border-border/60 bg-card/40 p-4 type-body-sm text-ink-muted sm:bg-card/70 sm:border-border/70"
            variants={{
              hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
            }}
          >
            No locations match your filters. Try clearing the search or selecting a different type.
          </motion.li>
        ) : (
          locations.map((location) => (
            <ServiceNetworkResultCard
              key={location.id}
              location={location}
              isActive={activeLocationId === location.id}
              motionEnabled={motionEnabled}
              onSelect={onSelect}
            />
          ))
        )}
      </motion.ul>
    </LayoutGroup>
  );
}

type ServiceNetworkResultCardProps = Readonly<{
  location: ServiceLocation;
  isActive: boolean;
  motionEnabled: boolean;
  onSelect: (locationId: string) => void;
}>;

function ServiceNetworkResultCard({
  location,
  isActive,
  motionEnabled,
  onSelect,
}: ServiceNetworkResultCardProps) {
  const handleSelect = () => {
    onSelect(location.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return;
    if (!isActivationKey(event.key)) return;
    event.preventDefault();
    onSelect(location.id);
  };

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
      }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col gap-2 overflow-hidden rounded-2xl border p-4 text-left transition focus-ring",
          isActive
            ? "border-perazzi-red bg-card/70 text-ink"
            : "border-border/60 bg-card/40 text-ink sm:border-border/70 sm:bg-card/70",
        )}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        whileHover={motionEnabled ? { x: 4, transition: homeMotion.micro } : undefined}
        whileTap={motionEnabled ? { scale: 0.99 } : undefined}
      >
        {isActive ? (
          <motion.span
            layoutId="service-network-active"
            className="pointer-events-none absolute inset-0 rounded-2xl bg-perazzi-red/5"
            transition={homeMotion.springHighlight}
            aria-hidden="true"
          />
        ) : null}
        <span className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
        <Text size="label-tight" muted>
          {location.type}
        </Text>
        <Heading level={3} className="type-card-title text-ink">
          {location.name}
        </Heading>
        <SafeHtml className="type-body-sm text-ink-muted" html={location.addressHtml} />
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
            <a
              href={`mailto:${location.email}`}
              className="text-perazzi-red focus-ring"
              onClick={handleLinkClick}
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
              onClick={handleLinkClick}
            >
              Website<span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
        {location.notesHtml ? (
          <SafeHtml className="type-caption text-ink-muted" html={location.notesHtml} />
        ) : null}
      </motion.div>
    </motion.li>
  );
}

type ServiceNetworkMapProps = Readonly<{
  activeLocation: ServiceLocation | null;
  mapSrc: string;
  mapLinkHref: string;
  directionsLabel: string;
  primaryLabel: string;
  motionEnabled: boolean;
  onRequestClick: () => void;
}>;

function ServiceNetworkMap({
  activeLocation,
  mapSrc,
  mapLinkHref,
  directionsLabel,
  primaryLabel,
  motionEnabled,
  onRequestClick,
}: ServiceNetworkMapProps) {
  return (
    <div className="space-y-3">
      <motion.div
        className="group relative overflow-hidden rounded-2xl border border-border/60 bg-(--color-canvas) shadow-soft aspect-3/2"
        initial={motionEnabled ? { opacity: 0, y: 12, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <iframe
          key={mapSrc}
          src={mapSrc}
          title={activeLocation ? `Map of ${activeLocation.name}` : "Map of authorized service network"}
          className="h-full w-full"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-12" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
      </motion.div>
      <motion.a
        href={mapLinkHref}
        target="_blank"
        rel="noopener noreferrer"
        className="type-button inline-flex items-center gap-2 text-perazzi-red transition hover:translate-x-0.5 focus-ring"
        initial={motionEnabled ? { opacity: 0, y: 10 } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.micro : undefined}
      >
        {directionsLabel}
        <span aria-hidden="true">→</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </motion.a>
      <motion.a
        href="/service/request"
        className="type-button inline-flex items-center gap-2 text-perazzi-red transition hover:translate-x-0.5 focus-ring"
        onClick={onRequestClick}
        initial={motionEnabled ? { opacity: 0, y: 10 } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.micro : undefined}
      >
        {primaryLabel}
        <span aria-hidden="true">→</span>
      </motion.a>
    </div>
  );
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesLocation(location: ServiceLocation, filter: LocationFilter, search: string) {
  if (filter !== "All" && location.type !== filter) return false;
  if (!search) return true;
  const haystack = `${location.name} ${stripHtml(location.addressHtml)}`.toLowerCase();
  return haystack.includes(search);
}

function resolveActiveLocationId(locations: ServiceLocation[], activeLocationId: string | null) {
  if (!locations.length) return null;
  if (activeLocationId && locations.some((location) => location.id === activeLocationId)) {
    return activeLocationId;
  }
  return locations[0]?.id ?? null;
}

function isActivationKey(key: string) {
  return key === "Enter" || key === " " || key === "Spacebar";
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
