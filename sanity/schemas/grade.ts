import { defineField, defineType } from "sanity";

export const grade = defineType({
  name: "grade",
  title: "Grade",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "hero",
      title: "Hero Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "engravingGallery",
      title: "Engraving Gallery",
      type: "array",
      of: [{ type: "imageWithMeta" }],
    }),
    defineField({
      name: "woodImages",
      title: "Wood Images",
      type: "array",
      of: [{ type: "imageWithMeta" }],
    }),
  ],
});
