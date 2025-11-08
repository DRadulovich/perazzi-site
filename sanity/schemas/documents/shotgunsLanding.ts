import {defineField, defineType} from 'sanity'
import {TargetIcon} from '@sanity/icons'

export const shotgunsLanding = defineType({
  name: 'shotgunsLanding',
  title: 'Shotguns Landing',
  icon: TargetIcon,
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
    defineField({
      name: 'triggerExplainer',
      title: 'Trigger Explainer',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'copy', type: 'blockContent' }),
        defineField({ name: 'diagram', type: 'imageWithMeta' }),
        defineField({
          name: 'links',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'label', type: 'string', validation: (Rule) => Rule.required() }),
                defineField({ name: 'href', type: 'url', validation: (Rule) => Rule.required() }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'teasers',
      title: 'Teasers',
      type: 'object',
      fields: [
        defineField({ name: 'engraving', type: 'imageWithMeta' }),
        defineField({ name: 'wood', type: 'imageWithMeta' }),
      ],
    }),
    defineField({
      name: 'disciplineHubs',
      title: 'Discipline Hubs',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'key', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'summary', type: 'text' }),
            defineField({ name: 'championImage', type: 'imageWithMeta' }),
          ],
          preview: { select: { title: 'title', media: 'championImage.asset' } },
        },
      ],
    }),
  ],
})
