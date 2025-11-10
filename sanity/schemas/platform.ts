import { defineField, defineType } from "sanity";

export const platform = defineType({
  name: "platform",
  title: "Platform",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Name",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "name",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lineage",
      type: "text",
      title: "Lineage",
      rows: 3,
    }),
    defineField({
      name: "hero",
      title: "Hero",
      type: "imageWithMeta",
    }),
    defineField({
      name: "highlights",
      title: "Highlights",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "body",
              type: "text",
            }),
            defineField({
              name: "media",
              type: "imageWithMeta",
            }),
          ],
          preview: {
            select: { title: "title", media: "media.asset" },
          },
        },
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
      ],
    }),
    defineField({
      name: "snippet",
      title: "Snippet",
      type: "object",
      fields: [
        defineField({
          name: "text",
          title: "Snippet Text",
          type: "text",
          rows: 4,
        }),
      ],
    }),
    defineField({
      name: "fixedCounterpart",
      title: "Fixed-Trigger Counterpart",
      type: "object",
      fields: [
        defineField({ name: "id", type: "string", title: "Identifier (optional)" }),
        defineField({ name: "name", type: "string", title: "Name" }),
        defineField({ name: "slug", type: "string", title: "Slug / Link" }),
      ],
    }),
    defineField({
      name: "detachableCounterpart",
      title: "Detachable Counterpart",
      type: "object",
      fields: [
        defineField({ name: "id", type: "string", title: "Identifier (optional)" }),
        defineField({ name: "name", type: "string", title: "Name" }),
        defineField({ name: "slug", type: "string", title: "Slug / Link" }),
      ],
    }),
    defineField({
      name: "disciplines",
      type: "array",
      of: [{ type: "reference", to: [{ type: "discipline" }] }],
    }),
  ],
});
