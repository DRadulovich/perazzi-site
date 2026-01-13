import type { StaticImageData } from "next/image";
import schematic12Fixed from "@/../docs/BIGCOMMERCE/Schematics-Images/Schematic-12GA-Fixed.jpg";
import schematic12Removable from "@/../docs/BIGCOMMERCE/Schematics-Images/Schematic-12GA-Removable.jpg";
import schematic20Fixed from "@/../docs/BIGCOMMERCE/Schematics-Images/Schematic-20GA-Fixed.jpg";
import schematic20Removable from "@/../docs/BIGCOMMERCE/Schematics-Images/Schematic-20GA-Removable.jpg";
import schematic28Fixed from "@/../docs/BIGCOMMERCE/Schematics-Images/Schematic-28GA-Fixed.jpg";
import schematic410Fixed from "@/../docs/BIGCOMMERCE/Schematics-Images/Schematic-410GA-Fixed.jpg";

export type SchematicImage = {
  src: StaticImageData;
  alt: string;
  label: string;
};

const schematic12FixedImage: SchematicImage = {
  src: schematic12Fixed,
  alt: "Exploded schematic diagram for Perazzi 12 gauge fixed",
  label: "12GA fixed",
};

const schematic12RemovableImage: SchematicImage = {
  src: schematic12Removable,
  alt: "Exploded schematic diagram for Perazzi 12 gauge removable",
  label: "12GA removable",
};

const schematic20FixedImage: SchematicImage = {
  src: schematic20Fixed,
  alt: "Exploded schematic diagram for Perazzi 20 gauge fixed",
  label: "20GA fixed",
};

const schematic20RemovableImage: SchematicImage = {
  src: schematic20Removable,
  alt: "Exploded schematic diagram for Perazzi 20 gauge removable",
  label: "20GA removable",
};

const schematic28FixedImage: SchematicImage = {
  src: schematic28Fixed,
  alt: "Exploded schematic diagram for Perazzi 28 gauge fixed",
  label: "28GA fixed",
};

const schematic410FixedImage: SchematicImage = {
  src: schematic410Fixed,
  alt: "Exploded schematic diagram for Perazzi 410 gauge fixed",
  label: "410GA fixed",
};

const SCHEMATICS_ALL = [
  schematic12FixedImage,
  schematic12RemovableImage,
  schematic20FixedImage,
  schematic20RemovableImage,
  schematic28FixedImage,
  schematic410FixedImage,
];

export const shopSchematics = SCHEMATICS_ALL;

export const categorySchematicsBySlug: Record<string, SchematicImage[]> = {
  parts: SCHEMATICS_ALL,
  platform: SCHEMATICS_ALL,
  "mx-ht": SCHEMATICS_ALL,
  "trigger-type": SCHEMATICS_ALL,
  "12-ga": [schematic12FixedImage, schematic12RemovableImage],
  "20-ga": [schematic20FixedImage, schematic20RemovableImage],
  "28-ga": [schematic28FixedImage],
  "410-ga": [schematic410FixedImage],
  "non-removable": [
    schematic12FixedImage,
    schematic20FixedImage,
    schematic28FixedImage,
    schematic410FixedImage,
  ],
  removable: [schematic12RemovableImage, schematic20RemovableImage],
};

export const getSchematicsForCategory = (slug: string) =>
  categorySchematicsBySlug[slug] ?? null;
