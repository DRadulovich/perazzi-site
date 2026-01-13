import type { CSSProperties } from "react";
import Link from "next/link";
import { Button, Text } from "@/components/ui";
import type { Product } from "@/lib/bigcommerce/types";
import { ProductCard } from "./ProductCard";

type ProductGridProps = Readonly<{
  products: readonly Product[];
  showQuickView?: boolean;
  resetHref?: string;
}>;

export function ProductGrid({ products, showQuickView = false, resetHref = "/shop" }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="section-reveal-body">
        <div className="rounded-3xl border border-border/70 bg-card/70 p-8 text-center">
          <Text size="lg">No products match these filters.</Text>
          <Text muted className="mt-2">
            Try adjusting your filters, or reset to browse the full catalog.
          </Text>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={resetHref} prefetch={false}>
                Reset filters
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/shop" prefetch={false}>
                All products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-reveal-body" data-reveal-sequence="true">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <div
            key={product.id}
            data-reveal-item
            style={{ "--reveal-index": index } as CSSProperties}
          >
            <ProductCard product={product} showQuickView={showQuickView} />
          </div>
        ))}
      </div>
    </div>
  );
}
