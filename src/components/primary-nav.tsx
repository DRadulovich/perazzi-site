"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/shotguns", label: "Shotguns" },
  { href: "/bespoke", label: "Bespoke" },
  { href: "/heritage", label: "Heritage" },
  { href: "/experience", label: "Experience" },
  { href: "/service", label: "Service" },
  { href: "/journal", label: "Journal" },
];

export function PrimaryNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Primary" className="flex-1">
      <ul role="list" className="flex flex-wrap items-center gap-3 text-sm font-medium">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`focus-ring rounded-full px-3 py-1 transition-colors ${
                  isActive
                    ? "bg-elevated text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
