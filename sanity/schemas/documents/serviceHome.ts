import {defineField, defineType} from 'sanity'
import {WrenchIcon} from '@sanity/icons'

export const serviceHome = defineType({
  name: 'serviceHome',
  title: 'Service Home',
  icon: WrenchIcon,
  type: 'document',
  fieldsets: [
    {name: 'hero', title: 'Hero overlay panel', options: {collapsible: true, collapsed: false}},
    {name: 'overview', title: 'Service overview (matte panel)', options: {collapsible: true, collapsed: false}},
    {name: 'guidance', title: 'Guidance & prep (utility cards)', options: {collapsible: true, collapsed: true}},
    {name: 'network', title: 'Network finder', options: {collapsible: true, collapsed: true}},
    {name: 'maintenance', title: 'Maintenance & repairs', options: {collapsible: true, collapsed: true}},
    {name: 'parts', title: 'Parts editorial', options: {collapsible: true, collapsed: true}},
    {name: 'integrity', title: 'Integrity advisory', options: {collapsible: true, collapsed: true}},
    {name: 'requests', title: 'Service / parts requests', options: {collapsible: true, collapsed: true}},
    {name: 'guides', title: 'Guides & downloads', options: {collapsible: true, collapsed: true}},
    {name: 'faq', title: 'Service FAQ', options: {collapsible: true, collapsed: true}},
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
      name: 'overviewSection',
      title: 'Service Overview Section',
      type: 'object',
      fieldset: 'overview',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'subheading', title: 'Subheading', type: 'text' }),
        defineField({ name: 'introHtml', title: 'Intro (HTML)', type: 'text' }),
        defineField({ name: 'checksHeading', title: 'Checks Heading', type: 'string' }),
        defineField({
          name: 'checks',
          title: 'Standard Checks',
          type: 'array',
          of: [{ type: 'text' }],
        }),
      ],
    }),
    defineField({
      name: 'serviceGuidanceBlock',
      title: 'Service Guidance Block',
      type: 'object',
      fieldset: 'guidance',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'body', title: 'Body Copy', type: 'text' }),
        defineField({ name: 'chatLabel', title: 'Chat Button Label', type: 'string' }),
        defineField({ name: 'chatPrompt', title: 'Chat Payload', type: 'text' }),
      ],
    }),
    defineField({
      name: 'shippingPrepBlock',
      title: 'Shipping Prep Block',
      type: 'object',
      fieldset: 'guidance',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
        defineField({ name: 'body', title: 'Body Copy', type: 'text' }),
        defineField({ name: 'chatLabel', title: 'Chat Button Label', type: 'string' }),
        defineField({ name: 'chatPrompt', title: 'Chat Payload', type: 'text' }),
      ],
    }),
    defineField({
      name: 'networkFinderUi',
      title: 'Service Network Finder – UI',
      type: 'object',
      fieldset: 'network',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'subheading', title: 'Section Subheading', type: 'text' }),
        defineField({ name: 'primaryButtonLabel', title: '"Contact" Button Label', type: 'string' }),
        defineField({ name: 'detailsButtonLabel', title: '"View Details" Button Label', type: 'string' }),
        defineField({ name: 'directionsButtonLabel', title: '"Get Directions" Button Label', type: 'string' }),
      ],
    }),
    defineField({
      name: 'maintenanceSection',
      title: 'Maintenance & Repairs Section',
      type: 'object',
      fieldset: 'maintenance',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'subheading', title: 'Subheading', type: 'text' }),
        defineField({ name: 'overviewHtml', title: 'Overview (HTML)', type: 'text' }),
        defineField({
          name: 'columnLabels',
          title: 'Column Labels',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Labels for maintenance/repair columns, if any.',
        }),
      ],
    }),
    defineField({
      name: 'partsEditorialSection',
      title: 'Parts Editorial Section',
      type: 'object',
      fieldset: 'parts',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro / Subheading', type: 'text' }),
        defineField({
          name: 'parts',
          title: 'Editorial Parts List',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'part',
              fields: [
                defineField({ name: 'name', title: 'Name', type: 'string' }),
                defineField({ name: 'purpose', title: 'Purpose', type: 'text' }),
                defineField({ name: 'fitment', title: 'Fitment', type: 'text' }),
                defineField({ name: 'notesHtml', title: 'Notes (HTML)', type: 'text' }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'integrityAdvisory',
      title: 'Integrity Advisory',
      type: 'object',
      fieldset: 'integrity',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'body', title: 'Body Copy', type: 'text' }),
      ],
    }),
    defineField({
      name: 'serviceRequestBlock',
      title: 'Service Request Block',
      type: 'object',
      fieldset: 'requests',
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'description', title: 'Description', type: 'text' }),
        defineField({ name: 'buttonLabel', title: 'Button Label', type: 'string' }),
        defineField({ name: 'embedUrl', title: 'Embed URL', type: 'url' }),
        defineField({ name: 'fallbackUrl', title: 'Fallback URL', type: 'url' }),
      ],
    }),
    defineField({
      name: 'partsRequestBlock',
      title: 'Parts Request Block',
      type: 'object',
      fieldset: 'requests',
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'string' }),
        defineField({ name: 'description', title: 'Description', type: 'text' }),
        defineField({ name: 'primaryButtonLabel', title: 'Primary Button Label', type: 'string' }),
        defineField({ name: 'secondaryButtonLabel', title: 'Secondary Button Label', type: 'string' }),
        defineField({ name: 'embedUrl', title: 'Embed URL', type: 'url' }),
        defineField({ name: 'fallbackUrl', title: 'Fallback URL', type: 'url' }),
      ],
    }),
    defineField({
      name: 'guidesSection',
      title: 'Care Guides & Downloads',
      type: 'object',
      fieldset: 'guides',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'careGuidesLabel', title: '"Care Guides" Label', type: 'string' }),
        defineField({ name: 'downloadsLabel', title: '"Downloads" Label', type: 'string' }),
        defineField({ name: 'downloadButtonLabel', title: '"Download" Button Label', type: 'string' }),
        defineField({
          name: 'guides',
          title: 'Guides List',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string' }),
                defineField({ name: 'summaryHtml', title: 'Summary (HTML)', type: 'text' }),
                defineField({ name: 'fileUrl', title: 'File URL', type: 'url' }),
                defineField({ name: 'fileSize', title: 'File Size Label', type: 'string' }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqSection',
      title: 'Service FAQ Section',
      type: 'object',
      fieldset: 'faq',
      fields: [
        defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
        defineField({ name: 'intro', title: 'Intro / Lead', type: 'text' }),
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
