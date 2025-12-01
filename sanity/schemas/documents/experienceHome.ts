import {defineField, defineType} from 'sanity'
import {LaunchIcon} from '@sanity/icons'

export const experienceHome = defineType({
  name: 'experienceHome',
  title: 'Experience Home',
  icon: LaunchIcon,
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
      name: 'picker',
      title: 'Experience Picker',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'summary', type: 'text' }),
            defineField({ name: 'href', type: 'url' }),
            defineField({ name: 'media', type: 'imageWithMeta' }),
          ],
          preview: { select: { title: 'title', media: 'media.asset' } },
        },
      ],
    }),
    defineField({
      name: 'pickerUi',
      title: 'Experience Picker – UI',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'subheading', title: 'Section Subheading', type: 'text' }),
        defineField({ name: 'microLabel', title: 'Micro-label', type: 'string' }),
        defineField({ name: 'backgroundImage', title: 'Background Image', type: 'image' }),
        defineField({ name: 'defaultCtaLabel', title: 'Default Card CTA Label', type: 'string' }),
        defineField({ name: 'defaultCtaHref', title: 'Default Card CTA Href', type: 'string' }),
      ],
    }),
    defineField({
      name: 'faqSection',
      title: 'FAQ Section',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'lead', title: 'Lead Text', type: 'string' }),
        defineField({
          name: 'items',
          title: 'FAQ Items',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'question', title: 'Question', type: 'string' }),
                defineField({ name: 'answerHtml', title: 'Answer (HTML)', type: 'text' }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'visitPlanningBlock',
      title: 'Visit Planning Block',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro Paragraph', type: 'text' }),
        defineField({
          name: 'bullets',
          title: 'Concierge Bullets',
          type: 'array',
          of: [{ type: 'text' }],
        }),
        defineField({ name: 'closing', title: 'Closing Paragraph', type: 'text' }),
        defineField({ name: 'chatLabel', title: 'Chat Button Label', type: 'string' }),
        defineField({ name: 'chatPrompt', title: 'Chat Payload', type: 'text' }),
        defineField({ name: 'linkLabel', title: 'Primary Link Label', type: 'string' }),
        defineField({ name: 'linkHref', title: 'Primary Link Href', type: 'string' }),
      ],
    }),
    defineField({
      name: 'fittingGuidanceBlock',
      title: 'Fitting Guidance Block',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro Paragraph', type: 'text' }),
        defineField({
          name: 'bullets',
          title: 'Concierge Bullets',
          type: 'array',
          of: [{ type: 'text' }],
        }),
        defineField({ name: 'closing', title: 'Closing Paragraph', type: 'text' }),
        defineField({ name: 'chatLabel', title: 'Chat Button Label', type: 'string' }),
        defineField({ name: 'chatPrompt', title: 'Chat Payload', type: 'text' }),
        defineField({ name: 'linkLabel', title: 'Primary Link Label', type: 'string' }),
        defineField({ name: 'linkHref', title: 'Primary Link Href', type: 'string' }),
      ],
    }),
    defineField({
      name: 'travelGuideBlock',
      title: 'Travel Guide CTA Block',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro Paragraph', type: 'text' }),
        defineField({
          name: 'bullets',
          title: 'Concierge Bullets',
          type: 'array',
          of: [{ type: 'text' }],
        }),
        defineField({ name: 'closing', title: 'Closing Paragraph', type: 'text' }),
        defineField({ name: 'chatLabel', title: 'Chat Button Label', type: 'string' }),
        defineField({ name: 'chatPrompt', title: 'Chat Payload', type: 'text' }),
        defineField({ name: 'linkLabel', title: 'Primary Link Label', type: 'string' }),
        defineField({ name: 'linkHref', title: 'Primary Link Href', type: 'string' }),
      ],
    }),
    defineField({
      name: 'visitFactorySection',
      title: 'Visit Botticino / Factory Section',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'subheading', title: 'Section Subheading', type: 'string' }),
        defineField({ name: 'backgroundImage', title: 'Background Image', type: 'image' }),
        defineField({ name: 'introHtml', title: 'Intro (HTML)', type: 'text' }),
        defineField({ name: 'locationName', title: 'Location Name', type: 'string' }),
        defineField({ name: 'address', title: 'Address', type: 'text' }),
        defineField({ name: 'hours', title: 'Hours', type: 'text' }),
        defineField({ name: 'notes', title: 'Notes', type: 'text' }),
        defineField({ name: 'mapEmbedHtml', title: 'Map Embed (HTML)', type: 'text' }),
        defineField({
          name: 'whatToExpect',
          title: '"What to expect" Content',
          type: 'array',
          of: [{ type: 'text' }],
        }),
        defineField({ name: 'ctaLabel', title: 'CTA Label', type: 'string' }),
        defineField({ name: 'ctaHref', title: 'CTA Href', type: 'string' }),
      ],
    }),
    defineField({
      name: 'bookingSection',
      title: 'Booking Options & Scheduler',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'subheading', title: 'Section Subheading', type: 'text' }),
        defineField({
          name: 'options',
          title: 'Fitting Options',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'durationLabel', title: 'Duration Label', type: 'string' }),
                defineField({ name: 'descriptionHtml', title: 'Description (HTML)', type: 'text' }),
                defineField({ name: 'href', title: 'Link Href', type: 'string' }),
              ],
            },
          ],
        }),
        defineField({ name: 'optionCtaLabel', title: 'Option CTA Label', type: 'string' }),
        defineField({
          name: 'scheduler',
          title: 'Scheduler Settings',
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Scheduler Title', type: 'string' }),
            defineField({ name: 'helperText', title: 'Helper Text', type: 'text' }),
            defineField({ name: 'toggleOpenLabel', title: 'Toggle Open Label', type: 'string' }),
            defineField({ name: 'toggleCloseLabel', title: 'Toggle Close Label', type: 'string' }),
            defineField({ name: 'iframeSrc', title: 'Iframe URL', type: 'url' }),
            defineField({ name: 'iframeTitle', title: 'Iframe Title', type: 'string' }),
            defineField({ name: 'fallbackHref', title: 'Fallback Link Href', type: 'url' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'travelNetworkUi',
      title: 'Travel Network – UI',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Section Title', type: 'string' }),
        defineField({ name: 'lead', title: 'Lead Text', type: 'string' }),
        defineField({ name: 'supporting', title: 'Supporting Sentence', type: 'text' }),
        defineField({ name: 'scheduleTabLabel', title: 'Schedule Tab Label', type: 'string' }),
        defineField({ name: 'dealersTabLabel', title: 'Dealers Tab Label', type: 'string' }),
        defineField({ name: 'emptyScheduleText', title: 'Empty-state Text (Schedule)', type: 'string' }),
        defineField({ name: 'emptyDealersText', title: 'Empty-state Text (Dealers)', type: 'string' }),
        defineField({ name: 'backgroundImage', title: 'Background Image', type: 'image' }),
      ],
    }),
    defineField({
      name: 'mosaicUi',
      title: 'Mosaic Gallery – UI',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', title: 'Section Eyebrow', type: 'string' }),
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
      ],
    }),
    defineField({
      name: 'mosaic',
      title: 'Mosaic',
      type: 'array',
      of: [{ type: 'imageWithMeta' }],
    }),
  ],
})
