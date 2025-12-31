"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ScrollIndicator } from "@/components/home/scroll-indicator";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { homeMotion } from "@/lib/motionConfig";

type HeritageIntroSectionProps = Readonly<{
  eyebrow: string;
  heading: string;
  paragraphs: readonly string[];
  imageSrc: string;
  imageAlt: string;
}>;

export function HeritageIntroSection({
  eyebrow,
  heading,
  paragraphs,
  imageSrc,
  imageAlt,
}: HeritageIntroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  const content = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.08 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  return (
    <section
      id="perazzi-heritage"
      className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-14 pb-16 sm:pb-20 -mb-16 sm:-mb-16 min-h-[80vh] full-bleed scroll-mt-24"
      aria-labelledby="heritage-intro-heading"
    >
      <div
        className="absolute inset-0 -z-10 bg-linear-to-t from-black via-black/50 to-canvas"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 text-white lg:flex-row lg:items-center lg:gap-12">
        <motion.div
          className="flex-1 space-y-4"
          variants={content}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.55 }}
        >
          <motion.div variants={item}>
            <Text size="label-tight" className="text-white/70">
              {eyebrow}
            </Text>
          </motion.div>

          <motion.div variants={item}>
            <Heading id="heritage-intro-heading" level={2} size="xl" className="text-white">
              {heading}
            </Heading>
          </motion.div>

          {paragraphs.map((paragraph) => (
            <motion.div key={paragraph} variants={item}>
              <Text className="text-white/80">
                {paragraph}
              </Text>
            </motion.div>
          ))}

          <motion.div className="hidden lg:flex lg:pt-2" variants={item}>
            <Link
              href="#heritage-serial-lookup"
              className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-6 py-3 type-button text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
            >
              <span className="relative">{"Skip Perazzi Timeline"}</span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex-1"
          initial={reduceMotion ? false : { y: 18, scale: 1.02, filter: "blur(10px)" }}
          whileInView={reduceMotion ? undefined : { y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.55 }}
          transition={reduceMotion ? undefined : homeMotion.reveal}
        >
          <div className="group relative w-full overflow-hidden rounded-2xl border border-white/20 bg-black/20 shadow-elevated ring-1 ring-white/10">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={1600}
              height={900}
              className="h-auto w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 film-grain opacity-15" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" aria-hidden="true" />
          </div>

          <div className="mt-6 flex justify-center lg:hidden">
            <Link
              href="#heritage-serial-lookup"
              className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-6 py-3 type-button text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
            >
              <span className="relative">{"Skip Perazzi Timeline"}</span>
            </Link>
          </div>
        </motion.div>
      </div>

      <ScrollIndicator className="bottom-24 sm:bottom-28 z-30 pointer-events-none hidden sm:flex" />
    </section>
  );
}
