"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Heading,
  Text,
} from "@/components/ui";
import type { SchematicImage } from "@/content/shop/schematics";

type ShopSchematicsStripProps = Readonly<{
  schematics: SchematicImage[];
}>;

export function ShopSchematicsStrip({ schematics }: ShopSchematicsStripProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!schematics.length) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Text size="label-tight" className="text-ink-muted">
            Schematics
          </Text>
          <Heading level={2} size="md" className="text-ink">
            Exploded diagrams for quick part identification.
          </Heading>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Text size="sm" className="text-ink-muted">
            {isOpen ? "Select a diagram to expand." : `${schematics.length} diagrams`}
          </Text>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="secondary">
              {isOpen ? "Hide schematics" : "Show schematics"}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="pt-5 data-[state=open]:overflow-visible data-[state=closed]:overflow-hidden">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schematics.map((schematic) => (
            <Dialog key={schematic.label}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="group rounded-2xl border border-border/70 bg-card/70 p-4 text-left shadow-soft transition hover:border-ink/15 hover:bg-card/85"
                >
                  <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border/70 bg-canvas/80">
                    <Image
                      src={schematic.src}
                      alt={schematic.alt}
                      fill
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw"
                      className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  </div>
                  <Text size="label-tight" className="mt-3 text-ink-muted group-hover:text-ink">
                    {schematic.label}
                  </Text>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl overflow-hidden p-0">
                <DialogHeader className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                  <DialogTitle>{schematic.label}</DialogTitle>
                  <DialogClose
                    type="button"
                    className="type-caption text-ink-muted transition hover:text-ink"
                  >
                    Close
                  </DialogClose>
                </DialogHeader>
                <div className="relative h-[70vh] w-full bg-canvas/90 p-6">
                  <Image
                    src={schematic.src}
                    alt={schematic.alt}
                    fill
                    sizes="(min-width: 1024px) 960px, 100vw"
                    className="object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
