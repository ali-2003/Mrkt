// sanity/lib/client.js
import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'tv2rto4y'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-15'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
  // Add these CORS configurations
  withCredentials: true,
  requestTagPrefix: 'sanity.',
  perspective: 'published',
})

export const sanityAdminClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Ensure fresh data for admin operations
  token: process.env.SANITY_API_TOKEN, // Make sure this is set in your environment
  withCredentials: true,
  perspective: 'published',
})

export default client