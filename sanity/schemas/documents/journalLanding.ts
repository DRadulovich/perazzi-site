import {defineField, defineType} from 'sanity'
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
