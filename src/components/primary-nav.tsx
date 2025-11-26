"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import type { Dispatch, ReactElement, ReactNode, SetStateAction } from "react";
import { useState } from "react";
import { FiArrowRight, FiChevronDown, FiMenu, FiX } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import useMeasure from "react-use-measure";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type FlyoutRenderer = (props: { onNavigate?: () => void; textTone?: "light" | "dark" }) => ReactElement;

type NavItem = {
  text: string;
  href: string;
  component?: FlyoutRenderer;
};

type PrimaryNavProps = {
  brandLabel: string;
};

export function PrimaryNav({ brandLabel }: PrimaryNavProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 160);
  });

  return (
    <nav
      className={`w-full bg-perazzi-red text-white shadow transition-all ${
        scrolled ? "shadow-2xl" : "shadow-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Logo label={brandLabel} />
        <div className="hidden items-center gap-6 lg:flex">
          <Links pathname={pathname ?? "/"} />
          <CTAs />
          <ThemeToggle variant="inverted" />
        </div>
        <div className="flex items-center gap-3 lg:hidden">
          <MobileMenu pathname={pathname ?? "/"} brandLabel={brandLabel} />
          <ThemeToggle variant="ghost" />
        </div>
      </div>
    </nav>
  );
}

const Logo = ({ label }: { label: string }) => (
  <Link href="/" className="inline-flex items-center">
    <span className="sr-only">{label}</span>
    <Image
      src="/PLW.png"
      alt="Perazzi logo"
      width={120}
      height={38}
      priority
      className="h-10 w-auto"
    />
  </Link>
);

const Links = ({ pathname }: { pathname: string }) => (
  <div className="flex items-center gap-6">
    {NAV_LINKS.map((item) => (
      <NavLink key={item.text} item={item} pathname={pathname} />
    ))}
  </div>
);

const NavLink = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const [open, setOpen] = useState(false);
  const FlyoutContent = item.component;
  const showFlyout = Boolean(FlyoutContent && open);
  const isActive = item.href === "/"
    ? pathname === "/"
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative"
    >
      <Link
        href={item.href}
        className={`relative text-sm font-semibold transition-colors ${
          isActive ? "text-white" : "text-white/70 hover:text-white"
        }`}
      >
        {item.text}
        <span
          className="absolute -bottom-1 left-0 right-0 h-0.5 origin-left rounded-full bg-white transition-transform duration-300 ease-out"
          style={{ transform: showFlyout || isActive ? "scaleX(1)" : "scaleX(0)" }}
        />
      </Link>
      <AnimatePresence>
        {showFlyout && FlyoutContent && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ translateX: "-50%" }}
            className="absolute left-1/2 top-12 z-20 text-ink"
          >
            <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
            <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
            <div className="relative rounded-3xl bg-white text-perazzi-black shadow-2xl ring-1 ring-black/5">
              <FlyoutContent textTone="dark" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CTAs = () => (
  <div className="flex items-center gap-3">
    <Link
      href="/concierge"
      className="flex items-center gap-2 rounded-xl border border-white/50 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-perazzi-black"
    >
      <FaUserCircle />
      <span>Build Planner</span>
    </Link>
    <a
      href="https://store.perazzi.com"
      target="_blank"
      rel="noreferrer"
      className="rounded-xl border border-perazzi-red bg-perazzi-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white"
    >
      Store
    </a>
  </div>
);

const ShotgunsFlyout: FlyoutRenderer = ({ onNavigate, textTone = "light" }) => (
  <div
    className={`grid w-full grid-cols-12 rounded-3xl lg:w-[650px] ${
      textTone === "dark" ? "text-perazzi-black" : "text-white"
    }`}
  >
    <div className="col-span-12 flex flex-col justify-between bg-perazzi-black p-6 text-white lg:col-span-4">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Shotguns</h2>
        <p className="text-sm text-white">
          Explore dedicated Perazzi platforms—from high-trap geometry to MX race-ready builds.
        </p>
      </div>
      <Link
        href="/shotguns"
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white/90"
        onClick={onNavigate}
      >
        All shotguns <FiArrowRight />
      </Link>
    </div>
    <div className="col-span-12 grid grid-cols-2 gap-3 bg-white p-6 text-perazzi-black lg:col-span-8">
      {SHOTGUN_GRID.map((entry) => (
        <Link
          key={entry.title}
          href={entry.href}
          className="rounded-2xl border border-border/70 p-4 text-left transition-colors hover:border-perazzi-black/60"
          onClick={onNavigate}
        >
          <h3 className="font-semibold text-perazzi-red">{entry.title}</h3>
          <p className="mt-1 text-xs text-perazzi-black">{entry.description}</p>
        </Link>
      ))}
    </div>
  </div>
);

const ExperienceFlyout: FlyoutRenderer = ({ onNavigate, textTone = "light" }) => (
  <div
    className={`w-full rounded-3xl p-6 shadow-none lg:w-[520px] lg:shadow-xl ${
      textTone === "dark" ? "bg-perazzi-black text-white" : "bg-white text-perazzi-black"
    }`}
  >
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-muted">
          TRAVEL
        </h3>
        <div className="mt-3 space-y-2">
          <Link
            href="/experience#visit"
            className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold hover:border-perazzi-red/60"
            onClick={onNavigate}
          >
            Plan a visit <FiArrowRight />
          </Link>
          <Link
            href="/experience#fitting"
            className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold hover:border-perazzi-red/60"
            onClick={onNavigate}
          >
            Book a fitting <FiArrowRight />
          </Link>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-muted">
          INQUIRE
        </h3>
        <div className="mt-3 space-y-2">
          <Link
            href="/experience#dealers"
            className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold hover:border-perazzi-red/60"
            onClick={onNavigate}
          >
            Find a dealer <FiArrowRight />
          </Link>
          <Link
            href="/journal"
            className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold hover:border-perazzi-red/60"
            onClick={onNavigate}
          >
            Visit the journal <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
    <Link
      href="/experience#dealers"
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-perazzi-black px-4 py-2 text-sm font-semibold text-perazzi-black transition-colors hover:bg-perazzi-black hover:text-white"
      onClick={onNavigate}
    >
      Find a dealer
    </Link>
  </div>
);

const HeritageFlyout: FlyoutRenderer = ({ onNavigate, textTone = "light" }) => (
  <div
    className={`grid w-full grid-cols-12 rounded-3xl lg:w-[680px] ${
      textTone === "dark" ? "text-white" : "text-perazzi-black"
    }`}
  >
    <div className="col-span-12 flex flex-col justify-between bg-card p-6 text-perazzi-black lg:col-span-4">
      <div>
        <h2 className="text-xl font-semibold text-ink">Heritage</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Trace Perazzi craft across eras—factory milestones, champions, and oral histories.
        </p>
      </div>
      <Link
        href="/heritage"
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-perazzi-red"
        onClick={onNavigate}
      >
        Explore heritage <FiArrowRight />
      </Link>
    </div>
    <div className="col-span-12 grid gap-3 bg-white p-6 text-perazzi-black lg:col-span-8 lg:grid-cols-3">
      {HERITAGE_LINKS.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-perazzi-red">
            {section.title}
          </h3>
          {section.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block rounded-xl border border-border/60 px-3 py-2 text-sm font-medium text-perazzi-black transition-colors hover:border-perazzi-red/50"
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const NAV_LINKS: NavItem[] = [
  { text: "Home", href: "/" },
  { text: "Shotguns", href: "/shotguns", component: ShotgunsFlyout },
  { text: "Bespoke Journey", href: "/bespoke" },
  { text: "Experience", href: "/experience", component: ExperienceFlyout },
  { text: "Heritage", href: "/heritage", component: HeritageFlyout },
  { text: "Service", href: "/service" },
];

const SHOTGUN_GRID = [
  {
    title: "HT Platform",
    description: "Focused balance with adjustable high-rib geometry.",
    href: "/shotguns/ht",
  },
  {
    title: "MX Platform",
    description: "MX lineage tuned for Olympic and sporting lineups.",
    href: "/shotguns/mx",
  },
  {
    title: "Engraving Library",
    description: "Search every catalogued engraving pattern in high resolution.",
    href: "/engravings",
  },
  {
    title: "Model Search",
    description: "Browse every current Perazzi model across all platforms.",
    href: "/shotguns/all",
  },
];

const HERITAGE_LINKS = [
  {
    title: "Timeline",
    links: [
      { label: "Milestones", href: "/heritage#timeline" },
      { label: "Feats", href: "/heritage#champions" },
    ],
  },
  {
    title: "Champions",
    links: [
      { label: "Gallery", href: "/heritage#heritage-champions" },
      { label: "Stories", href: "/heritage#oral-histories" },
    ],
  },
  {
    title: "Stories",
    links: [
      { label: "Photo Essays", href: "/heritage#factory-photo-essay" },
      { label: "Archives", href: "/heritage#heritage-after-timeline" },
    ],
  },
];

const MobileMenu = ({
  pathname,
  brandLabel,
}: {
  pathname: string;
  brandLabel: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="text-2xl text-white focus:outline-none"
        aria-label="Open navigation menu"
      >
        <FiMenu />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-perazzi-black text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <Logo label={brandLabel} color="#1F1F1F" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="text-2xl text-ink"
              >
                <FiX />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {NAV_LINKS.map((item) => (
                <MobileMenuLink
                  key={item.text}
                  item={item}
                  currentPath={pathname}
                  setMenuOpen={setOpen}
                />
              ))}
            </div>
            <div className="border-t border-border px-6 py-4">
              <CTAs />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileMenuLink = ({
  item,
  currentPath,
  setMenuOpen,
}: {
  item: NavItem;
  currentPath: string;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const hasFold = Boolean(item.component);
  const [open, setOpen] = useState(false);
  const [ref, { height }] = useMeasure();
  const FlyoutContent = item.component;
  const isActive = item.href === "/"
    ? currentPath === "/"
    : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

  return (
    <div className="border-b border-border py-4">
      <div className="flex items-center justify-between">
        <Link
          href={item.href}
          className={`text-lg font-semibold ${isActive ? "text-perazzi-red" : "text-ink"}`}
          onClick={() => setMenuOpen(false)}
        >
          {item.text}
        </Link>
        {hasFold ? (
          <button
            onClick={() => setOpen((prev) => !prev)}
            aria-label={`Toggle ${item.text} links`}
            className="text-2xl text-ink"
          >
            <motion.div animate={{ rotate: open ? 180 : 0 }}>
              <FiChevronDown />
            </motion.div>
          </button>
        ) : (
          <FiArrowRight className="text-ink" />
        )}
      </div>
      {hasFold && FlyoutContent && (
        <motion.div
          initial={false}
          animate={{
            height: open ? height : 0,
            marginTop: open ? 16 : 0,
          }}
          className="overflow-hidden"
        >
          <div ref={ref} className="rounded-2xl bg-card p-3 text-perazzi-black">
            <FlyoutContent onNavigate={() => setMenuOpen(false)} textTone="dark" />
          </div>
        </motion.div>
      )}
    </div>
  );
};
