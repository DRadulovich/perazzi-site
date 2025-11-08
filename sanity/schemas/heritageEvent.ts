import { defineField, defineType } from "sanity";

export const heritageEvent = defineType({
  name: "heritageEvent",
  title: "Heritage Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      type: "blockContent",
    }),
    defineField({
      name: "media",
      title: "Primary Media",
      type: "imageWithMeta",
    }),
    defineField({
      name: "champions",
      title: "Related Champions",
      type: "array",
      of: [{ type: "reference", to: [{ type: "champion" }] }],
    }),
    defineField({
      name: "platforms",
      title: "Related Platforms",
      type: "array",
      of: [{ type: "reference", to: [{ type: "platform" }] }],
    }),
  ],
});
