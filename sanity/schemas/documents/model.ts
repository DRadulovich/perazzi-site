import { defineField, defineType } from "sanity";

export const model = defineType({
  name: "model",
  title: "Model",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "platform",
      title: "Platform",
      type: "reference",
      to: [{ type: "platform" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "discipline",
      title: "Discipline",
      type: "reference",
      to: [{ type: "discipline" }],
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "gauge",
      title: "Gauge",
      type: "string",
    }),
    defineField({
      name: "barrelLengthOne",
      title: "Barrel Length & Chokes",
      type: "string",
    }),
    defineField({
      name: "barrelLengthTwo",
      title: "Barrel Length & Chokes (Secondary)",
      type: "string",
    }),
    defineField({
      name: "ribPrimary",
      title: "Rib & Side Ribs",
      type: "string",
    }),
    defineField({
      name: "ribSecondary",
      title: "Rib & Side Ribs (Secondary)",
      type: "string",
    }),
    defineField({
      name: "trigger",
      title: "Trigger Group",
      type: "string",
    }),
    defineField({
      name: "stock",
      title: "Stock & Forend",
      type: "string",
    }),
    defineField({
      name: "notes",
      title: "Notes",
      type: "text",
      rows: 4,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "platform.name",
      media: "image",
    },
  },
});
