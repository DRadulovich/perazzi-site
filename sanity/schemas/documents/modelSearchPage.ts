import {defineField, defineType} from 'sanity'

export const modelSearchPage = defineType({
  name: 'modelSearchPage',
  title: 'Model Search Page',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({ name: 'label', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'description', type: 'text', rows: 3 }),
        defineField({ name: 'image', type: 'imageWithMeta' }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'description', type: 'text' }),
        defineField({ name: 'image', type: 'image', options: {hotspot: true} }),
      ],
    }),
  ],
})
