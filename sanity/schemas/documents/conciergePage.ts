import {defineField, defineType} from 'sanity'

export const conciergePage = defineType({
  name: 'conciergePage',
  title: 'Concierge Page',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'subheading', type: 'text', rows: 3 }),
        defineField({ name: 'background', type: 'imageWithMeta' }),
        defineField({
          name: 'bullets',
          title: 'Bullets',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'title', type: 'string' }),
                defineField({ name: 'body', type: 'text', rows: 3 }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'drawerUi',
      title: 'Drawer UI Labels',
      type: 'object',
      fields: [
        defineField({ name: 'panelLabel', title: 'Panel Label', type: 'string' }),
        defineField({ name: 'panelTitle', title: 'Panel Title', type: 'string' }),
        defineField({ name: 'loadingMessage', title: 'Loading Message', type: 'string' }),
        defineField({ name: 'emptyMessage', title: 'Empty Message', type: 'string' }),
        defineField({ name: 'viewMoreLabel', title: 'View More Label', type: 'string' }),
        defineField({ name: 'closeLabel', title: 'Close Label', type: 'string' }),
      ],
    }),
  ],
})
