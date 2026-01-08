import {defineField, defineType} from 'sanity'

export const fullScreenChatPage = defineType({
  name: 'fullScreenChatPage',
  title: 'Full Screen Chat Page',
  type: 'document',
  fields: [
    defineField({
      name: 'header',
      title: 'Header',
      type: 'object',
      fields: [
        defineField({ name: 'label', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'description', type: 'text', rows: 3 }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'description', type: 'text' }),
      ],
    }),
  ],
})
