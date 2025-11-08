import {defineField, defineType} from 'sanity'
import {LaunchIcon} from '@sanity/icons'

export const experienceHome = defineType({
  name: 'experienceHome',
  title: 'Experience Home',
  icon: LaunchIcon,
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
      name: 'picker',
      title: 'Experience Picker',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'summary', type: 'text' }),
            defineField({ name: 'href', type: 'url' }),
            defineField({ name: 'media', type: 'imageWithMeta' }),
          ],
          preview: { select: { title: 'title', media: 'media.asset' } },
        },
      ],
    }),
    defineField({
      name: 'mosaic',
      title: 'Mosaic',
      type: 'array',
      of: [{ type: 'imageWithMeta' }],
    }),
  ],
})
