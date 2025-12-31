"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

import type { AuthorizedDealerEntry, ExperienceNetworkData, ScheduledEventEntry, TravelNetworkUi } from "@/types/experience";
import { cn } from "@/lib/utils";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Container, Heading, Section, Text } from "@/components/ui";
import Image from "next/image";
import { homeMotion } from "@/lib/motionConfig";

type TabKey = "schedule" | "dealers";

type TravelNetworkProps = Readonly<{
  data: ExperienceNetworkData;
  ui: TravelNetworkUi;
}>;

type ScheduleListProps = Readonly<{
  events: readonly ScheduledEventEntry[];
  emptyText: string;
}>;

type DealerListProps = Readonly<{
  dealers: readonly AuthorizedDealerEntry[];
  emptyText: string;
}>;

export function TravelNetwork({ data, ui }: TravelNetworkProps) {
  const analyticsRef = useAnalyticsObserver("TravelNetworkSeen");
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  const tabs = useMemo(
    () => [
      {
        key: "schedule" as const,
        label: ui.scheduleTabLabel ?? "Our Travel Schedule",
        count: data.scheduledEvents.length,
      },
      {
        key: "dealers" as const,
        label: ui.dealersTabLabel ?? "Our Dealers",
        count: data.dealers.length,
      },
    ],
    [data.dealers.length, data.scheduledEvents.length, ui.dealersTabLabel, ui.scheduleTabLabel],
  );
  const heading = ui.title ?? "Travel network";
  const lead = ui.lead ?? "Meet us on the road";
  const supporting =
    ui.supporting ?? "Track our travel schedule or connect with a trusted Perazzi dealer closest to you.";
  const backgroundSrc = ui.backgroundImage?.url
    ?? "/redesign-photos/experience/pweb-experience-travelnetwork-bg.jpg";
  const backgroundAlt = ui.backgroundImage?.alt ?? "Perazzi travel network background";
  const emptyScheduleText =
    ui.emptyScheduleText ?? "New travel stops are being confirmed. Check back shortly.";
  const emptyDealersText = ui.emptyDealersText ?? "Dealer roster is being configured in Sanity.";

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="TravelNetworkSeen"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed"
      aria-labelledby="travel-network-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={backgroundSrc}
          alt={backgroundAlt}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-(--scrim-soft)"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="absolute inset-0 overlay-gradient-canvas" aria-hidden />
      </div>

      <Container size="xl" className="relative z-10">
        <Section padding="md" className="space-y-6 bg-card/40">
          <motion.div
            className="space-y-3"
            initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
            whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
            transition={motionEnabled ? homeMotion.revealFast : undefined}
          >
            <Heading
              id="travel-network-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {heading}
            </Heading>
            <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
              {lead}
            </Text>
            <Text className="type-section-subtitle text-ink-muted" leading="relaxed">
              {supporting}
            </Text>
          </motion.div>

          <LayoutGroup id="experience-travel-network-tabs">
            <div
              role="tablist"
              aria-label="Experience travel and support tabs"
              className="flex flex-wrap gap-2 md:gap-3"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <motion.button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      "group relative overflow-hidden type-label-tight pill border border-border/70 bg-card/60 shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring",
                      isActive ? "text-perazzi-white" : "text-ink",
                    )}
                    onClick={() => { setActiveTab(tab.key); }}
                    initial={false}
                    whileHover={motionEnabled ? { x: 2, transition: homeMotion.micro } : undefined}
                    whileTap={motionEnabled ? { x: 0, transition: homeMotion.micro } : undefined}
                  >
                    {isActive ? (
                      motionEnabled ? (
                        <motion.span
                          layoutId="experience-travel-network-tab-highlight"
                          className="absolute inset-0 rounded-sm bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                          transition={homeMotion.springHighlight}
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="absolute inset-0 rounded-sm bg-perazzi-red shadow-elevated ring-1 ring-white/10"
                          aria-hidden="true"
                        />
                      )
                    ) : null}
                    <span className="relative z-10">
                      {tab.label}
                      <span className={cn("ml-2 type-caption", isActive ? "text-white/75" : "text-ink-muted")}>
                        ({tab.count})
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>

          <div>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={activeTab}
                initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={motionEnabled ? { opacity: 0, y: -14, filter: "blur(10px)" } : undefined}
                transition={motionEnabled ? homeMotion.revealFast : undefined}
              >
                {activeTab === "schedule" ? (
                  <ScheduleList
                    events={data.scheduledEvents}
                    emptyText={emptyScheduleText}
                    motionEnabled={motionEnabled}
                  />
                ) : (
                  <DealerList
                    dealers={data.dealers}
                    emptyText={emptyDealersText}
                    motionEnabled={motionEnabled}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </Section>
      </Container>
    </section>
  );
}

function ScheduleList({ events, emptyText, motionEnabled }: ScheduleListProps & { motionEnabled: boolean }) {
  if (!events.length) {
    return (
      <Text size="md" muted>
        {emptyText}
      </Text>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={motionEnabled ? "hidden" : false}
      animate={motionEnabled ? "show" : undefined}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: motionEnabled ? 0.06 : 0 } },
      }}
    >
      {events.map((event) => (
        <motion.article
          key={event._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated md:p-6 lg:p-7"
          variants={{
            hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
          }}
        >
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          <Text className="type-button text-ink-muted">
            {formatDateRange(event.startDate, event.endDate)}
          </Text>
          <Heading level={3} className="mt-2 mb-7 type-card-title text-ink text-3xl">
            {event.eventName}
          </Heading>
          <Text className="type-card-title text-ink-muted">
            {event.eventLocation}
          </Text>
          {event.location ? (
            <Text size="md" muted className="mt-2">
              {event.location}
            </Text>
          ) : null}
        </motion.article>
      ))}
    </motion.div>
  );
}

function DealerList({ dealers, emptyText, motionEnabled }: DealerListProps & { motionEnabled: boolean }) {
  if (!dealers.length) {
    return (
      <Text size="md" muted>
        {emptyText}
      </Text>
    );
  }

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2"
      initial={motionEnabled ? "hidden" : false}
      animate={motionEnabled ? "show" : undefined}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: motionEnabled ? 0.06 : 0 } },
      }}
    >
      {dealers.map((dealer) => (
        <motion.article
          key={dealer._id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card/80 hover:shadow-elevated sm:rounded-3xl sm:bg-card/80 sm:shadow-elevated"
          variants={{
            hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
          }}
        >
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          <Heading level={3} className="mb-7 type-card-title text-ink text-3xl">
            {dealer.dealerName}
          </Heading>
          <Text className="type-button text-ink-muted">
            {dealer.state}
          </Text>
          <Text asChild className="mt-2 type-body text-ink-muted">
            <p>
              {dealer.address}
              <br />
              {dealer.city}
            </p>
          </Text>
        </motion.article>
      ))}
    </motion.div>
  );
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) return "Dates TBA";

  const format = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(value))
      : null;

  const startDate = format(start);
  const endDate = format(end);

  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} – ${endDate}`;
  }

  return startDate ?? endDate ?? "Dates TBA";
}
