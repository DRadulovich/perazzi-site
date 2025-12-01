import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Live / presentation overlays require uncached responses
  useCdn: false,
  stega: {
    studioUrl: '/next-studio',
  },
})
