import {defineField, defineType} from 'sanity'

export const heritageSection = defineType({
  name: 'heritageSection',
  title: 'Heritage Section',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
    }),
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'body', type: 'text', rows: 4 }),
  ],
})
