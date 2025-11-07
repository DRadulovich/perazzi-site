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
      name: "handlingNotes",
      type: "text",
      rows: 3,
    }),
  ],
});
