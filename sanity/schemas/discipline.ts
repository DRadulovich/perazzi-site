import { defineField, defineType } from "sanity";

export const discipline = defineType({
  name: "discipline",
  title: "Discipline",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "overview",
      type: "blockContent",
      title: "Overview",
    }),
    defineField({
      name: "overviewHtml",
      type: "text",
      title: "Overview (HTML)",
      rows: 4,
    }),
    defineField({
      name: "hero",
      title: "Hero Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "championImage",
      title: "Champion Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "recommendedPlatforms",
      type: "array",
      of: [{ type: "reference", to: [{ type: "platform" }] }],
    }),
    defineField({
      name: "popularModels",
      title: "Most Popular Models",
      type: "array",
      of: [{ type: "reference", to: [{ type: "allModels" }] }],
      description: "Select one or more models that best represent this discipline.",
    }),
    defineField({
      name: "recipe",
      title: "Setup Recipe",
      type: "object",
      fields: [
        defineField({ name: "poiRange", title: "POI Range", type: "string" }),
        defineField({ name: "barrelLengths", title: "Barrel Lengths", type: "string" }),
        defineField({ name: "ribNotes", title: "Rib Notes", type: "text", rows: 3 }),
      ],
    }),
    defineField({
      name: "champion",
      title: "Champion Spotlight",
      type: "object",
      fields: [
        defineField({ name: "name", type: "string" }),
        defineField({ name: "title", type: "string" }),
        defineField({ name: "quote", type: "text" }),
        defineField({ name: "image", type: "imageWithMeta" }),
        defineField({ name: "href", type: "string" }),
      ],
    }),
    defineField({
      name: "articles",
      title: "Related Articles",
      type: "array",
      of: [{ type: "reference", to: [{ type: "article" }] }],
    }),
    defineField({
      name: "marqueeFallbackText",
      title: "Marquee Fallback Text",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "finalCta",
      title: "Final CTA",
      type: "object",
      fields: [
        defineField({ name: "text", type: "text" }),
        defineField({
          name: "primary",
          title: "Primary Button",
          type: "object",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({ name: "href", type: "string" }),
          ],
        }),
        defineField({
          name: "secondary",
          title: "Secondary Button",
          type: "object",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({ name: "href", type: "string" }),
          ],
        }),
      ],
    }),
  ],
});
