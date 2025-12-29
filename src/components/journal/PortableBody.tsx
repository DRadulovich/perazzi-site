"use client";

import { useMemo } from "react";
import type { PortableBlock } from "@/types/journal";
import { logAnalytics } from "@/lib/analytics";
import { PortableGallery } from "./PortableGallery";

type PortableTextChild = {
  text?: string;
};

type PortableBodyProps = {
  readonly blocks: ReadonlyArray<PortableBlock>;
};

export function PortableBody({ blocks }: PortableBodyProps) {
  const headingEntries = useMemo(() => getHeadingEntries(blocks), [blocks]);
  const headingMap = new Map<number, string>();
  headingEntries.forEach((entry) => headingMap.set(entry.index, entry.id));

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {headingEntries.length ? (
        <nav aria-label="On this page" className="lg:w-64">
          <a href="#article-content" className="type-caption text-perazzi-red focus-ring">
            Skip to article
          </a>
          <a href="#article-content" className="mt-2 block type-caption text-perazzi-red focus-ring">
            Skip ToC
          </a>
          <ul className="mt-4 space-y-2 type-body-sm text-ink">
            {headingEntries.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className="text-ink focus-ring"
                  onClick={() => logAnalytics(`TOCJump:${heading.text}`)}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <article id="article-content" className="prose prose-lg max-w-none text-ink">
        {blocks.map((block, index) => renderBlock(block, headingMap.get(index) ?? `para-${index}`))}
      </article>
    </div>
  );
}

function getHeadingEntries(blocks: ReadonlyArray<PortableBlock>) {
  const entries: { id: string; text: string; index: number }[] = [];
  blocks.forEach((block, index) => {
    if (block._type === "block" && (block.style === "h2" || block.style === "h3")) {
      entries.push({ id: `heading-${index}`, text: getText(block), index });
    }
  });
  return entries;
}

function renderBlock(block: PortableBlock, id: string) {
  if (block._type === "block") {
    const style = block.style ?? "normal";
    const text = getText(block);
    if (style === "h2" || style === "h3") {
      const Tag = style;
      return (
        <Tag key={id} id={id}>
          {text}
        </Tag>
      );
    }
    return <p key={id}>{text}</p>;
  }
  if (block._type === "portableGallery" && Array.isArray(block.items)) {
    return <PortableGallery key={id} items={block.items} />;
  }
  return null;
}

function getText(block: PortableBlock) {
  if (!("children" in block) || !Array.isArray(block.children)) return "";
  return (block.children as PortableTextChild[])
    .map((child) => child.text ?? "")
    .join(" ");
}
