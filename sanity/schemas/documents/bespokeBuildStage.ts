import {defineField, defineType} from 'sanity'

export const bespokeBuildStage = defineType({
  name: 'bespokeBuildStage',
  title: 'Bespoke Build Stage',
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
