import {defineField, defineType} from 'sanity'
import {TargetIcon} from '@sanity/icons'

export const shotgunsLanding = defineType({
  name: 'shotgunsLanding',
  title: 'Shotguns Landing',
  icon: TargetIcon,
  type: 'document',
  fieldsets: [
    {name: 'hero', title: 'Hero overlay panel', options: {collapsible: true, collapsed: false}},
    {name: 'platforms', title: 'Platform rail (Field)', options: {collapsible: true, collapsed: true}},
    {
      name: 'disciplines',
      title: 'Discipline advisory (narrative cards)',
      options: {collapsible: true, collapsed: true},
    },
    {name: 'gauges', title: 'Gauge advisory (utility)', options: {collapsible: true, collapsed: true}},
    {name: 'triggers', title: 'Trigger explainer (workshop)', options: {collapsible: true, collapsed: true}},
    {name: 'engraving', title: 'Engraving gallery', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fieldset: 'hero',
      fields: [
        defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
        defineField({ name: 'subheading', type: 'text', rows: 3 }),
        defineField({ name: 'background', type: 'imageWithMeta', validation: (Rule) => Rule.required() }),
      ],
    }),
    defineField({
      name: 'platformGridUi',
      title: 'Platform Grid – UI Copy',
      type: 'object',
      fieldset: 'platforms',
      options: {columns: 2},
      fields: [
        defineField({name: 'heading', title: 'Section Heading', type: 'string'}),
        defineField({name: 'subheading', title: 'Section Subheading', type: 'text', rows: 3}),
        defineField({
          name: 'backgroundImage',
          title: 'Background Image',
          type: 'object',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'imageWithMeta'}),
            defineField({
              name: 'path',
              title: 'Static asset path',
              type: 'string',
              description: 'Use a relative path such as /redesign-photos/shotguns/... if not uploading an image.',
            }),
          ],
          options: {columns: 2},
        }),
        defineField({
          name: 'chatLabelTemplate',
          title: 'Chat Button Label Template',
          type: 'string',
          description: 'Use {platformName} as a token that will be replaced with the platform name.',
        }),
        defineField({
          name: 'chatPayloadTemplate',
          title: 'Chat Payload Template',
          type: 'text',
          rows: 3,
          description: 'Template for concierge payload. At minimum supports {platformName}.',
        }),
        defineField({
          name: 'cardFooterTemplate',
          title: 'Card Footer Template',
          type: 'string',
          description: 'Use {platformName} as a token that will be replaced with the platform name.',
        }),
      ],
    }),
    defineField({
      name: 'triggerExplainer',
      title: 'Trigger Explainer',
      type: 'object',
      fieldset: 'triggers',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'subheading', title: 'Subheading', type: 'string' }),
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
        defineField({
          name: 'backgroundImage',
          title: 'Background Image',
          type: 'object',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'imageWithMeta'}),
            defineField({name: 'path', title: 'Static asset path', type: 'string'}),
          ],
          options: {columns: 2},
        }),
      ],
    }),
    defineField({
      name: 'teasers',
      title: 'Teasers',
      type: 'object',
      fieldset: 'engraving',
      fields: [
        defineField({ name: 'engraving', type: 'imageWithMeta' }),
        defineField({ name: 'wood', type: 'imageWithMeta' }),
      ],
    }),
    defineField({
      name: 'disciplineFitAdvisory',
      title: 'Discipline Fit Advisory',
      type: 'object',
      fieldset: 'disciplines',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({
          name: 'paragraphs',
          title: 'Body Paragraphs',
          type: 'array',
          of: [{type: 'text'}],
        }),
        defineField({name: 'chatPrompt', title: 'Chat Payload', type: 'text', rows: 3}),
        defineField({
          name: 'bullets',
          title: 'Discipline Bullets',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({name: 'code', title: 'Code', type: 'string'}),
                defineField({name: 'label', title: 'Label', type: 'string'}),
                defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'disciplineRailUi',
      title: 'Discipline Rail – UI Copy',
      type: 'object',
      fieldset: 'disciplines',
      options: {columns: 2},
      fields: [
        defineField({name: 'heading', title: 'Section Heading', type: 'string'}),
        defineField({name: 'subheading', title: 'Section Subheading', type: 'text', rows: 3}),
        defineField({
          name: 'backgroundImage',
          title: 'Background Image',
          type: 'object',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'imageWithMeta'}),
            defineField({name: 'path', title: 'Static asset path', type: 'string'}),
          ],
          options: {columns: 2},
        }),
      ],
    }),
    defineField({
      name: 'gaugeSelectionAdvisory',
      title: 'Gauge Selection Advisory',
      type: 'object',
      fieldset: 'gauges',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'intro', title: 'Intro Paragraph', type: 'text', rows: 3}),
        defineField({name: 'chatLabel', title: 'Chat Button Label', type: 'string'}),
        defineField({name: 'chatPrompt', title: 'Chat Payload', type: 'text', rows: 3}),
        defineField({name: 'linkLabel', title: 'Link Label', type: 'string'}),
        defineField({name: 'linkHref', title: 'Link Href', type: 'string'}),
        defineField({
          name: 'bullets',
          title: 'Teaser Bullets',
          type: 'array',
          of: [{type: 'text'}],
        }),
        defineField({name: 'closing', title: 'Closing Paragraph', type: 'text', rows: 3}),
      ],
    }),
    defineField({
      name: 'triggerChoiceAdvisory',
      title: 'Trigger Choice Advisory',
      type: 'object',
      fieldset: 'triggers',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'intro', title: 'Intro Paragraph', type: 'text', rows: 3}),
        defineField({name: 'chatLabel', title: 'Chat Button Label', type: 'string'}),
        defineField({name: 'chatPrompt', title: 'Chat Payload', type: 'text', rows: 3}),
        defineField({name: 'linkLabel', title: 'Link Label', type: 'string'}),
        defineField({name: 'linkHref', title: 'Link Href', type: 'string'}),
        defineField({
          name: 'bullets',
          title: 'Comparison Bullets',
          type: 'array',
          of: [{type: 'text'}],
        }),
        defineField({name: 'closing', title: 'Closing Paragraph', type: 'text', rows: 3}),
      ],
    }),
    defineField({
      name: 'engravingCarouselUi',
      title: 'Engraving Carousel – UI Copy',
      type: 'object',
      fieldset: 'engraving',
      options: {columns: 2},
      fields: [
        defineField({name: 'heading', title: 'Section Heading', type: 'string'}),
        defineField({name: 'subheading', title: 'Section Subheading', type: 'text', rows: 3}),
        defineField({
          name: 'backgroundImage',
          title: 'Background Image',
          type: 'object',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'imageWithMeta'}),
            defineField({name: 'path', title: 'Static asset path', type: 'string'}),
          ],
          options: {columns: 2},
        }),
        defineField({name: 'ctaLabel', title: 'CTA Label', type: 'string'}),
        defineField({
          name: 'categoryLabels',
          title: 'Category Labels',
          type: 'array',
          of: [{type: 'string'}],
          description: 'Order should match the order used in the carousel.',
        }),
      ],
    }),
    defineField({
      name: 'disciplineHubs',
      title: 'Discipline Hubs',
      type: 'array',
      fieldset: 'disciplines',
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
