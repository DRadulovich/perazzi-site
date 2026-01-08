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
      name: "provenanceHtml",
      title: "Provenance (HTML)",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "options",
      title: "Options",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "id", title: "ID", type: "string" }),
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "description", title: "Description", type: "text" }),
          ],
        },
      ],
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
