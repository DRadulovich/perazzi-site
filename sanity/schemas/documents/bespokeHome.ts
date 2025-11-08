import {defineField, defineType} from 'sanity'
import {SparkleIcon} from '@sanity/icons'

export const bespokeHome = defineType({
  name: 'bespokeHome',
  title: 'Bespoke Home',
  icon: SparkleIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'intro', type: 'text', rows: 3 }),
        defineField({ name: 'media', type: 'imageWithMeta', validation: (Rule) => Rule.required() }),
      ],
    }),
    defineField({
      name: 'steps',
      title: 'Fitting Steps',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'bodyHtml', type: 'text' }),
            defineField({ name: 'media', type: 'imageWithMeta' }),
          ],
          preview: { select: { title: 'title', media: 'media.asset' } },
        },
      ],
    }),
    defineField({
      name: 'experts',
      title: 'Experts',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'role', type: 'string' }),
            defineField({ name: 'bioShort', type: 'text' }),
            defineField({ name: 'headshot', type: 'imageWithMeta' }),
            defineField({ name: 'quote', type: 'text' }),
          ],
          preview: { select: { title: 'name', subtitle: 'role', media: 'headshot.asset' } },
        },
      ],
    }),
    defineField({ name: 'assuranceImage', title: 'Assurance Image', type: 'imageWithMeta' }),
  ],
})
