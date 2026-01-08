import {defineField, defineType} from 'sanity'

export const shotgunsGradesPage = defineType({
  name: 'shotgunsGradesPage',
  title: 'Shotguns Grades Page',
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
    defineField({ name: 'provenanceHtml', title: 'Provenance (HTML)', type: 'text', rows: 6 }),
    defineField({
      name: 'processNote',
      title: 'Process Note',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'html', title: 'HTML', type: 'text', rows: 6 }),
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
