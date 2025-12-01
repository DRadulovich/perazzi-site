import {defineField, defineType} from 'sanity'
import {SparkleIcon} from '@sanity/icons'

export const bespokeHome = defineType({
  name: 'bespokeHome',
  title: 'Bespoke Home',
  icon: SparkleIcon,
  type: 'document',
  fieldsets: [
    {name: 'hero', title: 'Hero overlay panel', options: {collapsible: true, collapsed: false}},
    {name: 'journey', title: 'Fitting journey (timeline band)', options: {collapsible: true, collapsed: false}},
    {name: 'guide', title: 'Concierge guide (narrative cards)', options: {collapsible: true, collapsed: true}},
    {name: 'cinematic', title: 'Cinematic strips', options: {collapsible: true, collapsed: true}},
    {name: 'experts', title: 'Atelier experts', options: {collapsible: true, collapsed: true}},
    {name: 'booking', title: 'Booking rail & options', options: {collapsible: true, collapsed: true}},
    {name: 'assurance', title: 'Assurance / proof overlay', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fieldset: 'hero',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'intro', type: 'text', rows: 3 }),
        defineField({ name: 'media', type: 'imageWithMeta', validation: (Rule) => Rule.required() }),
      ],
    }),
    defineField({
      name: 'stepsIntro',
      title: 'Steps Intro (Journey Block)',
      type: 'object',
      fieldset: 'journey',
      options: {columns: 2},
      fields: [
        defineField({name: 'heading', title: 'Intro Heading', type: 'string'}),
        defineField({name: 'subheading', title: 'Intro Subheading', type: 'text', rows: 3}),
        defineField({name: 'ctaLabel', title: 'Primary CTA Label', type: 'string'}),
        defineField({ name: 'backgroundImage', title: 'Background Image', type: 'imageWithMeta' }),
      ],
    }),
    defineField({
      name: 'steps',
      title: 'Fitting Steps',
      type: 'array',
      fieldset: 'journey',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'bodyHtml', type: 'text' }),
            defineField({ name: 'media', type: 'imageWithMeta' }),
          ],
          preview: { select: { title: 'title', media: 'media.asset' } },
        },
      ],
    }),
    defineField({
      name: 'bespokeGuide',
      title: 'Bespoke Guide Block',
      type: 'object',
      fieldset: 'guide',
      options: {columns: 2},
      fields: [
        defineField({name: 'heading', title: 'Section Heading', type: 'string'}),
        defineField({name: 'body', title: 'Body Paragraph', type: 'text', rows: 3}),
        defineField({name: 'chatLabel', title: 'Chat Button Label', type: 'string'}),
        defineField({name: 'chatPrompt', title: 'Chat Payload', type: 'text', rows: 3}),
        defineField({name: 'linkLabel', title: 'Link Label', type: 'string'}),
        defineField({name: 'linkHref', title: 'Link Href', type: 'string'}),
        defineField({
          name: 'listItems',
          title: 'Three Things List',
          type: 'array',
          of: [{type: 'text'}],
        }),
      ],
    }),
    defineField({
      name: 'cinematicStrips',
      title: 'Cinematic Image Strips',
      type: 'array',
      fieldset: 'cinematic',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'image', title: 'Image', type: 'imageWithMeta' }),
            defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'expertsIntro',
      title: 'Experts Section Intro',
      type: 'object',
      fieldset: 'experts',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
      ],
    }),
    defineField({
      name: 'experts',
      title: 'Experts',
      type: 'array',
      fieldset: 'experts',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'role', type: 'string' }),
            defineField({ name: 'bioShort', type: 'text' }),
            defineField({ name: 'headshot', type: 'imageWithMeta' }),
            defineField({ name: 'quote', type: 'text' }),
          ],
          preview: { select: { title: 'name', subtitle: 'role', media: 'headshot.asset' } },
        },
      ],
    }),
    defineField({
      name: 'bookingSection',
      title: 'Booking Options Section',
      type: 'object',
      fieldset: 'booking',
      fields: [
        defineField({name: 'heading', title: 'Section Heading', type: 'string'}),
        defineField({
          name: 'options',
          title: 'Booking Options',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({name: 'title', title: 'Title', type: 'string'}),
                defineField({name: 'duration', title: 'Duration', type: 'string'}),
                defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
                defineField({name: 'href', title: 'Link Href', type: 'string'}),
              ],
            },
          ],
        }),
        defineField({name: 'whatToExpectHeading', title: '"What to expect" Heading', type: 'string'}),
        defineField({
          name: 'whatToExpectItems',
          title: '"What to expect" Items',
          type: 'array',
          of: [{type: 'text'}],
        }),
        defineField({name: 'note', title: 'Note Text', type: 'text', rows: 3}),
        defineField({ name: 'backgroundImage', title: 'Background Image', type: 'imageWithMeta' }),
      ],
    }),
    defineField({ name: 'assuranceImage', title: 'Assurance Image', type: 'imageWithMeta', fieldset: 'assurance' }),
    defineField({
      name: 'assuranceContent',
      title: 'Assurance Content',
      type: 'object',
      fieldset: 'assurance',
      fields: [
        defineField({name: 'heading', title: 'Section Heading', type: 'string'}),
        defineField({name: 'label', title: 'Label / Eyebrow', type: 'string'}),
        defineField({name: 'body', title: 'Body Text', type: 'text', rows: 4}),
        defineField({name: 'quote', title: 'Quote Text', type: 'text', rows: 3}),
      ],
    }),
  ],
})
