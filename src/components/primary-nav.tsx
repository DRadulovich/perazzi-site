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
import type {
  SiteNavCtas,
  SiteNavFlyouts,
  SiteNavLink,
  SiteStoreLink,
} from "@/types/site-settings";

type FlyoutRenderer<TData> = (props: {
  onNavigate?: () => void;
  textTone?: "light" | "dark";
  data?: TData;
}) => ReactElement;

type NavTone = "light" | "dark";

type PrimaryNavProps = Readonly<{
  brandLabel: string;
  ariaLabel: string;
  variant?: "brand" | "transparent";
  navItems?: SiteNavLink[];
  navFlyouts?: SiteNavFlyouts;
  navCtas?: SiteNavCtas;
  storeLink?: SiteStoreLink;
}>;

type ShotgunsFlyoutData = {
  heading: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  cards: Array<{ title: string; description: string; href: string }>;
};

type ExperienceFlyoutData = {
  sections: Array<{
    label: string;
    links: Array<{ label: string; href: string }>;
  }>;
  footerCtaLabel: string;
  footerCtaHref: string;
};

type HeritageFlyoutData = {
  heading: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  columns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
};

type FlyoutKey = "shotguns" | "experience" | "heritage";

type FlyoutDataMap = {
  shotguns: ShotgunsFlyoutData;
  experience: ExperienceFlyoutData;
  heritage: HeritageFlyoutData;
};

type NavItemBase = {
  text: string;
  href: string;
};

type NavItemWithFlyout<K extends FlyoutKey> = NavItemBase & {
  flyout: K;
  flyoutData: FlyoutDataMap[K];
};

type FlyoutNavItem =
  | NavItemWithFlyout<"shotguns">
  | NavItemWithFlyout<"experience">
  | NavItemWithFlyout<"heritage">;

type ResolvedNavItem = NavItemBase | FlyoutNavItem;

type ShotgunsFlyoutInput = NonNullable<SiteNavFlyouts["shotguns"]>;
type ExperienceFlyoutInput = NonNullable<SiteNavFlyouts["experience"]>;
type HeritageFlyoutInput = NonNullable<SiteNavFlyouts["heritage"]>;

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

