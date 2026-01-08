import {defineField, defineType} from 'sanity'

export const buildJourneyLanding = defineType({
  name: 'buildJourneyLanding',
  title: 'Build Journey Landing',
  type: 'document',
  fields: [
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'imageWithMeta' }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'object',
      fields: [
        defineField({ name: 'label', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'body', type: 'text', rows: 4 }),
      ],
    }),
  ],
})
