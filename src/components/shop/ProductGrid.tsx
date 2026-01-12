import { Text } from "@/components/ui";
import type { Product } from "@/lib/bigcommerce/types";
import { ProductCard } from "./ProductCard";

type ProductGridProps = Readonly<{
  products: readonly Product[];
  showQuickView?: boolean;
}>;

export function ProductGrid({ products, showQuickView = false }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/70 p-8 text-center">
        <Text size="lg">No products match these filters.</Text>
        <Text muted className="mt-2">
          Try adjusting your price range or availability.
        </Text>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showQuickView={showQuickView} />
      ))}
    </div>
  );
}
