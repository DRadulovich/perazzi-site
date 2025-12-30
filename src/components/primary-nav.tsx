"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import type { Dispatch, ReactElement, SetStateAction } from "react";
import { useId, useState, useSyncExternalStore } from "react";
import { ArrowRight, ChevronDown, Menu, UserRound, X } from "lucide-react";
import useMeasure from "react-use-measure";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Container, Heading, Text } from "@/components/ui";

type FlyoutRenderer = (props: { onNavigate?: () => void; textTone?: "light" | "dark" }) => ReactElement;

type NavItem = {
  text: string;
  href: string;
  component?: FlyoutRenderer;
};

type NavTone = "light" | "dark";

type PrimaryNavProps = Readonly<{
  brandLabel: string;
  ariaLabel: string;
  variant?: "brand" | "transparent";
}>;

const SCROLL_THRESHOLD = 160;
const FLYOUT_GLASS_WRAPPER =
  "overflow-hidden rounded-2xl border border-canvas/10 bg-canvas/50 text-white shadow-medium ring-1 ring-white/10 backdrop-blur-sm sm:rounded-3xl";
const FLYOUT_GLASS_ARROW = "bg-black/50 shadow-medium ring-1 ring-white/10";
const FLYOUT_GLASS_PANEL = "bg-black/50";
const FLYOUT_GLASS_PANEL_ALT = "bg-black/50";
const FLYOUT_GLASS_ITEM =
  "rounded-2xl border border-ink/10 bg-canvas/5 shadow-soft transition-colors hover:border-ink/25 hover:bg-canvas/70";

const getScrollSnapshot = () => {
  const globalWindow: Window | undefined = globalThis.window;
  return globalWindow === undefined ? 0 : globalWindow.scrollY;
};
const getScrollServerSnapshot = () => 0;
const subscribeToScroll = (callback: () => void) => {
  const globalWindow: Window | undefined = globalThis.window;
  if (globalWindow === undefined) return () => {};
  const onScroll = () => callback();
  globalWindow.addEventListener("scroll", onScroll, { passive: true });
  globalWindow.addEventListener("resize", onScroll);
  globalWindow.addEventListener("orientationchange", onScroll);
  globalWindow.addEventListener("pageshow", onScroll);
  globalWindow.addEventListener("popstate", onScroll);
  globalWindow.addEventListener("hashchange", onScroll);
  return () => {
    globalWindow.removeEventListener("scroll", onScroll);
    globalWindow.removeEventListener("resize", onScroll);
    globalWindow.removeEventListener("orientationchange", onScroll);
    globalWindow.removeEventListener("pageshow", onScroll);
    globalWindow.removeEventListener("popstate", onScroll);
    globalWindow.removeEventListener("hashchange", onScroll);
  };
};

