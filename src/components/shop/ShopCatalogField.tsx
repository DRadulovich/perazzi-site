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
      data-theme="dark"
      className={cn(
        "relative isolate w-screen max-w-[100vw] full-bleed py-12 text-ink sm:py-16",
        className,
      )}
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={backgroundSrc}
          alt={backgroundAlt ?? ""}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-ink" aria-hidden="true" />
      </div>

      <Container size="xl" className="relative z-10">
        <div className="rounded-3xl border border-white/12 bg-black/55 p-6 shadow-elevated ring-1 ring-white/10 backdrop-blur-lg sm:p-8">
          {children}
        </div>
      </Container>
    </section>
  );
}
