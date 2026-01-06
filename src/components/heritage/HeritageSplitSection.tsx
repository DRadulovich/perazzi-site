"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

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

type HeritageSplitBackgroundProps = Readonly<{
  className?: string;
}>;

type HeritageSplitActionsProps = Readonly<{
  links?: readonly LinkAction[];
  chatAction?: ChatAction;
  variants: Variants;
}>;

type HeritageActionLinkProps = Readonly<{
  link: LinkAction;
}>;

type HeritageBulletItemProps = Readonly<{
  bullet: string;
  reduceMotion: boolean;
  variants: Variants;
}>;

type HeritageBulletListProps = Readonly<{
  bullets: readonly string[];
  reduceMotion: boolean;
  itemVariants: Variants;
  listVariants: Variants;
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

function HeritageSplitBackground({ className }: HeritageSplitBackgroundProps) {
  if (!className) {
    return null;
  }

  return <div className={cn("absolute inset-0 -z-10", className)} aria-hidden="true" />;
}

function HeritageActionLink({ link }: HeritageActionLinkProps) {
  return (
    <Link
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
  );
}

function HeritageSplitActions({ links, chatAction, variants }: HeritageSplitActionsProps) {
  const hasLinks = Boolean(links?.length);
  const hasChatAction = Boolean(chatAction);

  if (!hasLinks && !hasChatAction) {
    return null;
  }

  return (
    <motion.div variants={variants} className="flex flex-wrap justify-start gap-3">
      {chatAction ? (
        <ChatTriggerButton
          label={chatAction.label}
          payload={chatAction.payload}
          variant={chatAction.variant}
          className={chatAction.className}
        />
      ) : null}
      {links?.map((link) => (
        <HeritageActionLink key={`${link.href}-${link.label}`} link={link} />
      ))}
    </motion.div>
  );
}

function HeritageBulletItem({ bullet, reduceMotion, variants }: HeritageBulletItemProps) {
  const [label, ...rest] = bullet.split(" - ");
  const detail = rest.length ? rest.join(" - ") : null;
  const hoverMotion = reduceMotion ? undefined : { x: 4, transition: homeMotion.micro };

  return (
    <motion.li
      key={bullet}
      variants={variants}
      whileHover={hoverMotion}
    >
      <span className="text-white">{label}</span>
      {detail ? (
        <>
          {" "}-{" "}
          {detail}
        </>
      ) : null}
    </motion.li>
  );
}

function HeritageBulletList({
  bullets,
  reduceMotion,
  itemVariants,
  listVariants,
}: HeritageBulletListProps) {
  return (
    <motion.ul className="space-y-2" variants={listVariants}>
      {bullets.map((bullet) => (
        <HeritageBulletItem
          key={bullet}
          bullet={bullet}
          reduceMotion={reduceMotion}
          variants={itemVariants}
        />
      ))}
    </motion.ul>
  );
}

function getSectionMotionProps(reduceMotion: boolean) {
  if (reduceMotion) {
    return { initial: false } as const;
  }

  return {
    initial: { opacity: 0, y: 18, filter: "blur(10px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
    viewport: { once: true, amount: 0.35 },
    transition: homeMotion.reveal,
  } as const;
}

function getColumnMotionProps(reduceMotion: boolean) {
  if (reduceMotion) {
    return { initial: false } as const;
  }

  return {
    initial: "hidden",
    whileInView: "show",
    viewport: { once: true, amount: 0.6 },
  } as const;
}

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
  const columnMotionProps = getColumnMotionProps(reduceMotion);
  const sectionMotionProps = getSectionMotionProps(reduceMotion);
  const columnStagger = reduceMotion ? 0 : 0.1;
  const listStagger = reduceMotion ? 0 : 0.06;

  const column: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: columnStagger },
    },
  };

  const list: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: listStagger },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: homeMotion.revealFast },
  };

  return (
    <motion.section
      id={sectionId}
      className={cn(
        "relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 full-bleed",
        className,
      )}
      aria-labelledby={headingId}
      {...sectionMotionProps}
    >
      <HeritageSplitBackground className={backgroundLayerClassName} />

      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-col gap-10 px-6 text-white lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10",
          contentClassName,
        )}
      >
        <motion.div
          className="space-y-4"
          variants={column}
          {...columnMotionProps}
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

          <HeritageSplitActions
            links={links}
            chatAction={chatAction}
            variants={item}
          />
        </motion.div>

        <motion.div
          className="space-y-3 type-subsection text-gray-300"
          variants={column}
          {...columnMotionProps}
        >
          <motion.div variants={item}>
            <Text className="text-white" leading="normal">
              {rightTitle}
            </Text>
          </motion.div>

          <HeritageBulletList
            bullets={bullets}
            reduceMotion={reduceMotion}
            itemVariants={item}
            listVariants={list}
          />

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
