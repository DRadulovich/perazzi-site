import { defineField, defineType } from "sanity";

export const discipline = defineType({
  name: "discipline",
  title: "Discipline",
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
      name: "overview",
      type: "blockContent",
      title: "Overview",
    }),
    defineField({
      name: "hero",
      title: "Hero Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "championImage",
      title: "Champion Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "recommendedPlatforms",
      type: "array",
      of: [{ type: "reference", to: [{ type: "platform" }] }],
    }),
  ],
});
