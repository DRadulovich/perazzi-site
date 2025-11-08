import {defineType, defineField} from 'sanity'
import {HomeIcon} from '@sanity/icons'

export const homeSingleton = defineType({
  name: 'homeSingleton',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'background',
          title: 'Background Image',
          type: 'imageWithMeta',
          validation: (Rule) => Rule.required(),
        }),
        defineField({name: 'tagline', title: 'Tagline (optional)', type: 'string'}),
        defineField({name: 'subheading', title: 'Subheading (optional)', type: 'text', rows: 2}),
      ],
    }),

    defineField({
      name: 'timelineStages',
      title: 'Timeline Stages',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'stage',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
            defineField({
              name: 'media',
              title: 'Media',
              type: 'imageWithMeta',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {select: {title: 'title', media: 'media.asset'}},
        },
      ],
      validation: (Rule) => Rule.min(1).warning('Add at least one stage'),
    }),

    // Option A: reference a Champion doc (recommended)
    defineField({
      name: 'featuredChampion',
      title: 'Featured Champion (Marquee)',
      type: 'reference',
      to: [{type: 'champion'}],
      description: 'Pick a Champion to feature in the marquee.',
    }),

    // Option B: inline marquee if you don’t want a Champion yet
    defineField({
      name: 'marqueeInline',
      title: 'Inline Marquee (use if no Champion reference)',
      type: 'object',
      fields: [
        defineField({name: 'quote', title: 'Quote', type: 'text', rows: 2}),
        defineField({name: 'image', title: 'Image', type: 'imageWithMeta'}),
        defineField({name: 'credit', title: 'Attribution (optional)', type: 'string'}),
      ],
    }),

    defineField({
      name: 'finale',
      title: 'Final CTA',
      type: 'object',
      fields: [
        defineField({name: 'text', title: 'Body', type: 'text', rows: 3}),
        defineField({
          name: 'ctaPrimary',
          title: 'Primary CTA',
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string'}),
            defineField({name: 'href', type: 'url'}),
          ],
        }),
        defineField({
          name: 'ctaSecondary',
          title: 'Secondary CTA',
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string'}),
            defineField({name: 'href', type: 'url'}),
          ],
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Home'}
    },
  },
})
