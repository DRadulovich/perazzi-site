import { defineField, defineType } from "sanity";

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "body",
      type: "blockContent",
    }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "relations",
      type: "object",
      fields: [
        defineField({
          name: "champions",
          type: "array",
          of: [{ type: "reference", to: [{ type: "champion" }] }],
        }),
        defineField({
          name: "platforms",
          type: "array",
          of: [{ type: "reference", to: [{ type: "platform" }] }],
        }),
        defineField({
          name: "disciplines",
          type: "array",
          of: [{ type: "reference", to: [{ type: "discipline" }] }],
        }),
      ],
    }),
  ],
});
