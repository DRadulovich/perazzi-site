import {defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const heritageHome = defineType({
  name: 'heritageHome',
  title: 'Heritage Home',
  icon: BookIcon,
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
      name: 'photoEssay',
      title: 'Factory Photo Essay',
      type: 'array',
      of: [{ type: 'imageWithMeta' }],
    }),
    defineField({
      name: 'oralHistories',
      title: 'Oral Histories',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'quote', type: 'text' }),
            defineField({ name: 'attribution', type: 'string' }),
            defineField({ name: 'image', type: 'imageWithMeta' }),
          ],
        },
      ],
    }),
  ],
})
