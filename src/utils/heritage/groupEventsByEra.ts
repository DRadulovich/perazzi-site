import { HERITAGE_ERAS } from "@/config/heritage-eras";
import { type HeritageEvent, type HeritageEra, type HeritageEraWithEvents } from "@/types/heritage";

export type { HeritageEraWithEvents } from "@/types/heritage";

export function groupEventsByEra(events: HeritageEvent[], eras: HeritageEra[] = HERITAGE_ERAS): HeritageEraWithEvents[] {
  const eraBuckets: Record<string, HeritageEvent[]> = {};

  for (const era of eras) {
    eraBuckets[era.id] = [];
  }

  for (const event of events) {
    if (!event) continue;

    const year = Number.parseInt(event.date, 10);

    if (Number.isNaN(year)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[groupEventsByEra] Skipping event with invalid date:", event);
      }
      continue;
    }

    const era = eras.find((entry) => {
      const cappedEnd = entry.isOngoing ? Number.MAX_SAFE_INTEGER : entry.endYear;
      return year >= entry.startYear && year <= cappedEnd;
    });

    if (!era) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[groupEventsByEra] No matching era for event year",
          year,
          "event:",
          event,
        );
      }
      continue;
    }

    eraBuckets[era.id].push(event);
  }

  return eras.map((era): HeritageEraWithEvents => {
    const orderedEvents = [...(eraBuckets[era.id] ?? [])].sort((a, b) => {
      const yearA = Number.parseInt(a.date, 10) || 0;
      const yearB = Number.parseInt(b.date, 10) || 0;

      if (yearA !== yearB) return yearA - yearB;
      return a.title.localeCompare(b.title);
    });

    return {
      ...era,
      events: orderedEvents,
    };
  });
}
