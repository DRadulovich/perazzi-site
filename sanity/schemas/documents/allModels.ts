import { defineField, defineType } from "sanity";

export const allModels = defineType({
  name: "allModels",
  title: "All Models",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "platform",
      title: "Platform",
      type: "reference",
      to: [{ type: "platform" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "baseModel",
      title: "Base Model",
      type: "string",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Competition", value: "competition" },
          { title: "Game", value: "game" },
          { title: "Mixed", value: "mixed" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "disciplines",
      title: "Disciplines",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "gauges",
      title: "Gauges",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "barrelConfig",
      title: "Barrel Configuration",
      type: "string",
      options: {
        list: [
          { title: "Over/Under", value: "over-under" },
          { title: "Unsingle", value: "unsingle" },
          { title: "Top Single", value: "top-single" },
          { title: "Side by Side", value: "side-by-side" },
          { title: "Other", value: "other" },
        ],
        layout: "tags",
      },
    }),
    defineField({
      name: "combo",
      title: "Combo",
      type: "boolean",
    }),
    defineField({
      name: "comboType",
      title: "Combo Type",
      type: "string",
    }),
    defineField({
      name: "trigger",
      title: "Trigger",
      type: "object",
      fields: [
        defineField({
          name: "type",
          title: "Type",
          type: "string",
          options: {
            list: [
              { title: "Removable", value: "removable" },
              { title: "Fixed", value: "fixed" },
              { title: "Other", value: "other" },
            ],
          },
        }),
        defineField({
          name: "springs",
          title: "Springs",
          type: "array",
          of: [
            {
              type: "string",
              options: {
                list: [
                  { title: "Flat", value: "flat" },
                  { title: "Coil", value: "coil" },
                  { title: "Other", value: "other" },
                ],
              },
            },
          ],
          options: { layout: "tags" },
        }),
      ],
    }),
    defineField({
      name: "rib",
      title: "Rib",
      type: "object",
      fields: [
        defineField({
          name: "type",
          title: "Type",
          type: "string",
          options: {
            list: [
              { title: "Adjustable", value: "adjustable" },
              { title: "Fixed", value: "fixed" },
              { title: "Other", value: "other" },
            ],
          },
        }),
        defineField({
          name: "adjustableNotch",
          title: "Adjustable Notch",
          type: "number",
        }),
        defineField({
          name: "heightMm",
          title: "Height (mm)",
          type: "number",
        }),
        defineField({
          name: "styles",
          title: "Styles",
          type: "array",
          of: [{ type: "string" }],
          options: { layout: "tags" },
        }),
      ],
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "imageFallbackUrl",
      title: "Image Fallback URL",
      type: "url",
    }),
    defineField({
      name: "sourceUrl",
      title: "Source URL",
      type: "url",
    }),
    defineField({
      name: "grade",
      title: "Grade",
      type: "reference",
      to: [{ type: "grade" }],
    }),
    defineField({
      name: "idLegacy",
      title: "Legacy ID",
      type: "string",
    }),
    defineField({
      name: "notes",
      title: "Notes",
      type: "text",
    }),
  ],
  preview: {
    select: {
      title: "name",
      grade: "grade.name",        // or just "grade" if stored as string
      comboType: "comboType",
      media: "image",
    },
    prepare({ title, grade, comboType, media }) {
      const parts = [];
      if (grade) parts.push(`Grade: ${grade}`);
      if (comboType) parts.push(`Combo: ${comboType}`);
      return {
        title,
        subtitle: parts.join(" • "),
        media,
      };
  },
},
});
