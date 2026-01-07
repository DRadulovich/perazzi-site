"use client";

import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { Heading, Section, Text } from "@/components/ui";
import type { IntegrityAdvisorySection } from "@/types/service";
import { motion, useReducedMotion } from "framer-motion";
import { homeMotion } from "@/lib/motionConfig";

type IntegrityAdvisoryProps = Readonly<{
  integrityAdvisory: IntegrityAdvisorySection;
}>;

const MotionSection = motion.create(Section);

export function IntegrityAdvisory({ integrityAdvisory }: IntegrityAdvisoryProps) {
  const analyticsRef = useAnalyticsObserver("IntegrityAdvisorySeen");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;
  const heading = integrityAdvisory.heading ?? "Protect your investment";
  const body = integrityAdvisory.body ??
    "Perazzi parts are serialised and fit by hand. Grey-market spares often compromise safety, timing, or regulation. Work only with the factory or authorised service centres; every shipment includes documentation so you can verify provenance.\n\nIf you are unsure, contact the concierge—send photos or serial numbers and we will confirm authenticity before you install any component.";

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id="IntegrityAdvisorySeen"
      padding="md"
      className="group relative space-y-4 overflow-hidden"
      initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <motion.div
        className="space-y-4"
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "show" : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        variants={{ hidden: {}, show: { transition: { staggerChildren: motionEnabled ? 0.08 : 0 } } }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
          }}
        >
          <Text size="label-tight" muted>
            Authenticity & fitment
          </Text>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
          }}
        >
          <Heading level={2} size="xl" className="text-ink">
            {heading}
          </Heading>
        </motion.div>

        <motion.div className="space-y-3">
          {body.split("\n\n").map((paragraph) => (
            <motion.div
              key={paragraph}
              variants={{
                hidden: { opacity: 0, y: 12, filter: "blur(10px)" },
                show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
              }}
            >
              <Text size="md" muted leading="relaxed">
                {paragraph}
              </Text>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </MotionSection>
  );
}
