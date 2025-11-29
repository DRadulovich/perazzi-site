import type { Metadata } from "next";
import { groq } from "next-sanity";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import medalsHero from "@/../Photos/olympic-medals-1.jpg";
import conciergeBackdrop from "@/../Photos/p-web-4.jpg";
import blurDark from "@/../Photos/BLUR_DARK.jpg";
import blurLight from "@/../Photos/BLUR_LIGHT.jpg";
import { CatalogGrid, CatalogTile, type CatalogModelCard } from "@/components/uiTestGallery/CatalogGrid";
import { CinematicSection, GlassButton, GlassCard, MatteChip } from "@/components/uiTestGallery/CinematicSection";
import BuildConfiguratorDemo from "@/components/uiTestGallery/BuildConfiguratorDemo";
import ConciergeChatDemo from "@/components/uiTestGallery/ConciergeChatDemo";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { client } from "@/sanity/lib/client";
import { getSanityImageUrl } from "@/lib/sanityImage";

type ModelQueryResult = {
  _id: string;
  name?: string;
  baseModel?: string;
  category?: string;
  use?: string;
  platform?: string;
  platformSlug?: string | null;
  gauges?: string[];
  grade?: { name?: string };
  image?: SanityImageSource | null;
  imageFallbackUrl?: string | null;
};

const modelsQuery = groq`*[_type == "allModels"] | order(name asc) {
  _id,
  name,
  baseModel,
  category,
  "use": category,
  "platform": platform->name,
  "platformSlug": platform->slug.current,
  gauges,
  grade->{
    name
  },
  image,
  imageFallbackUrl
}`;

const fallbackModels: CatalogModelCard[] = [
  {
    id: "mx2000",
    name: "MX2000/8",
    platform: "MX",
    use: "Trap focus",
    grade: "SCO",
    gauges: ["12"],
    imageUrl: medalsHero.src,
  },
  {
    id: "hts",
    name: "High Tech S",
    platform: "High Tech",
    use: "Sporting / bunker",
    grade: "SC3",
    gauges: ["12"],
    imageUrl: conciergeBackdrop.src,
  },
  {
    id: "tm9x",
    name: "TM9X",
    platform: "TM",
    use: "American Trap",
    grade: "SC2",
    gauges: ["12"],
    imageUrl: medalsHero.src,
  },
];

async function loadCatalogModels(): Promise<CatalogModelCard[]> {
  try {
    const rawModels = await client.fetch<ModelQueryResult[]>(modelsQuery);
    return rawModels
      .map((model) => ({
        id: model._id,
        name: model.name || model.baseModel || "Perazzi model",
        platform: model.platform ?? undefined,
        use: model.use ?? model.category ?? undefined,
        grade: model.grade?.name ?? undefined,
        gauges: model.gauges ?? [],
        imageUrl: getSanityImageUrl(model.image, { width: 1000 }) ?? model.imageFallbackUrl ?? null,
      }))
      .slice(0, 9);
  } catch (error) {
    console.error("[ui-test-gallery] Failed to load catalog models", error);
    return fallbackModels;
  }
}

export const metadata: Metadata = {
  title: "UI Test Gallery | Perazzi",
  description: "Cinematic glassmorphism study of the shotguns landing, catalog, and concierge experiences.",
};

