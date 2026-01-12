import Image from "next/image";
import Link from "next/link";
import { Heading, Text } from "@/components/ui";
import type { Product } from "@/lib/bigcommerce/types";
import { cn } from "@/lib/utils";
import { formatProductPrice, getProductSlug } from "./utils";

type ProductCardProps = Readonly<{
  product: Product;
}>;

export function ProductCard({ product }: ProductCardProps) {
  const slug = encodeURIComponent(getProductSlug(product.path, product.name));
  const href = `/shop/product/${slug}?id=${product.id}`;
  const image = product.defaultImage ?? product.images[0];
  const priceLabel = formatProductPrice(product);
  const showOutOfStock = product.availableForSale === false;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-soft transition-shadow",
        "hover:shadow-soft",
      )}
    >
      <Link
        href={href}
        prefetch={false}
        className="relative block aspect-4/5 overflow-hidden bg-canvas/70"
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.name}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-canvas/80">
            <Text size="label-tight" muted>
              Image coming soon
            </Text>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brand ? (
          <Text size="label-tight" muted>
            {product.brand}
          </Text>
        ) : null}
        <Heading level={3} size="sm" className="text-balance">
          {product.name}
        </Heading>
        {priceLabel ? (
          <Text size="sm" className="text-ink">
            {priceLabel}
          </Text>
        ) : null}
        {showOutOfStock ? (
          <Text size="caption" muted>
            Out of stock
          </Text>
        ) : null}
      </div>
    </article>
  );
}
