"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import type { Dispatch, FocusEvent, ReactElement, SetStateAction } from "react";
import { useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, UserRound, X } from "lucide-react";
import useMeasure from "react-use-measure";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type FlyoutRenderer = (props: { onNavigate?: () => void; textTone?: "light" | "dark" }) => ReactElement;

type NavItem = {
  text: string;
  href: string;
  component?: FlyoutRenderer;
};

type NavTone = "light" | "dark";

type PrimaryNavProps = Readonly<{
  brandLabel: string;
  variant?: "brand" | "transparent";
}>;

export function PrimaryNav({ brandLabel, variant = "brand" }: PrimaryNavProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const isTransparent = variant === "transparent";
  const tone: NavTone = isTransparent ? "dark" : "light";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 160);
  });

  const navBackground = isTransparent
    ? scrolled
      ? "bg-card/80 backdrop-blur-md"
      : "bg-transparent"
    : "bg-perazzi-red";

  const navShadow = isTransparent
    ? scrolled
      ? "shadow-sm"
      : "shadow-none"
    : scrolled
      ? "shadow-2xl"
      : "shadow-sm";

  const navText = tone === "light" ? "text-white" : "text-ink";

  return (
    <nav
      className={`w-full transition-all ${navBackground} ${navShadow} ${navText}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Logo label={brandLabel} />
        <div className="hidden items-center gap-6 lg:flex">
          <Links pathname={pathname ?? "/"} tone={tone} />
          <CTAs tone={tone} />
          <ThemeToggle variant={tone === "light" ? "inverted" : "default"} />
        </div>
        <div className="flex items-center gap-3 lg:hidden">
          <MobileMenu pathname={pathname ?? "/"} brandLabel={brandLabel} tone={tone} />
          <ThemeToggle variant={tone === "light" ? "ghost" : "default"} />
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

const Links = ({ pathname, tone }: { pathname: string; tone: NavTone }) => (
  <div className="flex items-center gap-6">
    {NAV_LINKS.map((item) => (
      <NavLink key={item.text} item={item} pathname={pathname} tone={tone} />
    ))}
  </div>
);

const NavLink = ({ item, pathname, tone }: { item: NavItem; pathname: string; tone: NavTone }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const FlyoutContent = item.component;
  const hasFlyout = Boolean(FlyoutContent);
  const showFlyout = Boolean(FlyoutContent && open);
  const isActive = item.href === "/"
    ? pathname === "/"
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const handleOpen = () => {
    if (hasFlyout) {
      setOpen(true);
    }
  };
  const handleClose = () => setOpen(false);
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!triggerRef.current?.contains(event.relatedTarget as Node | null)) {
      handleClose();
    }
  };
  const interactiveHandlers = hasFlyout
    ? {
        onMouseEnter: handleOpen,
        onMouseLeave: handleClose,
        onFocus: handleOpen,
        onBlur: handleBlur,
      }
    : {};

  if (!hasFlyout || !FlyoutContent) {
    return (
      <div ref={triggerRef} className="relative">
        <Link
          href={item.href}
          className={`relative text-sm font-semibold transition-colors ${
            isActive
              ? tone === "light"
                ? "text-white"
                : "text-ink"
              : tone === "light"
                ? "text-white/70 hover:text-white"
                : "text-ink/70 hover:text-ink"
          }`}
        >
          {item.text}
          <span
            className={`absolute -bottom-1 left-0 right-0 h-0.5 origin-left rounded-full transition-transform duration-300 ease-out ${
              tone === "light" ? "bg-white" : "bg-ink"
            }`}
            style={{ transform: isActive ? "scaleX(1)" : "scaleX(0)" }}
          />
        </Link>
      </div>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        ref={triggerRef}
        className="relative"
        {...interactiveHandlers}
      >
        {/*
          Switch link treatment so transparent variant remains legible on light admin backgrounds.
          Tone drives text/underline colors while preserving hover + active affordances.
        */}
        <Popover.Trigger asChild>
          <Link
            href={item.href}
            className={`relative text-sm font-semibold transition-colors ${
              isActive
                ? tone === "light"
                  ? "text-white"
                  : "text-ink"
                : tone === "light"
                  ? "text-white/70 hover:text-white"
                  : "text-ink/70 hover:text-ink"
            }`}
            aria-haspopup="menu"
            aria-expanded={showFlyout}
          >
            {item.text}
            <span
              className={`absolute -bottom-1 left-0 right-0 h-0.5 origin-left rounded-full transition-transform duration-300 ease-out ${
                tone === "light" ? "bg-white" : "bg-ink"
              }`}
              style={{ transform: showFlyout || isActive ? "scaleX(1)" : "scaleX(0)" }}
            />
          </Link>
        </Popover.Trigger>
        <AnimatePresence>
          {showFlyout && (
            <Popover.Content asChild side="bottom" align="center" sideOffset={12}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="z-20 text-ink"
              >
                <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
                <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-card/95 shadow-sm ring-1 ring-border/70" />
                <div className="relative rounded-3xl bg-card/95 text-ink shadow-elevated ring-1 ring-border/70 backdrop-blur-xl">
                  <FlyoutContent
                    onNavigate={() => setOpen(false)}
                    textTone="dark"
                  />
                </div>
              </motion.div>
            </Popover.Content>
          )}
        </AnimatePresence>
      </div>
    </Popover.Root>
  );
};

const CTAs = ({ tone }: { tone: NavTone }) => (
  <div className="flex items-center gap-3">
    <Link
      href="/concierge"
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
        tone === "light"
          ? "border border-white/50 text-white hover:bg-white hover:text-perazzi-black"
          : "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-white"
      }`}
    >
      <UserRound className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      <span>Build Planner</span>
    </Link>
    <a
      href="https://store.perazzi.com"
      target="_blank"
      rel="noreferrer"
      className={`rounded-xl border px-4 py-2 text-sm font-semibold text-white transition-colors ${
        tone === "light"
          ? "border-perazzi-red bg-perazzi-red hover:border-white"
          : "border-perazzi-red bg-perazzi-red hover:brightness-95"
      }`}
    >
      Store
    </a>
  </div>
);

