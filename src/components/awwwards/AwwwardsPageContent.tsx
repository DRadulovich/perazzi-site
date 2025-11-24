"use client";

import {
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
} & HTMLAttributes<HTMLDivElement>;

const glassBase =
  "relative overflow-hidden rounded-3xl border border-white/12 bg-white/6 backdrop-blur-xl shadow-[0_28px_90px_rgba(0,0,0,0.85)]";
const glassTone = {
  light: "bg-white/8 border-white/12",
  dark: "bg-[#0c0f16]/70 border-white/10",
};
const matteBase =
  "relative overflow-hidden rounded-3xl border border-white/8 bg-[#0b0d10]/90 shadow-[0_22px_70px_rgba(0,0,0,0.75)]";

const fadeIn = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10%" },
  transition: { duration: 0.9, ease: "easeOut" },
};

const craftTiles = [
  {
    title: "Balance & Regulation",
    copy: "Barrels tempered to whisper-light balance; regulation perfected by hand and eye.",
    image: "/demo/p-web-7.jpg",
    badge: "Barrel atelier",
    offset: "",
  },
  {
    title: "Engraving the Soul",
    copy: "Steel canvases iced with arabesques and trophies—each line cut in Botticino light.",
    image: "/demo/p-web-15.jpg",
    badge: "Master engraver",
    offset: "lg:-mt-12",
  },
  {
    title: "Wood, Glassed In",
    copy: "Turkish walnut floats under glass: dense figure, smoke-dark grain, hand-oiled sheen.",
    image: "/demo/p-web-19.jpg",
    badge: "Stock studio",
    offset: "lg:-mt-6",
  },
];

const annotations = [
  {
    title: "Regulated barrels",
    detail: "Tuned for even convergence; matte glass frame keeps focus on the metalwork.",
    top: "14%",
    left: "12%",
  },
  {
    title: "Engraved spine",
    detail: "A ribbon of steel under light; subtle radial glow behind glass chip.",
    top: "48%",
    left: "64%",
  },
  {
    title: "Trigger geometry",
    detail: "Set to the shooter’s rhythm—machined lines mirrored by the glass bevel.",
    top: "72%",
    left: "36%",
  },
];

const legacyTiles = [
  {
    title: "Leggera",
    copy: "Competition frames built like jewelry—lighter on the mount, relentless in recoil control.",
    image: "/demo/p-web-21.jpg",
    tone: "dark",
  },
  {
    title: "Champions’ wall",
    copy: "Plaques for Olympic runs and world cups—each name etched into brushed glass.",
    image: "/demo/p-web-8.jpg",
    tone: "light",
  },
  {
    title: "Botticino evenings",
    copy: "Vignettes of artisans finishing guns at dusk, bronze light through the atelier windows.",
    image: "/demo/p-web-17.jpg",
    tone: "dark",
  },
];

const interpretations = [
  {
    name: "Obsidian Corridor",
    description: "Ultra-dark gallery with red glows and glass rails—panes behave like a corridor of vitrines.",
    image: "/demo/p-web-22.jpg",
    chips: ["Border-white/20 rails", "Backlight gradient", "Long shadow depth"],
    gradient: "from-black/70 via-[#18070b]/70 to-[#0b0b0f]",
  },
  {
    name: "Gilded Mist",
    description: "Warm brass haze with higher blur—glass catches amber light while imagery warms through frost.",
    image: "/demo/p-web-20.jpg",
    chips: ["Backdrop-blur-2xl", "Brass radial glow", "Pill labels"],
    gradient: "from-[#160d07]/75 via-[#2b1a0f]/70 to-black/80",
  },
  {
    name: "Minimal Cabinet",
    description: "Slate neutrals with crisp strokes—glass feels like a silent museum drawer with quiet sans type.",
    image: "/demo/p-web-18.jpg",
    chips: ["Border-white/25", "Subtle inner highlight", "Airy margins"],
    gradient: "from-black/70 via-[#0f1215]/70 to-[#050608]",
  },
];

export function AwwwardsPageContent() {
  return (
    <div className="relative isolate -mx-4 overflow-hidden rounded-[32px] border border-white/5 bg-[#050608] text-white shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:-mx-8 lg:-mx-12">
      <BackgroundAura />
      <div className="relative z-10 flex flex-col gap-24 px-4 py-14 sm:px-10 lg:px-14">
        <HeroSection />
        <CraftSection />
        <SculptureSection />
        <LegacySection />
        <InterpretationsGallery />
        <ClosingSection />
      </div>
    </div>
  );
}

function HeroSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const glassY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden rounded-3xl border border-white/12"
    >
      {/* Slow parallax on the hero backdrop keeps the glass foreground distinct. */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0"
        aria-hidden
      >
        <Image
          src="/demo/p-web-11.jpg"
          alt="Perazzi engraving table under soft light."
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#0a0a10]/70 to-[#050508]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(219,16,34,0.32),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(255,190,120,0.16),transparent_40%)]" />
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(219,16,34,0.22),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(255,190,120,0.14),transparent_40%),radial-gradient(circle_at_52%_82%,rgba(90,110,150,0.14),transparent_45%)] opacity-70"
        aria-hidden
      />

      <div className="relative z-10 grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
        <motion.div style={{ y: glassY }} {...fadeIn} className="space-y-6">
          <GlassPanel className="p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              Atelier concept
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Perazzi, seen through glass and shadow.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/75 sm:text-lg">
              A cinematic scroll through Botticino—steel cooled under light, walnut alive beneath
              glass, and a quiet invitation into the atelier.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <GlassButton variant="primary">Book a fitting</GlassButton>
              <GlassButton variant="secondary">Watch the atelier</GlassButton>
            </div>
          </GlassPanel>

          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div {...fadeIn}>
              <GlassPanel className="relative h-full overflow-hidden p-0">
                <Image
                  src="/demo/p-web-24.jpg"
                  alt="Receiver and triggers under a loupe."
                  fill
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm font-semibold">The quiet before the engraving.</p>
                  <p className="text-xs text-white/70">Fragments of steel waiting for light.</p>
                </div>
              </GlassPanel>
            </motion.div>
            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.12 }}>
              <MattePanel className="flex h-full flex-col justify-between p-6">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 shadow-inner shadow-white/5">
                    <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_55%)]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                      Crafted arrival
                    </p>
                    <p className="text-sm text-white">Glass hero · tactile entrance</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/75">
                  Panels lift softly on scroll, mirroring a shotgun drawn from velvet-lined cases.
                  Motion stays light to keep the weightlessness of glass believable.
                </p>
              </MattePanel>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          style={{ y: glassY }}
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="relative flex flex-col gap-4"
        >
          <GlassPanel className="relative min-h-[320px] flex-1 overflow-hidden p-0">
            <Image
              src="/demo/p-web-5.jpg"
              alt="Close detail of a Perazzi receiver."
              fill
              sizes="(min-width: 1024px) 32vw, (min-width: 640px) 60vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/70" />
            <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] backdrop-blur">
              Botticino
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-sm font-semibold">When steel meets breath.</p>
              <p className="text-xs text-white/70">A hero still, held in a glass vitrine.</p>
            </div>
          </GlassPanel>
          <div className="grid grid-cols-2 gap-4">
            <MattePanel className="p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Act I</p>
              <p className="text-lg font-semibold">Arrival at the atelier</p>
              <p className="mt-2 text-sm text-white/70">Vignetted backdrop, parallaxed glass, and a quiet CTA pair.</p>
            </MattePanel>
          <MattePanel className="p-4 text-sm text-white/80">
              <p className="font-semibold">Depth recipe</p>
              <p className="mt-1 text-xs text-white/70">
                Backdrop blur xl · border-white/12 · shadow-[0_24px_90px_rgba(0,0,0,0.75)]
              </p>
            </MattePanel>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CraftSection() {
  return (
    <section className="relative space-y-8">
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_12%_12%,rgba(219,16,34,0.14),transparent_38%),radial-gradient(circle_at_82%_18%,rgba(255,190,120,0.12),transparent_38%),radial-gradient(circle_at_40%_88%,rgba(96,110,140,0.16),transparent_44%)] opacity-80"
        aria-hidden
      />
      <div className="relative space-y-8">
        <SectionHeading
          eyebrow="Act II — The craft, under glass"
          title="Where metal, smoke, and walnut live behind glass."
          copy="An editorial gallery that floats each discipline above a deep atelier backdrop—small overlaps keep the panes feeling stacked and tactile."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {craftTiles.map((tile, index) => (
            <motion.div
              key={tile.title}
              className={cn("h-full", tile.offset)}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.05 * index }}
            >
              <GlassPanel className="group relative h-full overflow-hidden p-0">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={tile.image}
                    alt={tile.title}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/80" />
                  <div className="absolute right-4 top-4 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] backdrop-blur">
                    {tile.badge}
                  </div>
                </div>
                <div className="relative space-y-3 p-5 sm:p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/60">
                    {tile.title}
                  </p>
                  <p className="text-base text-white/75">{tile.copy}</p>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SculptureSection() {
  return (
    <section className="relative space-y-8">
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_18%_18%,rgba(219,16,34,0.16),transparent_36%),radial-gradient(circle_at_72%_14%,rgba(255,190,120,0.12),transparent_40%),radial-gradient(circle_at_52%_80%,rgba(120,130,150,0.14),transparent_42%)] opacity-80"
        aria-hidden
      />
      <div className="relative space-y-8">
        <SectionHeading
          eyebrow="Act III — The shotgun as sculpture"
          title="Suspended like a museum piece, lit for detail."
          copy="A single frame holds the platform; annotation chips hover around the glass case with whisper-light shadows."
        />
        <motion.div {...fadeIn}>
          <GlassPanel className="relative overflow-hidden p-0">
            <div className="relative aspect-[16/9]">
              <Image
                src="/demo/p-web-14.jpg"
                alt="Perazzi shotgun cradled in a dark set."
                fill
                sizes="(min-width: 1024px) 70vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-transparent to-black/70" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,rgba(255,205,160,0.12),transparent_45%)]" />
              {annotations.map((annotation) => (
                <GlassPanel
                  key={annotation.title}
                  className="absolute max-w-[14rem] border-white/20 px-4 py-3 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
                  style={{ top: annotation.top, left: annotation.left }}
                  tone="light"
                >
                  <p className="font-semibold leading-tight">{annotation.title}</p>
                  <p className="text-xs text-white/70">{annotation.detail}</p>
                </GlassPanel>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0d0f14]/85 px-5 py-4 text-sm text-white/70 backdrop-blur-sm">
              <span>Annotations float just off the glass to cast softer halos.</span>
              <span className="rounded-full border border-white/20 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                Museum case
              </span>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}

function LegacySection() {
  return (
    <section className="relative space-y-8">
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_12%_10%,rgba(219,16,34,0.14),transparent_38%),radial-gradient(circle_at_84%_12%,rgba(255,190,120,0.12),transparent_42%),radial-gradient(circle_at_52%_88%,rgba(120,140,150,0.14),transparent_46%)] opacity-80"
        aria-hidden
      />
      <div className="relative space-y-8">
        <SectionHeading
          eyebrow="Act IV — Legacy & champions"
          title="Plaques of time, framed in frost."
          copy="Quotes, medals, and portraits sit under frosted glass strips—warm tones from Botticino bleed through the panels."
        />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div {...fadeIn} className="space-y-4">
            <GlassPanel className="relative overflow-hidden p-0">
              <div className="relative aspect-[5/3]">
                <Image
                  src="/demo/p-web-10.jpg"
                  alt="Shooter in motion with Perazzi shotgun."
                  fill
                  sizes="(min-width: 1024px) 60vw, (min-width: 640px) 80vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
              </div>
              <div className="space-y-3 px-6 pb-6 pt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/65">Legacy film</p>
                <p className="text-xl font-semibold">Champions move through glass corridors.</p>
                <p className="text-sm text-white/70">
                  The row of plaques mirrors the rhythm of a trap line—each tile separated by frosted seams.
                </p>
              </div>
            </GlassPanel>
            <div className="grid gap-4 sm:grid-cols-2">
              {legacyTiles.map((tile, index) => (
                <motion.div
                  key={tile.title}
                  {...fadeIn}
                  transition={{ ...fadeIn.transition, delay: 0.06 * index }}
                >
                  <GlassPanel
                    tone={tile.tone === "light" ? "light" : "dark"}
                    className="relative overflow-hidden p-0"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={tile.image}
                        alt={tile.title}
                        fill
                        sizes="(min-width: 1024px) 35vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80" />
                    </div>
                    <div className="space-y-2 px-5 pb-5 pt-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                        {tile.title}
                      </p>
                      <p className="text-sm text-white/75">{tile.copy}</p>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.12 }}
            className="flex h-full flex-col gap-4"
          >
            <MattePanel className="flex flex-1 flex-col justify-between p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/70">Voice of the house</p>
              <p className="text-2xl font-semibold leading-tight">
                “Every engraving line, every walnut pore, is read through glass to test how the light will love it.”
              </p>
              <p className="text-sm text-white/65">— Botticino master engraver</p>
            </MattePanel>
            <MattePanel className="relative overflow-hidden p-0">
              <div className="flex flex-col gap-4 px-6 py-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Timeline glow</p>
                <p className="text-sm text-white/75">
                  A thin ribbon of light runs behind each plaque—soft white stroke over a deep charcoal gradient.
                </p>
                <GlassButton variant="secondary">Explore heritage</GlassButton>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent blur-xl" />
            </MattePanel>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function InterpretationsGallery() {
  return (
    <section className="relative space-y-8">
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_18%_16%,rgba(219,16,34,0.14),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(255,190,120,0.12),transparent_38%),radial-gradient(circle_at_52%_84%,rgba(110,120,140,0.16),transparent_46%)] opacity-80"
        aria-hidden
      />
      <div className="relative space-y-8">
        <SectionHeading
          eyebrow="Glassmorphism gallery"
          title="Three more interpretations of the Perazzi glass language."
          copy="Each variation pushes a different balance of blur, light, and metal—collect them as a gallery of possible ateliers."
        />
        <div className="grid gap-6 xl:grid-cols-3">
          {interpretations.map((style, index) => (
            <motion.div
              key={style.name}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.06 * index }}
              className="relative"
            >
              <GlassPanel className="overflow-hidden p-0">
                <div className={cn("relative aspect-[4/5]", `bg-gradient-to-b ${style.gradient}`)}>
                  <Image
                    src={style.image}
                    alt={style.name}
                    fill
                    sizes="(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent" />
                </div>
                <div className="space-y-4 px-5 pb-5 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Style study</p>
                      <p className="text-lg font-semibold">{style.name}</p>
                    </div>
                    <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
                      Variant {index + 2}
                    </span>
                  </div>
                  <p className="text-sm text-white/75">{style.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {style.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-white/20 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75 backdrop-blur"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
        <MattePanel className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-white/65">Lighting</p>
            <p className="text-sm text-white/75">
              Radial glows shift per concept—scarlet for Obsidian, brass for Gilded, cool white for Minimal.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-white/65">Blur vs. clarity</p>
            <p className="text-sm text-white/75">
              Blur increases toward the center of each pane; edges stay crisp to mimic machined bevels.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-white/65">Motion accents</p>
            <p className="text-sm text-white/75">
              Cards lift subtly on hover; consider swapping entrance easing per variant when iterating live.
            </p>
          </div>
        </MattePanel>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(219,16,34,0.18),transparent_40%),radial-gradient(circle_at_72%_20%,rgba(255,190,120,0.16),transparent_40%),radial-gradient(circle_at_50%_82%,rgba(110,125,150,0.16),transparent_46%)] opacity-80"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_50%)]" aria-hidden />
      <motion.div {...fadeIn}>
        <GlassPanel className="relative overflow-hidden px-6 py-10 text-center sm:px-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_24%,rgba(0,0,0,0)_100%)]" />
          <div className="relative space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/65">
              Act V — Closing invitation
            </p>
            <h2 className="text-3xl font-semibold sm:text-4xl">The doorway glows open.</h2>
            <p className="mx-auto max-w-2xl text-base text-white/75">
              Stand before the glass, let the workshop lights breathe around you, and step into a fitting tailored to your hand.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <GlassButton variant="primary">Begin your build</GlassButton>
              <GlassButton variant="secondary">Meet Perazzi</GlassButton>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.26em] text-white/60">{eyebrow}</p>
      <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      <p className="max-w-3xl text-sm text-white/70 sm:text-base">{copy}</p>
    </div>
  );
}