export default async function UITestGalleryPage() {
  const [{ landing }, models] = await Promise.all([getShotgunsSectionData(), loadCatalogModels()]);

  const disciplineLabels = landing.disciplines.map((discipline) => discipline.name);
  const platformSpotlights = landing.platforms.slice(0, 3);
  const shotgunsBackground = landing.hero.background.url;
  const catalogBackground = medalsHero.src;
  const conciergeBackground = conciergeBackdrop.src;
  const heritageBackground = blurDark.src;
  const configuratorBackground = blurLight.src;
  const featuredModels = models.slice(0, 3);
  const restModels = models.slice(3, 6);
  const noModels = models.length === 0;

  return (
    <div className="text-white">
      <CinematicSection id="intro" background={shotgunsBackground} overlayClassName="from-black/78 via-black/62 to-black/78">
        <div className="flex flex-col gap-6">
          <MatteChip>Internal design exploration</MatteChip>
          <div className="space-y-4">
            <div className="space-y-2 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-white/70">UI Test Gallery</p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Glassmorphism pass on key Perazzi routes</h1>
              <p className="max-w-3xl text-base text-white/75">
                A cinematic, glass-first treatment of Shotguns, All Shotguns, and Concierge—staged together in a single scroll so we can
                judge pacing, motion, and readability without touching the production routes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <GlassButton href="#shotguns-overview" label="Section A — Shotguns" />
              <GlassButton href="#shotguns-all" label="Section B — All Shotguns" variant="ghost" />
              <GlassButton href="#concierge" label="Section C — Concierge" variant="ghost" />
            </div>
          </div>
          <p className="mt-8 max-w-xl text-sm text-white/80 drop-shadow-[0_10px_28px_rgba(0,0,0,0.7)]">
            Scene 0 — staging glass against the atelier bench before we move into the series.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection id="shotguns-overview" background={shotgunsBackground}>
        <div className="flex flex-col gap-8">
          <MatteChip className="w-fit border-[#DB1002]/70 bg-[#DB1002]/15 text-red-100">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#DB1002]" />
            Section A — Shotguns Overview
          </MatteChip>
          <div className="space-y-6 max-w-4xl">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-white/70">Platforms shaped for podium calm</p>
              <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">{landing.hero.title}</h2>
              <p className="text-base text-white/75 sm:text-lg">{landing.hero.subheading}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <GlassButton href="/shotguns/all" label="View all shotguns" />
              <GlassButton href="/shotguns" label="Explore platforms" variant="ghost" />
            </div>
            <div className="flex flex-wrap gap-2">
              {disciplineLabels.map((name) => (
                <MatteChip key={name} className="bg-white/5 px-4 py-1 text-[10px]">
                  {name}
                </MatteChip>
              ))}
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {platformSpotlights.slice(0, 2).map((platform, index) => (
              <GlassCard key={platform.id} delay={0.1 * index} className="h-full">
                <div className="space-y-5">
                  <div className="relative overflow-hidden rounded-xl border border-white/15">
                    <div
                      className="h-56 bg-cover bg-center md:h-64"
                      style={{ backgroundImage: `url(${platform.hero.url})` }}
                      aria-hidden
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/55 to-black/80" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MatteChip className="bg-black/70 px-3 py-1 text-[10px]">{platform.name} Platform</MatteChip>
                      {platform.hallmark ? (
                        <span className="text-xs uppercase tracking-[0.24em] text-white/50">Signature</span>
                      ) : null}
                    </div>
                    <p className="text-lg font-semibold">{platform.tagline}</p>
                    {platform.hallmark ? <p className="text-sm text-white/70">{platform.hallmark}</p> : null}
                    {platform.typicalDisciplines?.length ? (
                      <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                        {platform.typicalDisciplines.join(" · ")}
                      </p>
                    ) : null}
                    <div className="pt-1">
                      <GlassButton href={`/shotguns/${platform.slug}`} label={`View ${platform.name}`} variant="ghost" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
            {platformSpotlights[2] ? (
              <GlassCard key={platformSpotlights[2].id} delay={0.25} className="h-full md:col-span-2">
                <div className="space-y-5 md:flex md:items-center md:gap-6">
                  <div className="relative overflow-hidden rounded-xl border border-white/15 md:w-1/2">
                    <div
                      className="h-56 bg-cover bg-center md:h-64"
                      style={{ backgroundImage: `url(${platformSpotlights[2].hero.url})` }}
                      aria-hidden
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/55 to-black/80" />
                  </div>
                  <div className="space-y-3 md:flex-1">
                    <div className="flex items-center gap-2">
                      <MatteChip className="bg-black/70 px-3 py-1 text-[10px]">{platformSpotlights[2].name} Platform</MatteChip>
                      {platformSpotlights[2].hallmark ? (
                        <span className="text-xs uppercase tracking-[0.24em] text-white/50">Signature</span>
                      ) : null}
                    </div>
                    <p className="text-lg font-semibold">{platformSpotlights[2].tagline}</p>
                    {platformSpotlights[2].hallmark ? (
                      <p className="text-sm text-white/70">{platformSpotlights[2].hallmark}</p>
                    ) : null}
                    {platformSpotlights[2].typicalDisciplines?.length ? (
                      <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                        {platformSpotlights[2].typicalDisciplines.join(" · ")}
                      </p>
                    ) : null}
                    <div className="pt-1">
                      <GlassButton
                        href={`/shotguns/${platformSpotlights[2].slug}`}
                        label={`View ${platformSpotlights[2].name}`}
                        variant="ghost"
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            ) : null}
          </div>

          <p className="mt-8 max-w-2xl text-sm text-white/80 drop-shadow-[0_10px_28px_rgba(0,0,0,0.7)]">
            Ambient note — balance, triggers, and rib geometry framed as if under soft workshop light.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection
        id="shotguns-all"
        background={catalogBackground}
        overlayClassName="from-black/80 via-black/68 to-black/84"
        className="pt-16 lg:py-28"
      >
        <div className="flex flex-col gap-8">
          <MatteChip className="w-fit border-[#DB1002]/70 bg-[#DB1002]/15 text-red-100">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#DB1002]" />
            Section B — All Shotguns / Catalog
          </MatteChip>
          <div className="mx-auto w-full max-w-5xl">
            <GlassCard className="min-h-[420px]">
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.32em] text-white/70">Model Search</p>
                  <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">The Perazzi Shotguns Database</h2>
                  <p className="text-base text-white/75 sm:text-lg">
                    Browse every catalogued platform, grade, and gauge combination we keep inside Sanity—rebuilt here as a glass catalogue
                    strip. Filters and search stay available on the live route; this surface is purely to judge the cinematic framing.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Trap", "Skeet", "Sporting", "Game"].map((label) => (
                    <MatteChip key={label} className="bg-white/5 px-4 py-1 text-[10px]">
                      {label}
                    </MatteChip>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {noModels ? (
            <GlassCard className="max-w-3xl">
              <p className="text-sm text-white/70">
                Models failed to load from Sanity; using the live table remains available on /shotguns/all.
              </p>
            </GlassCard>
          ) : (
            <>
              <MatteChip className="w-fit border-[#DB1002]/70 bg-[#DB1002]/15 text-red-100">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#DB1002]" />
                Featured from the catalogue
              </MatteChip>

              <div className="grid gap-6 md:grid-cols-12">
                {featuredModels.map((model, index) => (
                  <CatalogTile key={model.id} model={model} index={index} className="md:col-span-6 xl:col-span-4" />
                ))}
              </div>

              {restModels.length ? <CatalogGrid models={restModels} /> : null}
            </>
          )}

          <p className="mt-4 text-sm text-white/70">
            Full database lives on the production route /shotguns/all; this scene is a smaller glass preview.
          </p>
          <div className="flex justify-end">
            <GlassButton href="/shotguns/all" label="Open full database" />
          </div>

          <p className="mt-8 max-w-2xl text-sm text-white/80 drop-shadow-[0_10px_30px_rgba(0,0,0,0.75)]">
            Ambient note — catalog tiles breathing on glass, a quiet gallery of steel and walnut.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection
        id="transition-to-concierge"
        background={blurLight.src}
        overlayClassName="from-black/90 via-black/80 to-black/90"
        className="py-24 sm:py-28 lg:py-32"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.32em] text-white/60">Transition</p>
          <p className="max-w-xl text-sm text-white/75">
            The noise of the range falls away; decisions move into quieter rooms before the concierge picks up the story.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection
        id="concierge"
        background={conciergeBackground}
        overlayClassName="from-black/86 via-black/76 to-black/88"
        className="pt-16 lg:py-28"
      >
        <div className="flex flex-col gap-8">
          <MatteChip className="w-fit border-[#DB1002]/70 bg-[#DB1002]/15 text-red-100">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#DB1002]" />
            Section C — Concierge Experience
          </MatteChip>
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1.2fr] lg:items-start">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-white/70">Designing a Perazzi, Together</p>
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Concierge as a quiet atelier</h2>
              <p className="text-base text-white/75 sm:text-lg">
                The build planner and concierge live together here as a single glass surface—meant to feel like a calm, private room. The
                real flow still lives on /concierge; this is a mood study for copy, pacing, and how the assistant could sit on a cinematic
                background.
              </p>
              <p className="text-sm text-white/70">
                Ask the workshop anything, move through the navigator slowly, and return when ready. Conversation context travels between
                steps so the assistant feels like a fitter, not a chatbot.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <GlassButton href="/concierge" label="Begin a concierge request" />
                <GlassButton href="/experience/visit" label="Request a visit" variant="ghost" />
              </div>
            </div>

            <div className="min-h-[260px] rounded-2xl border border-white/15 bg-black/55 p-5 backdrop-blur-xl sm:p-6">
              <p className="text-xs uppercase tracking-[0.32em] text-white/70">Concierge steps</p>
              <ul className="mt-4 space-y-3 text-sm text-white/75 sm:text-base">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-white">Set your mode</p>
                    <p className="text-white/70">Choose whether you are new to Perazzi, an existing owner, or looking for navigation help.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-white">Walk the build</p>
                    <p className="text-white/70">Navigator moves through platform, fit, balance, and finish—surfaced as glass cards instead of tables.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-white">Capture the brief</p>
                    <p className="text-white/70">Conversation + selections summarize into a dealer-ready brief without leaving the atmosphere.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-8 max-w-2xl text-sm text-white/80 drop-shadow-[0_10px_30px_rgba(0,0,0,0.75)]">
            Ambient note — concierge whispered like a fitter in the atelier, pacing you through each decision.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection
        id="heritage-timeline"
        background={heritageBackground}
        overlayClassName="from-black/80 via-black/68 to-black/86"
        className="pt-20 lg:py-40"
      >
        <div className="flex flex-col gap-8">
          <MatteChip className="w-fit border-[#DB1002]/70 bg-[#DB1002]/15 text-red-100">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#DB1002]" />
            Section D — Craft / Heritage Timeline
          </MatteChip>
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/70">Timeline study</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Perazzi heritage on glass rails</h2>
            <p className="text-sm text-white/75 sm:text-base">
              Direct lift of the live craftsmanship timeline so we can judge pacing, scroll feel, and glass framing without touching the
              production heritage route.
            </p>
          </div>
          <p className="mt-8 max-w-2xl text-sm text-white/80 drop-shadow-[0_10px_28px_rgba(0,0,0,0.7)]">
            Ambient note — atelier history projected through glass, letting the milestones glow against the dark.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection
        id="build-configurator"
        background={configuratorBackground}
        overlayClassName="from-black/82 via-black/70 to-black/86"
        className="pt-20 lg:py-40"
      >
        <div className="flex flex-col gap-8">
          <MatteChip className="w-fit border-[#DB1002]/70 bg-[#DB1002]/15 text-red-100">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#DB1002]" />
            Section E — Build Configurator
          </MatteChip>
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/70">Configurator study</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Navigator staged in the glass lab</h2>
            <p className="text-sm text-white/75 sm:text-base">
              The live build navigator experience embedded here so we can explore spacing, overlays, and cinematic context without altering
              the production journey.
            </p>
          </div>
          <div className="mt-8 md:mt-10 lg:mt-12 lg:max-w-6xl lg:ml-auto lg:mr-4">
            <BuildConfiguratorDemo />
          </div>
          <p className="mt-8 max-w-2xl text-sm text-white/80 drop-shadow-[0_10px_28px_rgba(0,0,0,0.7)]">
            Ambient note — configurator controls floating like instrument dials lit by Perazzi red from below.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection
        id="concierge-chat"
        background={conciergeBackground}
        overlayClassName="from-black/90 via-black/80 to-black/92"
        className="pt-20 lg:py-40"
      >
        <div className="flex flex-col gap-8">
          <MatteChip className="w-fit border-[#DB1002]/70 bg-[#DB1002]/15 text-red-100">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#DB1002]" />
            Section F — Concierge Assistant Chat
          </MatteChip>
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/70">Workshop assistant</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Concierge chat in the glass atelier</h2>
            <p className="text-sm text-white/75 sm:text-base">
              Same assistant experience as the live concierge page, staged in this cinematic shell so we can observe how chat behaves
              against darker glass and Perazzi red highlights.
            </p>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/12 bg-white/5/80 p-4 shadow-[0_40px_160px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-6">
            <ConciergeChatDemo />
          </div>
          <p className="mt-8 max-w-2xl text-sm text-white/80 drop-shadow-[0_10px_28px_rgba(0,0,0,0.7)]">
            Ambient note — the workshop whisper framed in glass, with red glow hinting at the atelier’s furnace.
          </p>
        </div>
      </CinematicSection>
    </div>
  );
}
