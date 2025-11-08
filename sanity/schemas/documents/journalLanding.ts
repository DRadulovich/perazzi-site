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
  ],
})
