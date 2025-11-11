import type { Metadata } from "next";
import Image from "next/image";
import { groq } from "next-sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { EngravingSearchTable } from "@/components/engravings/EngravingSearchTable";
import { client } from "@/sanity/lib/client";
import engravingHero from "@/../Photos/ENGRAVINGS/Extra Gold/Engraving_85_-_Left_side_65_900_900_0.jpg";

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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="relative mb-12 overflow-hidden rounded-[40px] border border-white/10 bg-black/60">
        <div className="relative h-72 w-full sm:h-96 lg:h-[28rem]">
          <Image
            src={engravingHero}
            alt="Perazzi engraving illustration"
            fill
            priority
            className="object-cover object-center"
            sizes="(min-width: 1024px) 1200px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center gap-4 px-8 py-10 text-white sm:px-12 lg:px-16">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Engraving Search</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              The Perazzi Engraving Library
            </h1>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base">
              Explore every documented engraving pattern in the Sanity catalog. Filter by grade, focus on a particular
              side of the receiver, and open each entry in a lightbox to examine the artwork in detail.
            </p>
          </div>
        </div>
      </section>

      <EngravingSearchTable engravings={engravings} />
    </div>
  );
}
