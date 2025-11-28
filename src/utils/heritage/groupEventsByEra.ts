import { HERITAGE_ERAS } from "@/config/heritage-eras";
import { type HeritageEvent, type HeritageEraWithEvents } from "@/types/heritage";

export type { HeritageEraWithEvents } from "@/types/heritage";

export function groupEventsByEra(events: HeritageEvent[]): HeritageEraWithEvents[] {
  const eraBuckets: Record<string, HeritageEvent[]> = {};

  for (const era of HERITAGE_ERAS) {
    eraBuckets[era.id] = [];
  }

  for (const event of events) {
    if (!event) continue;

    const year = parseInt(event.date, 10);

    if (Number.isNaN(year)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[groupEventsByEra] Skipping event with invalid date:", event);
      }
      continue;
    }

    const era = HERITAGE_ERAS.find(
      (entry) => year >= entry.startYear && year <= entry.endYear,
    );

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

  return HERITAGE_ERAS.map((era): HeritageEraWithEvents => {
    const orderedEvents = [...(eraBuckets[era.id] ?? [])].sort((a, b) => {
      const yearA = parseInt(a.date, 10) || 0;
      const yearB = parseInt(b.date, 10) || 0;

      if (yearA !== yearB) return yearA - yearB;
      return a.title.localeCompare(b.title);
    });

    return {
      ...era,
      events: orderedEvents,
    };
  });
}
