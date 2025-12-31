"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import type { ChatTriggerPayload } from "@/lib/chat-trigger";
import { homeMotion } from "@/lib/motionConfig";
import { cn } from "@/lib/utils";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type LinkAction = Readonly<{
  href: string;
  label: string;
  icon?: string;
  className?: string;
}>;

type ChatAction = Readonly<{
  label: string;
  payload: ChatTriggerPayload;
  variant?: "solid" | "outline";
  className?: string;
}>;

export type HeritageSplitSectionProps = Readonly<{
  sectionId?: string;
  className?: string;
  contentClassName?: string;
  backgroundLayerClassName?: string;
  headingId: string;
  heading: string;
  intro: string;
  rightTitle: string;
  bullets: readonly string[];
  closing: string;
  links?: readonly LinkAction[];
  chatAction?: ChatAction;
}>;

export function HeritageSplitSection({
  sectionId,
  className,
  contentClassName,
  backgroundLayerClassName,
  headingId,
  heading,
  intro,
  rightTitle,
  bullets,
  closing,
  links,
  chatAction,
}: HeritageSplitSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  const column = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.1 },
    },
  } as const;

  const list = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.06 },
    },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  } as const;

  const actions = links?.length || chatAction;

  return (
    <motion.section
      id={sectionId}
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        className,
      )}
      aria-labelledby={headingId}
      initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(10px)" }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={reduceMotion ? undefined : { once: true, amount: 0.35 }}
      transition={reduceMotion ? undefined : homeMotion.reveal}
    >
      {backgroundLayerClassName ? (
        <div className={cn("absolute inset-0 -z-10", backgroundLayerClassName)} aria-hidden="true" />
      ) : null}

      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-col gap-10 px-6 text-white lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10",
          contentClassName,
        )}
      >
        <motion.div
          className="space-y-4"
          variants={column}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.6 }}
        >
          <motion.div variants={item}>
            <Heading id={headingId} level={2} size="xl" className="text-white">
              {heading}
            </Heading>
          </motion.div>

          <motion.div variants={item}>
            <Text className="mb-8 type-subsection text-gray-300" leading="relaxed">
              {intro}
            </Text>
          </motion.div>

          {actions ? (
            <motion.div variants={item} className="flex flex-wrap justify-start gap-3">
              {chatAction ? (
                <ChatTriggerButton
                  label={chatAction.label}
                  payload={chatAction.payload}
                  variant={chatAction.variant}
                  className={chatAction.className}
                />
              ) : null}
              {links?.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={cn(
                    "group type-button inline-flex min-h-10 items-center justify-center gap-2 pill border transition hover:translate-x-0.5 focus-ring",
                    link.className,
                  )}
                >
                  {link.icon ? (
                    <span aria-hidden="true" className="text-lg leading-none">
                      {link.icon}
                    </span>
                  ) : null}
                  <span className="relative">{link.label}</span>
                </Link>
              ))}
            </motion.div>
          ) : null}
        </motion.div>

        <motion.div
          className="space-y-3 type-subsection text-gray-300"
          variants={column}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.6 }}
        >
          <motion.div variants={item}>
            <Text className="text-white" leading="normal">
              {rightTitle}
            </Text>
          </motion.div>

          <motion.ul className="space-y-2" variants={list}>
            {bullets.map((bullet) => {
              const [label, ...rest] = bullet.split(" - ");
              return (
                <motion.li
                  key={bullet}
                  variants={item}
                  whileHover={reduceMotion ? undefined : { x: 4, transition: homeMotion.micro }}
                >
                  <span className="text-white">{label}</span>
                  {rest.length ? (
                    <>
                      {" "}-{" "}
                      {rest.join(" - ")}
                    </>
                  ) : null}
                </motion.li>
              );
            })}
          </motion.ul>

          <motion.div variants={item}>
            <Text className="text-gray-300" leading="relaxed">
              {closing}
            </Text>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
