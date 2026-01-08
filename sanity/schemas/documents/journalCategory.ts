import {defineArrayMember, defineField, defineType} from 'sanity'

export const journalCategory = defineType({
  name: 'journalCategory',
  title: 'Journal Category',
  type: 'document',
  fields: [
    defineField({
      name: 'key',
      title: 'Category Key',
      type: 'string',
      options: {
        list: [
          { title: 'Stories of Craft', value: 'craft' },
          { title: 'Champion Interviews', value: 'interviews' },
          { title: 'News', value: 'news' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'subtitleHtml', title: 'Subtitle (HTML)', type: 'text', rows: 4 }),
    defineField({
      name: 'featuredArticle',
      title: 'Featured Article',
      type: 'reference',
      to: [{ type: 'article' }],
    }),
    defineField({
      name: 'items',
      title: 'Articles',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'article' }],
        }),
      ],
      validation: (Rule) => Rule.min(1).warning('Add at least one article'),
    }),
  ],
})
