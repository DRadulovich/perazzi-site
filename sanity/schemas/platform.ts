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
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
        }),
        defineField({
          name: "caption",
          type: "string",
          title: "Caption",
        }),
      ],
    }),
    defineField({
      name: "highlights",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "disciplines",
      type: "array",
      of: [{ type: "reference", to: [{ type: "discipline" }] }],
    }),
  ],
});
