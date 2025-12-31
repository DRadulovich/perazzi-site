"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import type { BuildPageData, Expert } from "@/types/build";
import { homeMotion } from "@/lib/motionConfig";
import { ExpertCard } from "@/components/bespoke/ExpertCard";
import { Heading, Text } from "@/components/ui";

type BespokeExpertsSectionProps = Readonly<{
  experts: readonly Expert[];
  intro?: BuildPageData["expertsIntro"];
}>;

export function BespokeExpertsSection({ experts, intro }: BespokeExpertsSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const motionEnabled = !reduceMotion;

  const grid = {
    hidden: {},
    show: {
      transition: { staggerChildren: motionEnabled ? 0.08 : 0 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const eyebrow = intro?.eyebrow ?? "Atelier team";
  const heading = intro?.heading ?? "Meet the craftsmen guiding your build";

  return (
    <section
      id="bespoke-experts"
      tabIndex={-1}
      className="space-y-6 focus:outline-none"
      aria-labelledby="expert-section-heading"
    >
      <motion.div
        className="space-y-2"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Text size="label-tight" muted>
          {eyebrow}
        </Text>
        <Heading id="expert-section-heading" level={2} size="xl" className="text-ink">
          {heading}
        </Heading>
      </motion.div>

      <motion.div
        className="grid gap-6 md:grid-cols-3"
        variants={grid}
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      >
        {experts.map((expert) => (
          <motion.div key={expert.id} variants={item}>
            <ExpertCard expert={expert} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

