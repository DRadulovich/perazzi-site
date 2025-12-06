import { defineField, defineType } from "sanity";

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "body",
      type: "blockContent",
    }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "isBuildJourneyStep",
      title: "Include in Build Journey?",
      type: "boolean",
      description:
        "Enable this if this article is one of the factory build-journey steps.",
    }),
    defineField({
      name: "buildStepOrder",
      title: "Build Journey Order",
      type: "number",
      description:
        "Lower numbers appear earlier in the build journey. Only used when Include in Build Journey is enabled.",
    }),
    defineField({
      name: "relations",
      type: "object",
      fields: [
        defineField({
          name: "champions",
          type: "array",
          of: [{ type: "reference", to: [{ type: "champion" }] }],
        }),
        defineField({
          name: "platforms",
          type: "array",
          of: [{ type: "reference", to: [{ type: "platform" }] }],
        }),
        defineField({
          name: "disciplines",
          type: "array",
          of: [{ type: "reference", to: [{ type: "discipline" }] }],
        }),
      ],
    }),
  ],
});
