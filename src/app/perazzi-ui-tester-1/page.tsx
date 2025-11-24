import type { Metadata } from "next";
import {
  CinematicSection,
  GlassCard,
  MatteCard,
  MatteChip,
} from "@/components/tester1/CinematicSection";

export const metadata: Metadata = {
  title: "Perazzi UI Tester 01 · Cinematic Gallery",
  description:
    "A dark-mode, glass-layered Perazzi photo film: one hero and four acts across full-bleed frames.",
};

export default function PerazziUITesterOnePage() {
  return (
    <div
      data-theme="dark"
      className="relative isolate min-h-screen bg-black text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(0,0,0,0.16),transparent_34%),radial-gradient(circle_at_82%_14%,rgba(40,40,48,0.12),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.7),rgba(0,0,0,0.92))]" />

      <div className="relative flex flex-col">
        <CinematicSection
          id="prologue"
          label="Prologue — Opening shot"
          labelPlacement="outside"
          title="Midnight glass reel for Perazzi UI tester 01."
          body="Five widescreen scenes built as a photo-first film strip: full-bleed imagery, glass overlays, parallax on scroll, and soft gradients that keep the photographic world intact."
          backgroundImage="/demo/_DSC3966.jpg"
          backgroundAlt="Perazzi shotgun resting on a bench in low light."
          align="left"
          contentPosition="start"
          contentClassName="pt-20"
          childrenWrapperClassName="sm:max-w-xl sm:-ml-6"
          floatingOverlay={
            <div className="absolute inset-0">
              <p className="pointer-events-none absolute bottom-10 right-8 text-sm text-neutral-200/80 drop-shadow-[0_0_16px_rgba(0,0,0,0.9)] sm:right-16">
                Lens flare holds on the receiver—grain stays visible under the scrim.
              </p>
            </div>
          }
          priority
        >
          <MatteCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/70">
                Shotlist
              </p>
              <p className="mt-2 text-sm text-white/80">
                Hero + Acts I–IV · 78–90vh frames · soft scrims + vignette blends
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-white/80">
              <MatteChip className="text-[0.72rem]">
                Perazzi red glows
              </MatteChip>
              <MatteChip className="text-[0.72rem]">
                Glass cards only
              </MatteChip>
              <MatteChip className="text-[0.72rem]">
                Gentle parallax
              </MatteChip>
            </div>
          </MatteCard>
        </CinematicSection>

        <CinematicSection
          id="act-i"
          label="Act I — Arrival"
          labelPlacement="outside"
          title="Case opens under studio haze."
          body="The first glass card rides in from the right, letting the bench light up the steel silhouette. The overlay is thin enough to see the grain but strong enough for white type."
          backgroundImage="/demo/p-web-11.jpg"
          backgroundAlt="Perazzi engraving bench with soft light."
          align="right"
          childrenWrapperClassName="sm:grid-cols-[0.6fr_0.4fr] sm:max-w-6xl sm:w-full sm:items-start sm:ml-0 ml-0"
          primaryCardClassName="sm:max-w-2xl"
          floatingOverlay={
            <div className="absolute inset-0">
              <p className="pointer-events-none absolute bottom-16 left-10 text-sm text-neutral-200/80 drop-shadow-[0_0_16px_rgba(0,0,0,0.9)] sm:left-16">
                Ambient bench light wraps the trigger guard.
              </p>
            </div>
          }
        >
          <MatteCard className="sm:w-[min(340px,100%)] sm:justify-self-start sm:-mt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full border border-white/20 bg-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
                <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.36),transparent_55%)] opacity-80" />
              </div>
              <div className="space-y-2 text-sm text-white/75">
                <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                  Overlay brief
                </p>
                <p>Glass at 8–10% white, blur 24px, red glow on the leading edge.</p>
                <p className="text-white/65">
                  Bottom vignette fades to black to merge into the next shot.
                </p>
              </div>
            </div>
          </MatteCard>
          <MatteChip className="self-start justify-self-end px-4 py-2 text-[0.75rem] tracking-[0.2em]">
            Studio hush
          </MatteChip>
        </CinematicSection>

        <CinematicSection
          id="act-ii"
          label="Act II — Engraving"
          labelPlacement="outside"
          title="Macro view of the steel spine."
          body="Museum-plaque treatment: a low, wide glass strip carries the description while the engraving stays raw above."
          backgroundImage="/demo/p-web-15.jpg"
          backgroundAlt="Close macro of engraved metalwork."
          align="center"
          contentPosition="end"
          contentClassName="pb-14"
          primaryCardClassName="max-w-5xl sm:max-w-[92%]"
          childrenWrapperClassName="grid-cols-1 sm:grid-cols-1 justify-items-end mt-4 sm:mt-6 max-w-5xl w-full"
          floatingOverlay={
            <div className="absolute inset-0">
              <p className="pointer-events-none absolute top-20 left-8 text-sm text-neutral-200/80 drop-shadow-[0_0_16px_rgba(0,0,0,0.9)] sm:left-16">
                Grain of the engraving carries the shot.
              </p>
            </div>
          }
        >
          <MatteChip className="px-4 py-2 text-[0.72rem] tracking-[0.18em]">
            Museum plaque · anchored low
          </MatteChip>
        </CinematicSection>

        <CinematicSection
          id="act-iii"
          label="Act III — Range motion"
          labelPlacement="outside"
          title="The gun lifts; atmosphere holds."
          body="Full-width frame with off-center copy. A single glass label hangs mid-air while the background carries the kinetic energy of a mount."
          backgroundImage="/demo/p-web-21.jpg"
          backgroundAlt="Perazzi shotgun presented in profile."
          align="left"
          contentClassName="pt-10"
          primaryCardClassName="max-w-2xl sm:ml-6 lg:ml-20 sm:self-start sm:-mt-4"
          floatingOverlay={
            <div className="absolute inset-0">
              <MatteChip className="pointer-events-none absolute left-[14%] top-[34%] px-3 py-1 text-[0.7rem] tracking-[0.14em]">
                Balance point
              </MatteChip>
              <MatteChip className="pointer-events-none absolute right-[16%] bottom-[26%] px-3 py-1 text-[0.7rem] tracking-[0.14em]">
                Barrel line
              </MatteChip>
              <p className="pointer-events-none absolute bottom-14 right-10 text-sm text-neutral-200/80 drop-shadow-[0_0_16px_rgba(0,0,0,0.9)] sm:right-16">
                Range haze in last light.
              </p>
            </div>
          }
        >
          <MatteCard className="max-w-xl text-left sm:text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">
              Tone
            </p>
            <p className="mt-2 text-sm text-white/80">
              Slate scrim with red pinlights; avoid hard strokes so the range haze feels cinematic.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-white/70">
              <MatteChip className="text-[0.72rem]">
                Center weight
              </MatteChip>
              <MatteChip className="text-[0.72rem]">
                Vignette bottom
              </MatteChip>
              <MatteChip className="text-[0.72rem]">
                Parallax -4% / +6%
              </MatteChip>
            </div>
          </MatteCard>
        </CinematicSection>

        <CinematicSection
          id="act-iv"
          label="Act IV — Legacy wall"
          labelPlacement="outside"
          title="Names in glass; the room fades to black."
          body="Quiet breather: one small strip holds the line while the corridor stays open."
          backgroundImage="/demo/p-web-22.jpg"
          backgroundAlt="Dark corridor with Perazzi wall graphics."
          align="left"
          contentPosition="end"
          contentClassName="pb-20"
          primaryCardClassName="max-w-md sm:ml-2 sm:px-6 sm:py-5"
          childrenWrapperClassName="sm:max-w-md"
          floatingOverlay={
            <div className="absolute inset-0">
              <p className="pointer-events-none absolute bottom-12 left-10 text-sm text-neutral-200/80 drop-shadow-[0_0_16px_rgba(0,0,0,0.9)] sm:left-16">
                Corridor holds its breath between plaques.
              </p>
            </div>
          }
        >
          <MatteChip className="flex items-center gap-2 px-4 py-2 text-[0.78rem] tracking-[0.18em] sm:justify-self-start">
            Tiny CTA rail · Atelier contact soon
          </MatteChip>
        </CinematicSection>
      </div>
    </div>
  );
}