const ShotgunsFlyout: FlyoutRenderer = ({ onNavigate, textTone = "light" }) => (
  <div
    className={`grid w-full grid-cols-12 overflow-hidden rounded-3xl lg:w-[650px] ${
      textTone === "dark" ? "text-perazzi-black" : "text-white"
    }`}
  >
    <div className="col-span-12 flex flex-col justify-between bg-perazzi-black p-6 text-white lg:col-span-4">
      <div>
        <Heading level={2} size="lg" className="mb-2 text-white">
          Shotguns
        </Heading>
        <Text className="text-white" leading="normal">
          Explore dedicated Perazzi platforms—from high-trap geometry to MX race-ready builds.
        </Text>
      </div>
      <Link
        href="/shotguns"
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white/90"
        onClick={onNavigate}
      >
        All shotguns <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
    <div className="col-span-12 grid grid-cols-2 gap-3 bg-card p-6 text-ink lg:col-span-8">
      {SHOTGUN_GRID.map((entry) => (
        <Link
          key={entry.title}
          href={entry.href}
          className="rounded-2xl border border-border/70 bg-card/40 p-4 text-left shadow-sm transition-colors hover:border-ink/30 hover:bg-card/70"
          onClick={onNavigate}
        >
          <Heading level={3} size="sm" className="text-perazzi-red">
            {entry.title}
          </Heading>
          <Text size="sm" className="mt-1 text-ink" leading="normal">
            {entry.description}
          </Text>
        </Link>
      ))}
    </div>
  </div>
);

const ExperienceFlyout: FlyoutRenderer = ({ onNavigate, textTone = "light" }) => (
  <div
    className={`w-full rounded-3xl p-6 shadow-none lg:w-[520px] lg:shadow-xl ${
      textTone === "dark" ? "bg-perazzi-black text-white" : "bg-card text-ink"
    }`}
  >
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <Text size="sm" className="font-semibold uppercase tracking-[0.3em] text-ink-muted" leading="normal">
          TRAVEL
        </Text>
        <div className="mt-3 space-y-2">
          <Link
            href="/experience#visit"
            className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold hover:border-perazzi-red/60"
            onClick={onNavigate}
          >
            Plan a visit <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link
            href="/experience#fitting"
            className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold hover:border-perazzi-red/60"
            onClick={onNavigate}
          >
            Book a fitting <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div>
        <Text size="sm" className="font-semibold uppercase tracking-[0.3em] text-ink-muted" leading="normal">
          INQUIRE
        </Text>
        <div className="mt-3 space-y-2">
          <Link
            href="/experience#dealers"
            className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold hover:border-perazzi-red/60"
            onClick={onNavigate}
          >
            Find a dealer <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link
            href="/journal"
            className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold hover:border-perazzi-red/60"
            onClick={onNavigate}
          >
            Visit the journal <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
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
    className={`grid w-full grid-cols-12 overflow-hidden rounded-3xl lg:w-[680px] ${
      textTone === "dark" ? "text-white" : "text-perazzi-black"
    }`}
  >
    <div className="col-span-12 flex flex-col justify-between bg-card p-6 text-ink lg:col-span-4">
      <div>
        <Heading level={2} size="lg" className="text-ink">
          Heritage
        </Heading>
        <Text className="mt-2 text-ink-muted" leading="normal">
          Trace Perazzi craft across eras—factory milestones, champions, and oral histories.
        </Text>
      </div>
      <Link
        href="/heritage"
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-perazzi-red"
        onClick={onNavigate}
      >
        Explore heritage <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
    <div className="col-span-12 grid gap-3 bg-elevated p-6 text-ink lg:col-span-8 lg:grid-cols-3">
      {HERITAGE_LINKS.map((section) => (
        <div key={section.title} className="space-y-2">
          <Text size="sm" className="font-semibold uppercase tracking-[0.25em] text-perazzi-red" leading="normal">
            {section.title}
          </Text>
          {section.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:border-perazzi-red/50 hover:bg-card/70"
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
  tone,
}: {
  pathname: string;
  brandLabel: string;
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
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-70 flex w-full max-w-sm flex-col outline-none translate-x-full transition-transform duration-200 data-[state=open]:translate-x-0">
            <div className="flex h-full flex-col border-l border-border bg-card/95 text-ink shadow-elevated outline-none backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <Logo label={brandLabel} />
                <Dialog.Close asChild>
                  <button
                    aria-label="Close navigation menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-ring"
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
              <div className="border-t border-border px-6 py-4">
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
          className={`text-base font-semibold tracking-tight transition-colors ${
            isActive ? "text-perazzi-red" : "text-ink hover:text-perazzi-red"
          }`}
          onClick={() => setMenuOpen(false)}
        >
          {item.text}
        </Link>
        {hasFold ? (
          <button
            onClick={() => setOpen((prev) => !prev)}
            aria-label={`Toggle ${item.text} links`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-ring"
          >
            <motion.div animate={{ rotate: open ? 180 : 0 }}>
              <ChevronDown className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </motion.div>
          </button>
        ) : (
          <ArrowRight className="h-5 w-5 text-ink" strokeWidth={2} aria-hidden="true" />
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
          <div
            ref={ref}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm"
          >
            <FlyoutContent onNavigate={() => setMenuOpen(false)} textTone="light" />
          </div>
        </motion.div>
      )}
    </div>
  );
};