export function PrimaryNav({
  brandLabel,
  ariaLabel,
  variant = "brand",
  navItems,
  navFlyouts,
  navCtas,
  storeLink,
}: PrimaryNavProps) {
  const pathname = usePathname();
  const scrollY = useSyncExternalStore(subscribeToScroll, getScrollSnapshot, getScrollServerSnapshot);
  const scrolled = scrollY > SCROLL_THRESHOLD;
  const isTransparent = variant === "transparent";
  const tone: NavTone = isTransparent ? "dark" : "light";
  const flyouts = resolveFlyouts(navFlyouts);
  const items = buildNavItems(navItems, flyouts);
  const ctas = resolveCtas(navCtas, storeLink);

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
          <Links pathname={pathname ?? "/"} tone={tone} items={items} />
          <CTAs tone={tone} buildPlanner={ctas.buildPlanner} storeLink={ctas.storeLink} />
          <ThemeToggle variant={tone === "light" ? "inverted" : "default"} />
        </div>
        <div className="flex items-center gap-3 lg:hidden">
          <MobileMenu
            pathname={pathname ?? "/"}
            brandLabel={brandLabel}
            ariaLabel={ariaLabel}
            tone={tone}
            items={items}
            buildPlanner={ctas.buildPlanner}
            storeLink={ctas.storeLink}
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

const Links = ({ pathname, tone, items }: { pathname: string; tone: NavTone; items: ResolvedNavItem[] }) => (
  <div className="flex items-center gap-6">
    {items.map((item) => (
      <NavLink key={item.text} item={item} pathname={pathname} tone={tone} />
    ))}
  </div>
);

const getIsActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

const getLinkTextClass = (tone: NavTone, isActive: boolean) => {
  const activeTextClass = tone === "light" ? "text-white" : "text-ink";
  const inactiveTextClass = tone === "light" ? "text-white/70 hover:text-white" : "text-ink/70 hover:text-ink";
  return isActive ? activeTextClass : inactiveTextClass;
};

const SimpleNavLink = ({
  item,
  tone,
  linkTextClass,
  isActive,
}: {
  item: NavItemBase;
  tone: NavTone;
  linkTextClass: string;
  isActive: boolean;
}) => (
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

const FlyoutNavLink = ({
  item,
  tone,
  linkTextClass,
  isActive,
}: {
  item: FlyoutNavItem;
  tone: NavTone;
  linkTextClass: string;
  isActive: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const showFlyout = Boolean(open);
  const flyoutContent = renderFlyoutContent(item, { onNavigate: () => setOpen(false), textTone: "light" });

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
                  {flyoutContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Popover.Content>
      </div>
    </Popover.Root>
  );
};

const NavLink = ({ item, pathname, tone }: { item: ResolvedNavItem; pathname: string; tone: NavTone }) => {
  const isActive = getIsActive(pathname, item.href);
  const linkTextClass = getLinkTextClass(tone, isActive);
  const flyoutItem = isFlyoutItem(item) ? item : null;

  return flyoutItem ? (
    <FlyoutNavLink item={flyoutItem} tone={tone} linkTextClass={linkTextClass} isActive={isActive} />
  ) : (
    <SimpleNavLink item={item} tone={tone} linkTextClass={linkTextClass} isActive={isActive} />
  );
};

const CTAs = ({
  tone,
  buildPlanner,
  storeLink,
}: {
  tone: NavTone;
  buildPlanner: { label: string; href: string };
  storeLink: { label: string; href: string };
}) => (
  <div className="flex items-center gap-3">
    <Link
      href={buildPlanner.href}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 type-button tracking-normal transition-colors ${
        tone === "light"
          ? "border border-white/50 text-white/70 hover:bg-white/10 hover:text-white"
          : "border border-white/50 text-white/70 hover:border-white hover:bg-white/10 hover:text-white"
      }`}
    >
      <UserRound className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      <span>{buildPlanner.label}</span>
    </Link>
    <a
      href={storeLink.href}
      target="_blank"
      rel="noreferrer"
      className={`rounded-xl border px-4 py-2 type-button tracking-normal text-white transition-colors ${
        tone === "light"
          ? "border-perazzi-red bg-perazzi-red hover:border-white"
          : "border-perazzi-red bg-perazzi-red hover:brightness-95"
      }`}
    >
      {storeLink.label}
    </a>
  </div>
);

const ShotgunsFlyout: FlyoutRenderer<ShotgunsFlyoutData> = ({ onNavigate, data }) => {
  const flyout = data ?? DEFAULT_SHOTGUNS_FLYOUT;

  return (
    <div
      className="grid w-full grid-cols-12 lg:w-[650px]"
    >
      <div
        className={`col-span-12 flex flex-col justify-between border-b border-white/10 p-6 lg:col-span-4 lg:border-b-0 lg:border-r ${FLYOUT_GLASS_PANEL}`}
      >
        <div>
          <Heading level={2} className="mb-2 type-card-title text-white">
            {flyout.heading}
          </Heading>
          <Text className="type-body italic text-white/70" leading="normal">
            {flyout.description}
          </Text>
        </div>
        <Link
          href={flyout.ctaHref}
          className="mt-6 inline-flex items-center gap-1 type-button text-perazzi-red"
          onClick={onNavigate}
        >
          {flyout.ctaLabel} <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
      <div
        className={`col-span-12 grid grid-cols-2 gap-3 p-6 lg:col-span-8 ${FLYOUT_GLASS_PANEL_ALT}`}
      >
        {flyout.cards.map((entry) => (
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
};

const ExperienceFlyout: FlyoutRenderer<ExperienceFlyoutData> = ({ onNavigate, data }) => {
  const flyout = data ?? DEFAULT_EXPERIENCE_FLYOUT;

  return (
    <div
      className="w-full p-6 text-ink lg:w-[520px]"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {flyout.sections.map((section) => (
          <div key={section.label}>
            <Text size="label-tight" className="text-perazzi-red" leading="normal">
              {section.label}
            </Text>
            <div className="mt-3 space-y-2">
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 type-nav text-ink not-italic font-semibold transition-colors hover:border-white/30 hover:bg-white/10"
                  onClick={onNavigate}
                >
                  {link.label} <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Link
        href={flyout.footerCtaHref}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-2 type-button text-ink transition-colors hover:border-perazzi-red/60 hover:bg-perazzi-red"
        onClick={onNavigate}
      >
        {flyout.footerCtaLabel}
      </Link>
    </div>
  );
};

const HeritageFlyout: FlyoutRenderer<HeritageFlyoutData> = ({ onNavigate, data }) => {
  const flyout = data ?? DEFAULT_HERITAGE_FLYOUT;

  return (
    <div
      className="grid w-full grid-cols-12 text-white lg:w-[680px]"
    >
      <div
        className={`col-span-12 flex flex-col justify-between border-b border-white/10 p-6 lg:col-span-4 lg:border-b-0 lg:border-r ${FLYOUT_GLASS_PANEL}`}
      >
        <div>
          <Heading level={2} className="mb-2 type-card-title text-white">
            {flyout.heading}
          </Heading>
          <Text className="type-body italic text-white/70" leading="normal">
            {flyout.description}
          </Text>
        </div>
        <Link
          href={flyout.ctaHref}
          className="mt-6 inline-flex items-center gap-1 type-button text-perazzi-red"
          onClick={onNavigate}
        >
          {flyout.ctaLabel} <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
      <div
        className={`col-span-12 grid gap-3 p-6 lg:col-span-8 lg:grid-cols-3 ${FLYOUT_GLASS_PANEL_ALT}`}
      >
        {flyout.columns.map((section) => (
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
};

const isFlyoutItem = (item: ResolvedNavItem): item is FlyoutNavItem => "flyout" in item;

const renderFlyoutContent = (
  item: FlyoutNavItem,
  props: { onNavigate?: () => void; textTone?: "light" | "dark" },
): ReactElement | null => {
  switch (item.flyout) {
    case "shotguns":
      return <ShotgunsFlyout {...props} data={item.flyoutData} />;
    case "experience":
      return <ExperienceFlyout {...props} data={item.flyoutData} />;
    case "heritage":
      return <HeritageFlyout {...props} data={item.flyoutData} />;
    default:
      return null;
  }
};

const DEFAULT_NAV_LINKS = [
  { text: "Home", href: "/" },
  { text: "Shotguns", href: "/shotguns" },
  { text: "Bespoke Journey", href: "/bespoke" },
  { text: "Experience", href: "/experience" },
  { text: "Heritage", href: "/heritage" },
  { text: "Service", href: "/service" },
];

const DEFAULT_SHOTGUN_GRID = [
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

const DEFAULT_HERITAGE_LINKS = [
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

const DEFAULT_EXPERIENCE_SECTIONS: ExperienceFlyoutData["sections"] = [
  {
    label: "TRAVEL",
    links: [
      { label: "Plan a visit", href: "/experience#visit" },
      { label: "Book a fitting", href: "/experience#fitting" },
    ],
  },
  {
    label: "INQUIRE",
    links: [
      { label: "Find a dealer", href: "/experience#dealers" },
      { label: "Visit the journal", href: "/journal" },
    ],
  },
];

const DEFAULT_SHOTGUNS_FLYOUT: ShotgunsFlyoutData = {
  heading: "Shotguns",
  description: "Explore dedicated Perazzi platforms—from high-trap geometry to MX race-ready builds.",
  ctaLabel: "All shotguns",
  ctaHref: "/shotguns",
  cards: DEFAULT_SHOTGUN_GRID,
};

const DEFAULT_EXPERIENCE_FLYOUT: ExperienceFlyoutData = {
  sections: DEFAULT_EXPERIENCE_SECTIONS,
  footerCtaLabel: "Find a dealer",
  footerCtaHref: "/experience#dealers",
};

const DEFAULT_HERITAGE_FLYOUT: HeritageFlyoutData = {
  heading: "Heritage",
  description: "Trace Perazzi craft across eras—factory milestones, champions, and oral histories.",
  ctaLabel: "Explore heritage",
  ctaHref: "/heritage",
  columns: DEFAULT_HERITAGE_LINKS,
};

const DEFAULT_BUILD_PLANNER = { label: "Build Planner", href: "/concierge" };
const DEFAULT_STORE_LINK = { label: "Store", href: "https://store.perazzi.com" };

const hasValue = (value?: string | null) => Boolean(value && value.trim().length > 0);

const normalizeLinks = (links?: SiteNavLink[]) =>
  (links ?? [])
    .filter((link) => hasValue(link.label) && hasValue(link.href))
    .map((link) => ({
      label: link.label!.trim(),
      href: link.href!.trim(),
    }));

const normalizeShotgunsFlyout = (input?: ShotgunsFlyoutInput): ShotgunsFlyoutData => {
  const cards = (input?.cards ?? [])
    .filter((card) => hasValue(card.title) && hasValue(card.href) && hasValue(card.description))
    .map((card) => ({
      title: card.title!.trim(),
      description: card.description!.trim(),
      href: card.href!.trim(),
    }));

  const useCards = cards.length >= DEFAULT_SHOTGUNS_FLYOUT.cards.length;

  return {
    heading: input?.heading?.trim() || DEFAULT_SHOTGUNS_FLYOUT.heading,
    description: input?.description?.trim() || DEFAULT_SHOTGUNS_FLYOUT.description,
    ctaLabel: input?.ctaLabel?.trim() || DEFAULT_SHOTGUNS_FLYOUT.ctaLabel,
    ctaHref: input?.ctaHref?.trim() || DEFAULT_SHOTGUNS_FLYOUT.ctaHref,
    cards: useCards ? cards : DEFAULT_SHOTGUNS_FLYOUT.cards,
  };
};

const normalizeExperienceFlyout = (input?: ExperienceFlyoutInput): ExperienceFlyoutData => {
  const sections = (input?.sections ?? [])
    .filter((section) => hasValue(section.label) && section.links?.length)
    .map((section) => ({
      label: section.label!.trim(),
      links: normalizeLinks(section.links ?? []),
    }))
    .filter((section) => section.links.length > 0);

  const useSections = sections.length >= DEFAULT_EXPERIENCE_FLYOUT.sections.length;

  return {
    sections: useSections ? sections : DEFAULT_EXPERIENCE_FLYOUT.sections,
    footerCtaLabel: input?.footerCtaLabel?.trim() || DEFAULT_EXPERIENCE_FLYOUT.footerCtaLabel,
    footerCtaHref: input?.footerCtaHref?.trim() || DEFAULT_EXPERIENCE_FLYOUT.footerCtaHref,
  };
};

const normalizeHeritageFlyout = (input?: HeritageFlyoutInput): HeritageFlyoutData => {
  const columns = (input?.columns ?? [])
    .filter((column) => hasValue(column.title) && column.links?.length)
    .map((column) => ({
      title: column.title!.trim(),
      links: normalizeLinks(column.links ?? []),
    }))
    .filter((column) => column.links.length > 0);

  const useColumns = columns.length >= DEFAULT_HERITAGE_FLYOUT.columns.length;

  return {
    heading: input?.heading?.trim() || DEFAULT_HERITAGE_FLYOUT.heading,
    description: input?.description?.trim() || DEFAULT_HERITAGE_FLYOUT.description,
    ctaLabel: input?.ctaLabel?.trim() || DEFAULT_HERITAGE_FLYOUT.ctaLabel,
    ctaHref: input?.ctaHref?.trim() || DEFAULT_HERITAGE_FLYOUT.ctaHref,
    columns: useColumns ? columns : DEFAULT_HERITAGE_FLYOUT.columns,
  };
};

const resolveFlyouts = (flyouts?: SiteNavFlyouts) => ({
  shotguns: normalizeShotgunsFlyout(flyouts?.shotguns),
  experience: normalizeExperienceFlyout(flyouts?.experience),
  heritage: normalizeHeritageFlyout(flyouts?.heritage),
});

const resolveCtas = (navCtas?: SiteNavCtas, storeLink?: SiteStoreLink) => {
  const buildPlanner =
    hasValue(navCtas?.buildPlanner?.label) && hasValue(navCtas?.buildPlanner?.href)
      ? {
          label: navCtas!.buildPlanner!.label!.trim(),
          href: navCtas!.buildPlanner!.href!.trim(),
        }
      : DEFAULT_BUILD_PLANNER;

  const store =
    hasValue(storeLink?.label) && hasValue(storeLink?.href)
      ? {
          label: storeLink!.label!.trim(),
          href: storeLink!.href!.trim(),
        }
      : DEFAULT_STORE_LINK;

  return { buildPlanner, storeLink: store };
};

type SanitizedNavItem = { label: string; href: string };

const sanitizeNavItems = (items?: SiteNavLink[]): SanitizedNavItem[] =>
  normalizeLinks(items ?? []).map((item) => ({
    label: item.label,
    href: item.href,
  }));

const attachFlyout = (
  item: { text: string; href: string },
  flyouts: ReturnType<typeof resolveFlyouts>,
): ResolvedNavItem => {
  if (item.href === "/shotguns") {
    return { ...item, flyout: "shotguns", flyoutData: flyouts.shotguns };
  }
  if (item.href === "/experience") {
    return { ...item, flyout: "experience", flyoutData: flyouts.experience };
  }
  if (item.href === "/heritage") {
    return { ...item, flyout: "heritage", flyoutData: flyouts.heritage };
  }
  return { ...item };
};

const buildNavItems = (
  items: SiteNavLink[] | undefined,
  flyouts: ReturnType<typeof resolveFlyouts>,
): ResolvedNavItem[] => {
  const defaultItems = DEFAULT_NAV_LINKS.map((item) => attachFlyout(item, flyouts));
  const sanitized = sanitizeNavItems(items);
  if (!sanitized.length) return defaultItems;

  const defaultHrefs = new Set(DEFAULT_NAV_LINKS.map((item) => item.href));
  const cmsHrefs = new Set(sanitized.map((item) => item.href));
  const hasAllDefaults = Array.from(defaultHrefs).every((href) => cmsHrefs.has(href));

  if (hasAllDefaults && sanitized.length >= DEFAULT_NAV_LINKS.length) {
    return sanitized.map((item) =>
      attachFlyout({ text: item.label, href: item.href }, flyouts),
    );
  }

  const overrideMap = new Map(sanitized.map((item) => [item.href, item]));
  return defaultItems.map((item) => {
    const override = overrideMap.get(item.href);
    if (!override) return item;
    return attachFlyout(
      {
        text: override.label || item.text,
        href: override.href || item.href,
      },
      flyouts,
    );
  });
};

const MobileMenu = ({
  pathname,
  brandLabel,
  ariaLabel,
  tone,
  items,
  buildPlanner,
  storeLink,
}: {
  pathname: string;
  brandLabel: string;
  ariaLabel: string;
  tone: NavTone;
  items: ResolvedNavItem[];
  buildPlanner: { label: string; href: string };
  storeLink: { label: string; href: string };
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
                {items.map((item) => (
                  <MobileMenuLink
                    key={item.text}
                    item={item}
                    currentPath={pathname}
                    setMenuOpen={setOpen}
                  />
                ))}
              </div>
              <div className="border-t border-white/10 px-6 py-4">
                <CTAs tone="dark" buildPlanner={buildPlanner} storeLink={storeLink} />
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
  item: ResolvedNavItem;
  currentPath: string;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const flyoutItem = isFlyoutItem(item) ? item : null;
  const hasFold = Boolean(flyoutItem);
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const [ref, { height }] = useMeasure();
  const flyoutContent = flyoutItem
    ? renderFlyoutContent(flyoutItem, { onNavigate: () => setMenuOpen(false), textTone: "light" })
    : null;
  const isActive = item.href === "/"
    ? currentPath === "/"
    : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

  return (
    <div className="border-b border-white/10 py-4">
      <div className="flex items-center justify-between">
        <Link
          href={item.href}
          className={`type-card-title transition-colors ${
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
      {hasFold && flyoutContent && (
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
            {flyoutContent}
          </div>
        </motion.div>
      )}
    </div>
  );
};
