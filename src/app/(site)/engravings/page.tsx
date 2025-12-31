import type { Metadata } from "next";
import Image from "next/image";
import { groq } from "next-sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { EngravingSearchTable } from "@/components/engravings/EngravingSearchTable";
import { Heading, Text } from "@/components/ui";
import { client } from "@/sanity/lib/client";
import engravingHero from "@/../Photos/p-web-d-2.jpg";

const engravingsQuery = groq`*[_type == "engravings"] | order(engraving_grade->name asc, engraving_id asc, engraving_side asc) {
  _id,
  "engravingId": engraving_id,
  "engravingSide": engraving_side,
  "gradeName": engraving_grade->name,
  "image": engraving_photo.asset,
  "imageAlt": coalesce(engraving_photo.alt, "Engraving " + engraving_id + " " + engraving_side),
}`;

type EngravingQueryResult = {
  _id: string;
  engravingId?: string;
  engravingSide?: string;
  gradeName?: string;
  image?: SanityImageSource | null;
  imageAlt?: string;
};

export const metadata: Metadata = {
  title: "Engraving Search | Perazzi",
  description: "Browse every catalogued Perazzi engraving pattern across grades and view each side in high resolution.",
};

export default async function EngravingsPage() {
  const rawEngravings = await client.fetch<EngravingQueryResult[]>(engravingsQuery);
  const engravings = rawEngravings
    .filter((row) => row.engravingId && row.engravingSide && row.gradeName)
    .map((row) => ({
      _id: row._id,
      engravingId: row.engravingId ?? "",
      engravingSide: row.engravingSide ?? "",
      gradeName: row.gradeName ?? "",
      image: row.image || null,
      imageAlt: row.imageAlt || `Engraving ${row.engravingId ?? ""}`,
    }));

  return (
    <div className="space-y-12">
      <section className="relative mb-12 overflow-hidden rounded-sm border border-white/10 bg-black/60">
        <div className="relative h-72 w-full sm:h-96 lg:h-112">
          <Image
            src={engravingHero}
            alt="Perazzi engraving illustration"
            fill
            priority
            className="object-cover object-center"
            sizes="(min-width: 1024px) 1200px, 100vw"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center gap-4 px-8 py-10 text-white sm:px-12 lg:px-16">
            <Text size="label-tight" className="text-white/70">
              Engraving Search
            </Text>
            <Heading level={1} size="xl" className="text-white">
              The Perazzi Engraving Library
            </Heading>
            <p className="max-w-2xl text-white/80 type-section-subtitle">
              A living archive of hand and light. Here, master engravers leave their signatures—lines that breathe,
              patterns that carry meaning—so your shotgun can wear a story as singular as its owner.
            </p>
          </div>
        </div>
      </section>

      <EngravingSearchTable engravings={engravings} />
    </div>
  );
}
