// sanity/lib/client.js
import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false, // Set to false for development and when using auth token
  apiVersion: '2023-10-01',
  token: process.env.SANITY_API_TOKEN, // Make sure this is using the correct env var name
  perspective: 'published', // Add this
  ignoreBrowserTokenWarning: true, // Add this to suppress warnings
})

// Debug logging (remove in production)
if (typeof window !== 'undefined') {
  console.log('🔧 Sanity Client Configuration:');
  console.log('Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
  console.log('Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET);
  console.log('Token available:', !!process.env.SANITY_API_TOKEN);
  console.log('Client config:', {
    projectId: client.config().projectId,
    dataset: client.config().dataset,
    token: client.config().token ? 'Token set' : 'No token',
    useCdn: client.config().useCdn
  });
}