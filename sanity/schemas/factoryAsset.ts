import { defineField, defineType } from "sanity";

export const factoryAsset = defineType({
  name: "factoryAsset",
  title: "Factory Asset",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "media",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "alt",
      type: "string",
      title: "Alt text",
    }),
    defineField({
      name: "caption",
      type: "string",
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
});