function GlassButton({ variant = "primary", className, children, ...props }: GlassButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
  const primary =
    "bg-white/10 border border-white/18 backdrop-blur-xl shadow-[0_14px_50px_rgba(0,0,0,0.45)] hover:-translate-y-[2px] hover:shadow-[0_18px_60px_rgba(0,0,0,0.6)] active:translate-y-0 active:shadow-[0_10px_40px_rgba(0,0,0,0.5)]";
  const secondary =
    "bg-white/8 border border-white/15 backdrop-blur-lg text-white/85 hover:-translate-y-[2px] hover:border-white/30 hover:bg-white/12 active:translate-y-0";

  return (
    <motion.button
      {...props}
      className={cn(base, variant === "primary" ? primary : secondary, className)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {children}
      <span
        className="pointer-events-none absolute inset-px rounded-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),rgba(255,255,255,0.06)_26%,rgba(255,255,255,0)_80%)] opacity-70 transition duration-200"
        aria-hidden
      />
    </motion.button>
  );
}

function GlassPanel({ children, className, tone = "light", ...rest }: GlassPanelProps) {
  const toneClass =
    tone === "light"
      ? glassTone.light
      : glassTone.dark;

  return (
    <div
      className={cn(
        glassBase,
        toneClass,
        className,
      )}
      {...rest}
    >
      {/* Internal highlight to mimic beveled glass catching light. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.14),rgba(255,255,255,0.05)_32%,rgba(255,255,255,0)_72%)]"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function MattePanel({ children, className, ...rest }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(matteBase, className)}
      {...rest}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_30%,rgba(0,0,0,0)_90%)]"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function BackgroundAura() {
  return (
    <>
      <div className="absolute inset-0 bg-[#050608]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(219,16,34,0.22),transparent_40%),radial-gradient(circle_at_82%_18%,rgba(255,190,120,0.14),transparent_42%),radial-gradient(circle_at_55%_82%,rgba(110,130,150,0.16),transparent_46%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light bg-[linear-gradient(115deg,rgba(255,255,255,0.04)_12%,rgba(255,255,255,0)_20%),linear-gradient(45deg,rgba(255,255,255,0.03)_8%,rgba(255,255,255,0)_16%)]" />
      <div className="pointer-events-none absolute inset-10 rounded-[28px] border border-white/6" />
    </>
  );
}
