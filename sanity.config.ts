'use client'

/**
 * This configuration is used for the Sanity Studio that’s mounted on the `/app/next-studio/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {presentationTool} from 'sanity/presentation'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'
import {perazziTheme} from './src/sanity/studioTheme'
import {StudioLogo, StudioNavbar} from './src/sanity/studioComponents'

const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
const deployedPreview =
  process.env.NEXT_PUBLIC_SITE_URL || (vercelUrl ? `https://${vercelUrl}` : undefined)
const localPreview = process.env.NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN || 'http://localhost:3000'
const previewOrigin = process.env.NODE_ENV === 'production' ? deployedPreview || localPreview : localPreview
const allowOrigins = Array.from(
  new Set([previewOrigin, deployedPreview, localPreview].filter(Boolean))
) as string[]

export default defineConfig({
  basePath: '/next-studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  theme: perazziTheme,
  studio: {
    components: {
      logo: StudioLogo,
      navbar: StudioNavbar,
    },
  },
  plugins: [
    deskTool({structure}),
    presentationTool({
      previewUrl: {
        origin: previewOrigin,
        previewMode: {
          enable: '/api/draft',
        },
      },
      // Allow your site origins to connect overlays for Visual Editing/Presentation
      allowOrigins,
      resolve: {
        locations: {
          homeSingleton: () => [
            {
              title: 'Home',
              href: '/',
            },
          ],
          shotgunsLanding: () => [
            {
              title: 'Shotguns',
              href: '/shotguns',
            },
          ],
          bespokeHome: () => [
            {
              title: 'Bespoke',
              href: '/bespoke',
            },
          ],
          experienceHome: () => [
            {
              title: 'Experience',
              href: '/experience',
            },
          ],
          heritageHome: () => [
            {
              title: 'Heritage',
              href: '/heritage',
            },
          ],
          serviceHome: () => [
            {
              title: 'Service',
              href: '/service',
            },
          ],
          journalLanding: () => [
            {
              title: 'Journal landing',
              href: '/journal',
            },
          ],
          article: (doc) =>
            doc?.slug?.current
              ? [
                  {
                    title: 'Journal article',
                    href: `/journal/${doc.slug.current}`,
                  },
                ]
              : [],
        },
      },
    }),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
