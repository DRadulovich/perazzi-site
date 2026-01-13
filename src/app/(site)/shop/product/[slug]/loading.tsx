import { ShopCatalogField } from "@/components/shop/ShopCatalogField";
import productPageBg from "@/../docs/BIGCOMMERCE/Background-Images/product-page-bg.jpg";

const SkeletonLine = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-ink/10 ${className}`} aria-hidden="true" />
);

export default function Loading() {
  return (
    <ShopCatalogField
      id="shop-product"
      backgroundSrc={productPageBg.src}
      backgroundAlt=""
    >
      <div className="space-y-8" aria-busy="true" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SkeletonLine className="h-10 w-32" />
          <SkeletonLine className="h-10 w-24" />
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <div className="relative aspect-3/2 overflow-hidden rounded-3xl border border-border/70 bg-card/70">
              <div className="absolute inset-0 animate-pulse bg-ink/10" aria-hidden="true" />
            </div>

            <section className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm">
              <SkeletonLine className="h-3 w-20" />
              <div className="mt-4 space-y-2">
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-11/12" />
                <SkeletonLine className="h-4 w-10/12" />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm lg:sticky lg:top-[calc(var(--site-header-offset-lg)+16px)] lg:self-start">
              <SkeletonLine className="h-3 w-36" />
              <SkeletonLine className="mt-4 h-10 w-11/12" />
              <SkeletonLine className="mt-4 h-6 w-32" />
              <div className="mt-6 space-y-3">
                <SkeletonLine className="h-12 w-full" />
                <SkeletonLine className="h-12 w-full" />
                <SkeletonLine className="h-10 w-full" />
              </div>
            </section>

            <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm">
              <SkeletonLine className="h-3 w-40" />
              <SkeletonLine className="mt-4 h-5 w-10/12" />
              <SkeletonLine className="mt-2 h-5 w-11/12" />
              <div className="mt-6 flex flex-wrap gap-2">
                <SkeletonLine className="h-10 w-36" />
                <SkeletonLine className="h-10 w-32" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </ShopCatalogField>
  );
}

