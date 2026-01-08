import { defineField, defineType } from "sanity";

export const platform = defineType({
  name: "platform",
  title: "Platform",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Name",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "name",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      type: "string",
      title: "Tagline",
    }),
    defineField({
      name: "lineage",
      type: "text",
      title: "Lineage",
      rows: 3,
    }),
    defineField({
      name: "lineageHtml",
      type: "text",
      title: "Lineage (HTML)",
      rows: 6,
    }),
    defineField({
      name: "hero",
      title: "Hero",
      type: "imageWithMeta",
    }),
    defineField({
      name: "hallmark",
      title: "Hallmark",
      type: "string",
    }),
    defineField({
      name: "weightDistribution",
      title: "Weight Distribution",
      type: "string",
    }),
    defineField({
      name: "typicalDisciplines",
      title: "Typical Disciplines",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "atAGlance",
      title: "At a Glance",
      type: "object",
      fields: [
        defineField({ name: "triggerType", type: "string" }),
        defineField({ name: "weightDistribution", type: "string" }),
        defineField({
          name: "typicalDisciplines",
          type: "array",
          of: [{ type: "string" }],
        }),
        defineField({
          name: "links",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({ name: "label", type: "string" }),
                defineField({ name: "href", type: "string" }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: "disciplineMap",
      title: "Discipline Map",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "discipline",
              type: "reference",
              to: [{ type: "discipline" }],
            }),
            defineField({ name: "label", type: "string" }),
            defineField({ name: "rationale", type: "text" }),
            defineField({ name: "href", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "relatedArticles",
      title: "Related Articles",
      type: "array",
      of: [{ type: "reference", to: [{ type: "article" }] }],
    }),
    defineField({
      name: "guidance",
      title: "Platform Guidance",
      type: "object",
      fields: [
        defineField({ name: "heading", type: "string" }),
        defineField({ name: "body", type: "text", rows: 3 }),
        defineField({ name: "chatLabel", type: "string" }),
        defineField({ name: "chatPrompt", type: "text", rows: 3 }),
      ],
    }),
    defineField({
      name: "finalCta",
      title: "Final CTA",
      type: "object",
      fields: [
        defineField({ name: "text", type: "text" }),
        defineField({
          name: "primary",
          title: "Primary Button",
          type: "object",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({ name: "href", type: "string" }),
          ],
        }),
        defineField({
          name: "secondary",
          title: "Secondary Button",
          type: "object",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({ name: "href", type: "string" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "highlights",
      title: "Highlights",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "body",
              type: "text",
            }),
            defineField({
              name: "media",
              type: "imageWithMeta",
            }),
          ],
          preview: {
            select: { title: "title", media: "media.asset" },
          },
        },
      ],
    }),
    defineField({
      name: "champion",
      title: "Champion Spotlight",
      type: "object",
      fields: [
        defineField({ name: "name", type: "string" }),
        defineField({ name: "title", type: "string" }),
        defineField({ name: "quote", type: "text" }),
        defineField({ name: "image", type: "imageWithMeta" }),
      ],
    }),
    defineField({
      name: "snippet",
      title: "Snippet",
      type: "object",
      fields: [
        defineField({
          name: "text",
          title: "Snippet Text",
          type: "text",
          rows: 4,
        }),
      ],
    }),
    defineField({
      name: "fixedCounterpart",
      title: "Fixed-Trigger Counterpart",
      type: "object",
      fields: [
        defineField({ name: "id", type: "string", title: "Identifier (optional)" }),
        defineField({ name: "name", type: "string", title: "Name" }),
        defineField({ name: "slug", type: "string", title: "Slug / Link" }),
      ],
    }),
    defineField({
      name: "detachableCounterpart",
      title: "Detachable Counterpart",
      type: "object",
      fields: [
        defineField({ name: "id", type: "string", title: "Identifier (optional)" }),
        defineField({ name: "name", type: "string", title: "Name" }),
        defineField({ name: "slug", type: "string", title: "Slug / Link" }),
      ],
    }),
    defineField({
      name: "disciplines",
      type: "array",
      of: [{ type: "reference", to: [{ type: "discipline" }] }],
    }),
  ],
});
