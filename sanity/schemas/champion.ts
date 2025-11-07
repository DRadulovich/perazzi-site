import { defineField, defineType } from "sanity";

export const champion = defineType({
  name: "champion",
  title: "Champion",
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
      name: "title",
      type: "string",
    }),
    defineField({
      name: "quote",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
        }),
      ],
    }),
    defineField({
      name: "disciplines",
      type: "array",
      of: [{ type: "reference", to: [{ type: "discipline" }] }],
    }),
    defineField({
      name: "platforms",
      type: "array",
      of: [{ type: "reference", to: [{ type: "platform" }] }],
    }),
    defineField({
      name: "articles",
      type: "array",
      of: [{ type: "reference", to: [{ type: "article" }] }],
    }),
  ],
});
