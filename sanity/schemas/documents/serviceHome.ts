import {defineField, defineType} from 'sanity'
import {WrenchIcon} from '@sanity/icons'

export const serviceHome = defineType({
  name: 'serviceHome',
  title: 'Service Home',
  icon: WrenchIcon,
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
  ],
})
