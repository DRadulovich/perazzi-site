import { defineField, defineType } from "sanity";

export const gauge = defineType({
  name: "gauge",
  title: "Gauge",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "handlingNotes",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "commonBarrels",
      title: "Common Barrels",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "typicalDisciplines",
      title: "Typical Disciplines",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "q", title: "Question", type: "string" }),
            defineField({ name: "a", title: "Answer", type: "text" }),
          ],
        },
      ],
    }),
  ],
});
