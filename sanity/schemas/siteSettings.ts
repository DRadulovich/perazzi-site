import { defineArrayMember, defineField, defineType, type UrlRule } from "sanity";

const relativeHrefRule = (rule: UrlRule) => rule.uri({ allowRelative: true });
const requiredRelativeHrefRule = (rule: UrlRule) =>
  rule.required().uri({ allowRelative: true });

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "brandLabel",
      title: "Brand Label",
      type: "string",
    }),
    defineField({
      name: "nav",
      title: "Navigation",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              type: "url",
              validation: requiredRelativeHrefRule,
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "navFlyouts",
      title: "Navigation Flyouts",
      type: "object",
      fields: [
        defineField({
          name: "shotguns",
          title: "Shotguns Flyout",
          type: "object",
          fields: [
            defineField({ name: "heading", type: "string" }),
            defineField({ name: "description", type: "text", rows: 3 }),
            defineField({ name: "ctaLabel", type: "string" }),
            defineField({ name: "ctaHref", type: "url", validation: relativeHrefRule }),
            defineField({
              name: "cards",
              title: "Cards",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "title", type: "string" }),
                    defineField({ name: "description", type: "text", rows: 2 }),
                    defineField({ name: "href", type: "url", validation: relativeHrefRule }),
                  ],
                }),
              ],
            }),
          ],
        }),
        defineField({
          name: "experience",
          title: "Experience Flyout",
          type: "object",
          fields: [
            defineField({
              name: "sections",
              title: "Sections",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "label", type: "string" }),
                    defineField({
                      name: "links",
                      type: "array",
                      of: [
                        defineArrayMember({
                          type: "object",
                          fields: [
                            defineField({ name: "label", type: "string" }),
                            defineField({ name: "href", type: "url", validation: relativeHrefRule }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            defineField({ name: "footerCtaLabel", type: "string" }),
            defineField({ name: "footerCtaHref", type: "url", validation: relativeHrefRule }),
          ],
        }),
        defineField({
          name: "heritage",
          title: "Heritage Flyout",
          type: "object",
          fields: [
            defineField({ name: "heading", type: "string" }),
            defineField({ name: "description", type: "text", rows: 3 }),
            defineField({ name: "ctaLabel", type: "string" }),
            defineField({ name: "ctaHref", type: "url", validation: relativeHrefRule }),
            defineField({
              name: "columns",
              title: "Columns",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "title", type: "string" }),
                    defineField({
                      name: "links",
                      type: "array",
                      of: [
                        defineArrayMember({
                          type: "object",
                          fields: [
                            defineField({ name: "label", type: "string" }),
                            defineField({ name: "href", type: "url", validation: relativeHrefRule }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "navCtas",
      title: "Navigation CTAs",
      type: "object",
      fields: [
        defineField({
          name: "buildPlanner",
          title: "Build Planner",
          type: "object",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({ name: "href", type: "url", validation: relativeHrefRule }),
          ],
        }),
      ],
    }),
    defineField({
      name: "storeLink",
      title: "Store Link",
      type: "object",
      fields: [
        defineField({ name: "label", type: "string" }),
        defineField({ name: "href", type: "url", validation: relativeHrefRule }),
      ],
    }),
    defineField({
      name: "footer",
      title: "Footer",
      type: "object",
      fields: [
        defineField({
          name: "brandLabel",
          type: "string",
        }),
        defineField({
          name: "description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "addressLine",
          type: "string",
        }),
        defineField({
          name: "legalLinks",
          title: "Legal Links",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              fields: [
                defineField({ name: "label", type: "string" }),
                defineField({ name: "href", type: "url", validation: relativeHrefRule }),
              ],
            }),
          ],
        }),
        defineField({
          name: "columns",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  type: "string",
                }),
                defineField({
                  name: "links",
                  type: "array",
                  of: [
                    defineArrayMember({
                      type: "object",
                      fields: [
                        defineField({
                          name: "label",
                          type: "string",
                        }),
                        defineField({
                          name: "href",
                          type: "url",
                          validation: relativeHrefRule,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "social",
      type: "object",
      fields: [
        defineField({ name: "instagram", type: "url" }),
        defineField({ name: "youtube", type: "url" }),
        defineField({ name: "facebook", type: "url" }),
        defineField({ name: "email", type: "string" }),
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO Defaults",
      type: "object",
      fields: [
        defineField({
          name: "title",
          type: "string",
        }),
        defineField({
          name: "description",
          type: "text",
        }),
        defineField({
          name: "image",
          type: "image",
          options: { hotspot: true },
        }),
      ],
    }),
    defineField({
      name: "ctaDefaults",
      title: "CTA Defaults",
      type: "object",
      fields: [
        defineField({ name: "heading", type: "string" }),
      ],
    }),
    defineField({
      name: "journalUi",
      title: "Journal UI",
      type: "object",
      fields: [
        defineField({ name: "heroLabel", type: "string" }),
        defineField({ name: "categoryLabel", type: "string" }),
        defineField({ name: "featuredLabel", type: "string" }),
        defineField({
          name: "search",
          type: "object",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({ name: "placeholder", type: "string" }),
            defineField({ name: "buttonLabel", type: "string" }),
          ],
        }),
        defineField({
          name: "newsletter",
          type: "object",
          fields: [
            defineField({ name: "heading", type: "string" }),
            defineField({ name: "body", type: "text", rows: 3 }),
            defineField({ name: "inputLabel", type: "string" }),
            defineField({ name: "inputPlaceholder", type: "string" }),
            defineField({ name: "submitLabel", type: "string" }),
            defineField({ name: "successMessage", type: "text", rows: 2 }),
          ],
        }),
      ],
    }),
  ],
});
