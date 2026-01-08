import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentsIcon} from '@sanity/icons'

export const journalLanding = defineType({
  name: 'journalLanding',
  title: 'Journal Landing',
  icon: DocumentsIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'subheading', type: 'text', rows: 3 }),
        defineField({ name: 'background', type: 'imageWithMeta', validation: (Rule) => Rule.required() }),
      ],
    }),
    defineField({
      name: 'featuredArticle',
      title: 'Featured Article',
      type: 'reference',
      to: [{ type: 'article' }],
    }),
    defineField({
      name: 'sections',
      title: 'Landing Sections',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'key',
              title: 'Category Key',
              type: 'string',
              options: {
                list: [
                  { title: 'Stories of Craft', value: 'craft' },
                  { title: 'Champion Interviews', value: 'interviews' },
                  { title: 'News', value: 'news' },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Section Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'subtitleHtml',
              title: 'Subtitle (HTML)',
              type: 'text',
              rows: 3,
            }),
            defineField({
              name: 'viewAllHref',
              title: 'View all link',
              type: 'url',
              validation: (Rule) => Rule.required().uri({ allowRelative: true }),
            }),
            defineField({
              name: 'items',
              title: 'Articles',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'reference',
                  to: [{ type: 'article' }],
                }),
              ],
              validation: (Rule) => Rule.min(1).warning('Add at least one article'),
            }),
          ],
        }),
      ],
      validation: (Rule) => Rule.min(1).warning('Add at least one section'),
    }),
    defineField({
      name: 'defaults',
      title: 'Fallback Defaults',
      type: 'object',
      fields: [
        defineField({ name: 'missingArticleTitle', title: 'Missing Article Title', type: 'string' }),
        defineField({ name: 'missingArticleBody', title: 'Missing Article Body', type: 'text' }),
        defineField({ name: 'missingArticleCtaLabel', title: 'Missing Article CTA Label', type: 'string' }),
        defineField({ name: 'missingArticleCtaHref', title: 'Missing Article CTA Href', type: 'string' }),
        defineField({ name: 'fallbackSeoDescription', title: 'Fallback SEO Description', type: 'text' }),
      ],
    }),
  ],
})
