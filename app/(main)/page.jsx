import HomePageComponent from './_components'

import { client } from '@/sanity/lib/client'

export const metadata = {
  title: "Situs Resmi mrkt.",
  description: "Produk nikotin dan vape dengan kualitas terbaik di Indonesia. Change the title too: situs resmi mrkt."
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

const fetchHomeData = async () => {
  try {
    const res = await client.fetch(`*[_type == 'home'] {
      ...,
      blogs[]->,
    }`)
    return res[0]
  } catch (err) {
    console.log(err)
    return []
  }
}

export const revalidate = 60

const HomePage = async () => {
  // return <SignUpForm />

  const homePageData = await fetchHomeData()

  const products = await fetchData()
  const bestSellers = products.filter(product => product?.showInTrendy === true)
  const hotProducts = products.filter(product => product?.hot === true)

  return <HomePageComponent homePageData={homePageData} products={products} bestSellers={bestSellers} hotProducts={hotProducts} />
}

export default HomePage