export function PrimaryNav({ brandLabel, ariaLabel, variant = "brand" }: PrimaryNavProps) {
  const pathname = usePathname();
  const scrollY = useSyncExternalStore(subscribeToScroll, getScrollSnapshot, getScrollServerSnapshot);
  const scrolled = scrollY > SCROLL_THRESHOLD;
  const isTransparent = variant === "transparent";
  const tone: NavTone = isTransparent ? "dark" : "light";

  let navBackground = "bg-perazzi-red";
  if (isTransparent) {
    navBackground = scrolled ? "bg-card/80 backdrop-blur-md" : "bg-transparent";
  }

  let navShadow = "shadow-soft";
  if (isTransparent) {
    navShadow = scrolled ? "shadow-soft" : "shadow-none";
  } else if (scrolled) {
    navShadow = "shadow-elevated";
  }

  const navText = tone === "light" ? "text-white" : "text-ink";

  return (
    <nav
      aria-label={ariaLabel}
      className={`w-full transition-all ${navBackground} ${navShadow} ${navText}`}
    >
      <Container size="xl" className="flex items-center justify-between gap-4 py-4">
        <Logo label={brandLabel} />
        <div className="hidden items-center gap-6 lg:flex">
          <Links pathname={pathname ?? "/"} tone={tone} />
          <CTAs tone={tone} />
          <ThemeToggle variant={tone === "light" ? "inverted" : "default"} />
        </div>
        <div className="flex items-center gap-3 lg:hidden">
          <MobileMenu
            pathname={pathname ?? "/"}
            brandLabel={brandLabel}
            ariaLabel={ariaLabel}
            tone={tone}
          />
          <ThemeToggle variant={tone === "light" ? "ghost" : "default"} />
        </div>
      </Container>
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
      className="h-auto w-22"
    />
  </Link>
);

const Links = ({ pathname, tone }: { pathname: string; tone: NavTone }) => (
  <div className="flex items-center gap-6">
    {NAV_LINKS.map((item) => (
      <NavLink key={item.text} item={item} pathname={pathname} tone={tone} />
    ))}
  </div>
);

const NavLink = ({ item, pathname, tone }: { item: NavItem; pathname: string; tone: NavTone }) => {
  const [open, setOpen] = useState(false);
  const FlyoutContent = item.component;
  const hasFlyout = Boolean(FlyoutContent);
  const showFlyout = Boolean(FlyoutContent && open);
  const isActive = item.href === "/"
    ? pathname === "/"
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const activeTextClass = tone === "light" ? "text-white" : "text-ink";
  const inactiveTextClass = tone === "light" ? "text-white/70 hover:text-white" : "text-ink/70 hover:text-ink";
  const linkTextClass = isActive ? activeTextClass : inactiveTextClass;

  if (!hasFlyout || !FlyoutContent) {
    return (
      <div className="relative">
        <Link
          href={item.href}
          className={`relative inline-flex h-8 items-center type-button tracking-normal transition-colors ${linkTextClass}`}
        >
          {item.text}
          <span
            className={`absolute -bottom-1 left-0 right-0 h-0.5 origin-left rounded-full transition-transform duration-300 ease-out ${
              tone === "light" ? "bg-white" : "bg-ink"
            } ${isActive ? "scale-x-100" : "scale-x-0"}`}
          />
        </Link>
      </div>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className="relative flex items-center gap-1"
      >
        {/*
          Switch link treatment so transparent variant remains legible on light admin backgrounds.
          Tone drives text/underline colors while preserving hover + active affordances.
        */}
        <Link
          href={item.href}
          className={`relative inline-flex h-8 items-center type-button tracking-normal transition-colors ${linkTextClass}`}
          onClick={() => setOpen(false)}
        >
          {item.text}
          <span
            className={`absolute -bottom-1 left-0 right-0 h-0.5 origin-left rounded-full transition-transform duration-300 ease-out ${
              tone === "light" ? "bg-white" : "bg-ink"
            } ${(showFlyout || isActive) ? "scale-x-100" : "scale-x-0"}`}
          />
        </Link>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={`Open ${item.text} menu`}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-ring ${
              tone === "light"
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </Popover.Trigger>
        <Popover.Content
          forceMount
          side="bottom"
          align="center"
          sideOffset={12}
          className="z-20 text-white"
        >
          <AnimatePresence>
            {showFlyout && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-white"
              >
                <div
                  className={`absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 ${FLYOUT_GLASS_ARROW}`}
                />
                <div className={`relative ${FLYOUT_GLASS_WRAPPER}`}>
                  <FlyoutContent
                    onNavigate={() => setOpen(false)}
                    textTone="light"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Popover.Content>
      </div>
    </Popover.Root>
  );
};

const CTAs = ({ tone }: { tone: NavTone }) => (
  <div className="flex items-center gap-3">
    <Link
      href="/concierge"
      className={`flex items-center gap-2 rounded-xl px-4 py-2 type-button tracking-normal transition-colors ${
        tone === "light"
          ? "border border-white/50 text-white/70 hover:bg-white/10 hover:text-white"
          : "border border-white/50 text-white/70 hover:border-white hover:bg-white/10 hover:text-white"
      }`}
    >
      <UserRound className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      <span>Build Planner</span>
    </Link>
    <a
      href="https://store.perazzi.com"
      target="_blank"
      rel="noreferrer"
      className={`rounded-xl border px-4 py-2 type-button tracking-normal text-white transition-colors ${
        tone === "light"
          ? "border-perazzi-red bg-perazzi-red hover:border-white"
          : "border-perazzi-red bg-perazzi-red hover:brightness-95"
      }`}
    >
      Store
    </a>
  </div>
);

const ShotgunsFlyout: FlyoutRenderer = ({ onNavigate }) => (
  <div
    className="grid w-full grid-cols-12 lg:w-[650px]"
  >
    <div
      className={`col-span-12 flex flex-col justify-between border-b border-white/10 p-6 lg:col-span-4 lg:border-b-0 lg:border-r ${FLYOUT_GLASS_PANEL}`}
    >
      <div>
        <Heading level={2} className="mb-2 type-card-title text-white">
          Shotguns
        </Heading>
        <Text className="type-body italic text-white/70" leading="normal">
          Explore dedicated Perazzi platforms—from high-trap geometry to MX race-ready builds.
        </Text>
      </div>
      <Link
        href="/shotguns"
        className="mt-6 inline-flex items-center gap-1 type-button text-perazzi-red"
        onClick={onNavigate}
      >
        All shotguns <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
    <div
      className={`col-span-12 grid grid-cols-2 gap-3 p-6 lg:col-span-8 ${FLYOUT_GLASS_PANEL_ALT}`}
    >
      {SHOTGUN_GRID.map((entry) => (
        <Link
          key={entry.title}
          href={entry.href}
          className={`${FLYOUT_GLASS_ITEM} p-4 text-left`}
          onClick={onNavigate}
        >
          <Heading level={3} size="sm" className="text-white not-italic font-semibold">
            {entry.title}
          </Heading>
          <Text size="sm" className="mt-1 text-white/70 italic" leading="normal">
            {entry.description}
          </Text>
        </Link>
      ))}
    </div>
  </div>
);

const ExperienceFlyout: FlyoutRenderer = ({ onNavigate }) => (
  <div
    className="w-full p-6 text-ink lg:w-[520px]"
  >
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <Text size="label-tight" className="text-perazzi-red" leading="normal">
          TRAVEL
        </Text>
        <div className="mt-3 space-y-2">
            <Link
              href="/experience#visit"
              className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 type-nav text-ink not-italic font-semibold transition-colors hover:border-white/30 hover:bg-white/10"
              onClick={onNavigate}
            >
            Plan a visit <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
            <Link
              href="/experience#fitting"
              className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 type-nav text-ink not-italic font-semibold transition-colors hover:border-white/30 hover:bg-white/10"
              onClick={onNavigate}
            >
            Book a fitting <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div>
        <Text size="label-tight" className="text-perazzi-red" leading="normal">
          INQUIRE
        </Text>
        <div className="mt-3 space-y-2">
            <Link
              href="/experience#dealers"
              className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 type-nav text-ink not-italic font-semibold transition-colors hover:border-white/30 hover:bg-white/10"
              onClick={onNavigate}
            >
            Find a dealer <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
            <Link
              href="/journal"
              className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 type-nav text-ink not-italic font-semibold transition-colors hover:border-white/30 hover:bg-white/10"
              onClick={onNavigate}
            >
            Visit the journal <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
    <Link
      href="/experience#dealers"
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-2 type-button text-ink transition-colors hover:border-perazzi-red/60 hover:bg-perazzi-red"
      onClick={onNavigate}
    >
      Find a dealer
    </Link>
  </div>
);

const HeritageFlyout: FlyoutRenderer = ({ onNavigate }) => (
  <div
    className="grid w-full grid-cols-12 text-white lg:w-[680px]"
  >
    <div
      className={`col-span-12 flex flex-col justify-between border-b border-white/10 p-6 lg:col-span-4 lg:border-b-0 lg:border-r ${FLYOUT_GLASS_PANEL}`}
    >
      <div>
        <Heading level={2} className="mb-2 type-card-title text-white">
          Heritage
        </Heading>
        <Text className="type-body italic text-white/70" leading="normal">
          Trace Perazzi craft across eras—factory milestones, champions, and oral histories.
        </Text>
      </div>
      <Link
        href="/heritage"
        className="mt-6 inline-flex items-center gap-1 type-button text-perazzi-red"
        onClick={onNavigate}
      >
        Explore heritage <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
    <div
      className={`col-span-12 grid gap-3 p-6 lg:col-span-8 lg:grid-cols-3 ${FLYOUT_GLASS_PANEL_ALT}`}
    >
      {HERITAGE_LINKS.map((section) => (
        <div key={section.title} className="space-y-2">
          <Text size="label-tight" className="text-perazzi-red" leading="normal">
            {section.title}
          </Text>
          {section.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 type-nav text-white/90 not-italic font-semibold transition-colors hover:border-white/25 hover:bg-white/10"
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
  ariaLabel,
  tone,
}: {
  pathname: string;
  brandLabel: string;
  ariaLabel: string;
  tone: NavTone;
}) => {
  const [open, setOpen] = useState(false);
  const triggerTone = tone === "light"
    ? "text-white hover:bg-white/10"
    : "text-ink hover:bg-ink/5";

  return (
    <div className="lg:hidden">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl transition-colors focus-ring ${triggerTone}`}
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/80 backdrop-blur-none opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-70 flex w-full max-w-sm flex-col outline-none translate-x-full transition-transform duration-200 data-[state=open]:translate-x-0">
            <Dialog.Title className="sr-only">{ariaLabel}</Dialog.Title>
            <div className="flex h-full flex-col border-l border-white/10 bg-canvas/5 text-ink shadow-elevated outline-none backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <Logo label={brandLabel} />
                <Dialog.Close asChild>
                  <button
                    aria-label="Close navigation menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5 focus-ring"
                  >
                    <X className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
                  </button>
                </Dialog.Close>
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
              <div className="border-t border-white/10 px-6 py-4">
                <CTAs tone="dark" />
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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
  const contentId = useId();
  const [ref, { height }] = useMeasure();
  const FlyoutContent = item.component;
  const isActive = item.href === "/"
    ? currentPath === "/"
    : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

  return (
    <div className="border-b border-white/10 py-4">
      <div className="flex items-center justify-between">
        <Link
          href={item.href}
          className={`type-title-sm transition-colors ${
            isActive ? "text-perazzi-red" : "text-white hover:text-perazzi-red"
          }`}
          onClick={() => setMenuOpen(false)}
        >
          {item.text}
        </Link>
        {hasFold ? (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={`Toggle ${item.text} links`}
            aria-expanded={open}
            aria-controls={contentId}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5 focus-ring"
          >
            <motion.div animate={{ rotate: open ? 180 : 0 }}>
              <ChevronDown className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </motion.div>
          </button>
        ) : (
          <ArrowRight className="h-5 w-5 text-white" strokeWidth={2} aria-hidden="true" />
        )}
      </div>
      {hasFold && FlyoutContent && (
        <motion.div
          id={contentId}
          initial={false}
          animate={{
            height: open ? height : 0,
            marginTop: open ? 16 : 0,
          }}
          className="overflow-hidden"
        >
          <div
            ref={ref}
            className={FLYOUT_GLASS_WRAPPER}
          >
            <FlyoutContent onNavigate={() => setMenuOpen(false)} textTone="light" />
          </div>
        </motion.div>
      )}
    </div>
  );
};
