import {defineType, defineField} from 'sanity'
import {HomeIcon} from '@sanity/icons'

export const homeSingleton = defineType({
  name: 'homeSingleton',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  fieldsets: [
    {name: 'hero', title: 'Hero overlay panel', options: {collapsible: true, collapsed: false}},
    {name: 'timeline', title: 'Workshop timeline band', options: {collapsible: true, collapsed: true}},
    {name: 'guide', title: 'Guide / utility cards', options: {collapsible: true, collapsed: true}},
    {name: 'marquee', title: 'Champion narrative marquee', options: {collapsible: true, collapsed: true}},
    {name: 'finale', title: 'Final utility CTA', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fieldset: 'hero',
      fields: [
        defineField({
          name: 'background',
          title: 'Background Image (Desktop)',
          type: 'imageWithMeta',
          description: 'Used on desktop and as the fallback when tablet/mobile images are not set.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'backgroundTablet',
          title: 'Background Image (Tablet)',
          type: 'imageWithMeta',
          description: 'Optional. Used between 768px and 1024px wide viewports.',
        }),
        defineField({
          name: 'backgroundMobile',
          title: 'Background Image (Mobile)',
          type: 'imageWithMeta',
          description: 'Optional. Used below 768px wide viewports.',
        }),
        defineField({name: 'tagline', title: 'Tagline (optional)', type: 'string'}),
        defineField({name: 'subheading', title: 'Subheading (optional)', type: 'text', rows: 2}),
      ],
    }),

    defineField({
      name: 'heroCtas',
      title: 'Hero Calls to Action',
      type: 'object',
      fieldset: 'hero',
      options: {columns: 2},
      initialValue: {
        primaryLabel: 'Ask the concierge',
        primaryPrompt:
          "Introduce me to Perazzi's bespoke philosophy and help me choose where to begin if I'm exploring my first build.",
        secondaryLabel: 'Explore shotguns',
        secondaryHref: '/shotguns',
      },
      fields: [
        defineField({name: 'primaryLabel', title: 'Primary CTA label', type: 'string'}),
        defineField({name: 'primaryPrompt', title: 'Primary CTA chat prompt', type: 'text', rows: 3}),
        defineField({name: 'secondaryLabel', title: 'Secondary CTA label', type: 'string'}),
        defineField({name: 'secondaryHref', title: 'Secondary CTA link (relative OK)', type: 'string'}),
      ],
    }),

    defineField({
      name: 'timelineFraming',
      title: 'Timeline Framing',
      type: 'object',
      fieldset: 'timeline',
      options: {columns: 2},
      initialValue: {
        title: 'Craftsmanship Journey',
        eyebrow: 'Three rituals that define a bespoke Perazzi build',
        instructions:
          'Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a legacy piece.',
        alternateTitle: 'Fitting Timeline',
        backgroundImage: {
          path: '/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg',
        },
      },
      fields: [
        defineField({name: 'title', title: 'Section title', type: 'string'}),
        defineField({name: 'eyebrow', title: 'Subheading / eyebrow', type: 'string'}),
        defineField({name: 'instructions', title: 'Instructions (desktop copy)', type: 'text', rows: 3}),
        defineField({name: 'alternateTitle', title: 'Alternate title (sidebar label)', type: 'string'}),
        defineField({
          name: 'backgroundImage',
          title: 'Background image',
          type: 'object',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'imageWithMeta'}),
            defineField({
              name: 'path',
              title: 'Static asset path',
              type: 'string',
              description: 'Use a relative path such as /redesign-photos/... if not uploading an image.',
            }),
          ],
          options: {columns: 2},
        }),
      ],
    }),

    defineField({
      name: 'timelineStages',
      title: 'Timeline Stages',
      type: 'array',
      fieldset: 'timeline',
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

    defineField({
      name: 'guideSection',
      title: 'Guide Section',
      type: 'object',
      fieldset: 'guide',
      options: {columns: 2},
      initialValue: {
        title: 'Need a guide?',
        intro:
          'Ask how Perazzi links heritage, champions, and today’s platforms, then step into the catalog with a clearer sense of where you belong – whether that’s HT, MX, TM or beyond.',
        chatLabel: 'Ask about platforms',
        chatPrompt:
          "Connect Perazzi's heritage stories and champions to current platforms like High Tech and MX, and suggest the next pages I should explore on the site.",
        linkLabel: 'Explore shotguns',
        linkHref: '/shotguns',
        platforms: [
          {
            _key: 'ht',
            code: 'ht',
            name: 'HT',
            description: 'modern competition geometry for demanding sporting layouts.',
          },
          {
            _key: 'mx',
            code: 'mx',
            name: 'MX',
            description: 'the classic lineage: balanced, adaptable, and endlessly configurable.',
          },
          {
            _key: 'tm',
            code: 'tm',
            name: 'TM',
            description: 'purpose-built for American trap with a dedicated silhouette.',
          },
        ],
        closing:
          'The concierge can map your disciplines, preferences, and ambitions to a starting platform and the right next pages to visit.',
      },
      fields: [
        defineField({name: 'title', title: 'Title', type: 'string'}),
        defineField({name: 'intro', title: 'Intro paragraph', type: 'text', rows: 3}),
        defineField({name: 'chatLabel', title: 'Chat button label', type: 'string'}),
        defineField({name: 'chatPrompt', title: 'Chat button prompt', type: 'text', rows: 3}),
        defineField({name: 'linkLabel', title: 'Link label', type: 'string'}),
        defineField({name: 'linkHref', title: 'Link href (relative OK)', type: 'string'}),
        defineField({
          name: 'platforms',
          title: 'Platforms list',
          type: 'array',
          of: [
            defineField({
              name: 'platform',
              type: 'object',
              fields: [
                defineField({
                  name: 'code',
                  title: 'Code',
                  type: 'string',
                  options: {list: ['ht', 'mx', 'tm']},
                  validation: (Rule) => Rule.required(),
                }),
                defineField({name: 'name', title: 'Name/label', type: 'string'}),
                defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
              ],
              preview: {select: {title: 'name', subtitle: 'description'}},
            }),
          ],
          validation: (Rule) => Rule.min(1).warning('Add at least one platform'),
        }),
        defineField({name: 'closing', title: 'Closing paragraph', type: 'text', rows: 3}),
      ],
    }),

    // Option A: reference a Champion doc (recommended)
    defineField({
      name: 'featuredChampion',
      title: 'Featured Champion (Marquee)',
      type: 'reference',
      fieldset: 'marquee',
      to: [{type: 'champion'}],
      description: 'Pick a Champion to feature in the marquee.',
    }),

    // Option B: inline marquee if you don’t want a Champion yet
    defineField({
      name: 'marqueeInline',
      title: 'Inline Marquee (use if no Champion reference)',
      type: 'object',
      fieldset: 'marquee',
      fields: [
        defineField({name: 'quote', title: 'Quote', type: 'text', rows: 2}),
        defineField({name: 'image', title: 'Image', type: 'imageWithMeta'}),
        defineField({name: 'credit', title: 'Attribution (optional)', type: 'string'}),
      ],
    }),

    defineField({
      name: 'marqueeUi',
      title: 'Marquee UI',
      type: 'object',
      fieldset: 'marquee',
      options: {columns: 2},
      initialValue: {
        eyebrow: 'Champion spotlight',
        backgroundImage: {
          path: '/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg',
        },
      },
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow label', type: 'string'}),
        defineField({
          name: 'backgroundImage',
          title: 'Background image',
          type: 'object',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'imageWithMeta'}),
            defineField({
              name: 'path',
              title: 'Static asset path',
              type: 'string',
              description: 'Use a relative path such as /redesign-photos/... if not uploading an image.',
            }),
          ],
          options: {columns: 2},
        }),
      ],
    }),

    defineField({
      name: 'finale',
      title: 'Final CTA',
      type: 'object',
      fieldset: 'finale',
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
