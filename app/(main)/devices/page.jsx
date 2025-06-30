// page.jsx - FIXED VERSION
import ProductShowcasePage from './_components'
import { client } from '@/sanity/lib/client'

export const metadata = {
  title: "Pod Devices - Premium Vaping Experience",
  description: "Discover our premium pod vaping devices with cutting-edge technology"
}

const fetchData = async () => {
  try {
    const res = await client.fetch(`*[_type == 'device' && deviceType == 'pod'] {
      _id,
      name,
      slug,
      tagline,
      "mainImage": mainImage.asset->url,
      "gallery": gallery[].asset->url,
      videos[]{
        title,
        "thumbnail": thumbnail.asset->url,
        videoUrl,
        "videoFile": videoFile.asset->url
      },
      features[]{
        icon,
        title,
        description
      },
      specifications[]{
        label,
        value
      },
      colors[]{
        name,
        color,
        "image": image.asset->url
      },
      price,
      sale_price,
      business_price,
      originalPrice,
      rating,
      reviews[]{
        customerName,
        rating,
        title,
        comment,
        reviewDate,
        verified,
        helpful,
        "reviewImages": reviewImages[].asset->url,
        pros,
        cons,
        wouldRecommend
      },
      totalReviews,
      inStock,
      description,
      detailedDescription,
      whatsIncluded,
      safetyInfo,
      compatibility,
      deviceType,
      brand,
      "relatedProducts": relatedProducts[]->{
        _id,
        name,
        slug,
        "mainImage": mainImage.asset->url,
        price,
        sale_price,
        business_price,
        originalPrice
      }
    }`)
    
    console.log('📊 Fetched device data:', JSON.stringify(res, null, 2));
    return res
  } catch (err) {
    console.error('❌ Error fetching device data:', err)
    return []
  }
}

export const revalidate = 60

const PodCategoryPage = async () => {
  const devices = await fetchData()
  // If you have only one device, pass it directly to showcase
  // If you have multiple devices, you might want to show the first one or create a selection
  const mainDevice = devices && devices.length > 0 ? devices[0] : null
  
  console.log('📊 Main device passed to component:', mainDevice ? {
    name: mainDevice.name,
    price: mainDevice.price,
    sale_price: mainDevice.sale_price,
    business_price: mainDevice.business_price,
    originalPrice: mainDevice.originalPrice
  } : 'No device found');
  
  return (
    <ProductShowcasePage
      device={mainDevice}
      title="Pod Devices"
      subTitle="Premium Pod Systems"
    />
  )
}

export default PodCategoryPage