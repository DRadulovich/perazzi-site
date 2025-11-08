import {defineType, defineField} from 'sanity'

export const imageWithMeta = defineType({
  name: 'imageWithMeta',
  title: 'Image with Meta',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text (required unless decorative)',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .min(5)
          .warning('Describe the image for non-sighted users. If decorative, see the toggle below.'),
    }),
    defineField({
      name: 'caption',
      title: 'Caption (editorial)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'decorative',
      title: 'Decorative image (use empty alt)',
      type: 'boolean',
      initialValue: false,
      description: 'If true, set alt to an empty string (“”).',
    }),
  ],
  preview: {
    select: {title: 'alt', media: 'asset'},
    prepare({title, media}) {
      return {title: title || 'Image', media}
    },
  },
})
