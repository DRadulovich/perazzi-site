import { ShopCatalogField } from "@/components/shop/ShopCatalogField";
import cartBg from "@/../docs/BIGCOMMERCE/Background-Images/cart-page-bg.jpg";

const CART_LINE_SKELETON_KEYS = ["cart-line-1", "cart-line-2", "cart-line-3"] as const;

const SkeletonLine = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-ink/10 ${className}`} aria-hidden="true" />
);

export default function Loading() {
  return (
    <ShopCatalogField
      id="shop-cart"
      backgroundSrc={cartBg.src}
      backgroundAlt=""
      className="full-bleed-offset-top-lg"
    >
      <div className="space-y-8 pb-24 lg:pb-0" aria-busy="true" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonLine className="h-10 w-40" />
            <SkeletonLine className="h-5 w-72" />
          </div>
          <SkeletonLine className="h-10 w-44" />
        </div>

	        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
	          <div className="space-y-4">
	            {CART_LINE_SKELETON_KEYS.map((key) => (
	              <div
	                key={key}
	                className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-soft backdrop-blur-sm"
	              >
	                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
	                  <div className="flex min-w-0 items-start gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-2xl border border-border/70 bg-ink/10" />
                    <div className="min-w-0 space-y-2">
                      <SkeletonLine className="h-5 w-64" />
                      <SkeletonLine className="h-4 w-40" />
                      <SkeletonLine className="h-4 w-56" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <SkeletonLine className="h-10 w-40" />
                    <SkeletonLine className="h-10 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <div className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm">
              <SkeletonLine className="h-6 w-32" />
              <div className="mt-4 space-y-3">
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-3 w-3/4" />
              </div>
              <SkeletonLine className="mt-6 h-10 w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-canvas/90 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-sm py-4 sm:px-md lg:px-lg">
          <div className="space-y-1">
            <SkeletonLine className="h-3 w-16" />
            <SkeletonLine className="h-4 w-32" />
          </div>
          <SkeletonLine className="h-10 w-40" />
        </div>
      </div>
    </ShopCatalogField>
  );
}
