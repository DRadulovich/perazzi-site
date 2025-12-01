import {defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const heritageEraConfig = defineType({
  name: 'heritageEraConfig',
  title: 'Heritage Era Config',
  type: 'object',
  fields: [
    defineField({ name: 'id', title: 'ID', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'yearRangeLabel', title: 'Year Range Label', type: 'string' }),
    defineField({ name: 'startYear', title: 'Start Year', type: 'number' }),
    defineField({ name: 'endYear', title: 'End Year', type: 'number' }),
    defineField({ name: 'backgroundImage', title: 'Background Image', type: 'image' }),
    defineField({ name: 'overlayFrom', title: 'Overlay From', type: 'string' }),
    defineField({ name: 'overlayTo', title: 'Overlay To', type: 'string' }),
  ],
});

export const heritageHome = defineType({
  name: 'heritageHome',
  title: 'Heritage Home',
  icon: BookIcon,
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
      name: 'heritageIntro',
      title: 'Perazzi Heritage Intro Block',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Section Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({
          name: 'paragraphs',
          title: 'Intro Paragraphs',
          type: 'array',
          of: [{ type: 'text' }],
        }),
        defineField({ name: 'backgroundImage', title: 'Background Image', type: 'image' }),
      ],
    }),
    defineField({
      name: 'erasConfig',
      title: 'Heritage Eras Config',
      type: 'array',
      of: [{ type: 'heritageEraConfig' }],
    }),
    defineField({
      name: 'workshopCta',
      title: 'Ask the Workshop CTA',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro Paragraph', type: 'text' }),
        defineField({
          name: 'bullets',
          title: 'Bullets',
          type: 'array',
          of: [{ type: 'text' }],
        }),
        defineField({ name: 'closing', title: 'Closing Paragraph', type: 'text' }),
        defineField({ name: 'primaryLabel', title: 'Primary Button Label', type: 'string' }),
        defineField({ name: 'primaryHref', title: 'Primary Button Href', type: 'string' }),
        defineField({ name: 'secondaryLabel', title: 'Secondary Button Label', type: 'string' }),
        defineField({ name: 'secondaryHref', title: 'Secondary Button Href', type: 'string' }),
      ],
    }),
    defineField({
      name: 'serialLookupUi',
      title: 'Serial Lookup – UI Text',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'subheading', title: 'Subheading', type: 'string' }),
        defineField({ name: 'instructions', title: 'Instructions Text', type: 'text' }),
        defineField({ name: 'primaryButtonLabel', title: 'Primary Button Label', type: 'string' }),
        defineField({ name: 'emptyStateText', title: 'Empty-state Text', type: 'text' }),
        defineField({ name: 'backgroundImage', title: 'Background Image', type: 'image' }),
      ],
    }),
    defineField({
      name: 'championsIntro',
      title: 'Champions Intro Block',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro Paragraph', type: 'text' }),
        defineField({
          name: 'bullets',
          title: 'Bullets',
          type: 'array',
          of: [{ type: 'text' }],
        }),
        defineField({ name: 'closing', title: 'Closing Paragraph', type: 'text' }),
        defineField({ name: 'chatLabel', title: 'Chat Button Label', type: 'string' }),
        defineField({ name: 'chatPrompt', title: 'Chat Payload', type: 'text' }),
      ],
    }),
    defineField({
      name: 'championsGalleryUi',
      title: 'Champions Gallery – UI',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Section Title', type: 'string' }),
        defineField({ name: 'subheading', title: 'Section Subheading', type: 'string' }),
        defineField({ name: 'backgroundImage', title: 'Background Image', type: 'image' }),
        defineField({ name: 'championsLabel', title: '"Champions" Label', type: 'string' }),
        defineField({ name: 'cardCtaLabel', title: 'Card CTA Label', type: 'string' }),
      ],
    }),
    defineField({
      name: 'factoryIntroBlock',
      title: 'Factory Intro Block',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Intro Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro Paragraph', type: 'text' }),
        defineField({
          name: 'bullets',
          title: 'Bullets',
          type: 'array',
          of: [{ type: 'text' }],
        }),
        defineField({ name: 'closing', title: 'Closing Paragraph', type: 'text' }),
        defineField({ name: 'chatLabel', title: 'Chat Button Label', type: 'string' }),
        defineField({ name: 'chatPrompt', title: 'Chat Payload', type: 'text' }),
      ],
    }),
    defineField({
      name: 'factoryEssayUi',
      title: 'Factory Essay – UI',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Section Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
      ],
    }),
    defineField({ name: 'factoryIntroBody', title: 'Factory Intro Body', type: 'text' }),
    defineField({
      name: 'oralHistoriesUi',
      title: 'Oral Histories – UI',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Section Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'readLabel', title: '"Read transcript" Label', type: 'string' }),
        defineField({ name: 'hideLabel', title: '"Hide transcript" Label', type: 'string' }),
      ],
    }),
    defineField({
      name: 'relatedSection',
      title: 'Related Reading Section',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({
          name: 'items',
          title: 'Related Items',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'slug', title: 'Slug', type: 'string' }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'photoEssay',
      title: 'Factory Photo Essay',
      type: 'array',
      of: [{ type: 'imageWithMeta' }],
    }),
    defineField({
      name: 'oralHistories',
      title: 'Oral Histories',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'quote', type: 'text' }),
            defineField({ name: 'attribution', type: 'string' }),
            defineField({ name: 'image', type: 'imageWithMeta' }),
          ],
        },
      ],
    }),
  ],
})
