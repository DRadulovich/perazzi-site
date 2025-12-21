"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";

export function WeekNav({ weeks }: { weeks: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("week") ?? weeks[0] ?? null;
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={isPending}>
      {weeks.map((week) => {
        const isActive = week === active;
        const href = `/admin/pgpt-insights/triggers?week=${week}`;
        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          startTransition(() => router.push(href));
        };
        return (
          <Link
            key={week}
            href={href}
            onClick={handleClick}
            className={`inline-flex items-center rounded-lg border px-3 py-1 text-[11px] font-semibold transition ${
              isActive
                ? "border-blue-500/60 bg-blue-500/10 text-blue-700"
                : "border-border bg-muted/40 text-foreground hover:bg-muted/60"
            }`}
          >
            {new Date(week).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            {isActive && isPending ? (
              <svg
                className="ml-1 h-3 w-3 animate-spin text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" />
              </svg>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
