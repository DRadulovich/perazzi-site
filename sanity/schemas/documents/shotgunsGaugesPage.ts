import {defineField, defineType} from 'sanity'

export const shotgunsGaugesPage = defineType({
  name: 'shotgunsGaugesPage',
  title: 'Shotguns Gauges Page',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'subheading', type: 'text', rows: 3 }),
        defineField({ name: 'background', type: 'imageWithMeta' }),
      ],
    }),
    defineField({ name: 'editorialHtml', title: 'Editorial (HTML)', type: 'text', rows: 6 }),
    defineField({ name: 'sidebarTitle', title: 'Sidebar Title', type: 'string' }),
    defineField({ name: 'sidebarHtml', title: 'Sidebar (HTML)', type: 'text', rows: 6 }),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'q', title: 'Question', type: 'string' }),
            defineField({ name: 'a', title: 'Answer', type: 'text' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'finalCta',
      title: 'Final CTA',
      type: 'object',
      fields: [
        defineField({ name: 'text', title: 'Body Text', type: 'text' }),
        defineField({
          name: 'primary',
          title: 'Primary Button',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
        defineField({
          name: 'secondary',
          title: 'Secondary Button',
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        }),
      ],
    }),
  ],
})
