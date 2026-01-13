import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";

type ShopCatalogFieldProps = Readonly<{
  id?: string;
  backgroundSrc: string;
  backgroundAlt?: string;
  children: ReactNode;
  className?: string;
}>;

export function ShopCatalogField({
  id,
  backgroundSrc,
  backgroundAlt,
  children,
  className,
}: ShopCatalogFieldProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate w-screen max-w-[100vw] full-bleed py-10 text-ink sm:py-12",
        className,
      )}
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={backgroundSrc}
          alt={backgroundAlt ?? ""}
          fill
          sizes="100vw"
          className="object-cover opacity-20"
          priority={false}
        />
        <div className="absolute inset-0 bg-canvas/92" />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas-80" aria-hidden="true" />
      </div>

      <Container size="xl" className="relative z-10">
        <div className="rounded-3xl border border-border/70 bg-card/75 p-6 shadow-elevated backdrop-blur-md sm:p-8">
          {children}
        </div>
      </Container>
    </section>
  );
}
