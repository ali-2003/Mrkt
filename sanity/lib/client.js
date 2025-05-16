import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, useCdn, token } from '../env'

export const client = createClient({
  apiVersion,
  dataset,
  projectId,
  useCdn,
})

export const sanityAdminClient = createClient({
  apiVersion,
  dataset,
  projectId,
  useCdn,
  token,
});