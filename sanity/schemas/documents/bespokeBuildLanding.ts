import {defineField, defineType} from 'sanity'

export const bespokeBuildLanding = defineType({
  name: 'bespokeBuildLanding',
  title: 'Bespoke Build Landing',
  type: 'document',
  fields: [
    defineField({ name: 'kicker', type: 'string' }),
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'body', type: 'text', rows: 4 }),
  ],
})
