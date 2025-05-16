import CategoryPageComponent from './_components'

import { client } from '@/sanity/lib/client'

export const metadata = {
  title: "E-Juice",
}

const fetchData = async () => {
  try {
    const res = await client.fetch(`*[_type == 'product'] {
      ...,
      relatedProducts[]->,
    }`)
    return res
  } catch (err) {
    console.log(err)
    return []
  }
}

export const revalidate = 60

const CategoryPage = async () => {
  const products = await fetchData()

  return <CategoryPageComponent products={products} />
}

export default CategoryPage