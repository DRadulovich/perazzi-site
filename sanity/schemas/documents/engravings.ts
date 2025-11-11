import { defineField, defineType } from "sanity";

export const engravings = defineType({
  name: "engravings",
  title: "Engravings",
  type: "document",
  fields: [
    defineField({
      name: "engraving_photo",
      title: "Engraving Photo",
      type: "imageWithMeta",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "engraving_grade",
      title: "Engraving Grade",
      type: "reference",
      to: [{ type: "grade" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "engraving_id",
      title: "Engraving ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "engraving_side",
      title: "Engraving Side",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "engraving_id",
      subtitle: "engraving_side",
      media: "engraving_photo",
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title ? `Engraving ${title}` : "Engraving",
        subtitle: subtitle ?? undefined,
        media,
      };
    },
  },
});
