import Link from "next/link";
import { client } from '@/sanity/lib/client'
import urlFor from "@/sanity/lib/image";


import { PortableText } from "@portabletext/react";
import { RichTextComponents } from "@/components/features/rich-text-component";

import TeamSlider from "./_components/team-slider";
import ReviewsSlider from "./_components/reviews-slider";

export const metadata = {
  title: "Masuk segera untuk dapatkan penawaran khusus dan terbatas",
  description: "mrkt. mengutamakan kenikmatan tanpa mengorbankan kualitas bahan dan minimalkan risiko kesehatan"
}

const fetchData = async (slug) => {
  try {
    const res = await client.fetch(`*[_type == 'about'] {
      ...,
    }`)
    return res
  } catch (err) {
    console.log(err)
    return []
  }
}

export const revalidate = 60

const AboutPage = async () => {
  const data = await fetchData()
  const socialIcons = {
    facebook: "icon-facebook-f",
    twitter: "icon-twitter",
    instagram: "icon-instagram",
  };

  if (!data?.length) return null
  const about = data?.[0]

  return (
    <div className="main">
      <nav className="breadcrumb-nav border-0 mb-0">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item active">Tentang Kami</li>
          </ol>
        </div>
      </nav>

      <div className="container">
        <div
          className="page-header page-header-big text-center"
          style={{ backgroundImage: urlFor(about?.bannerImage)?.url() }}
        >
          <h1 className="page-title text-white">
            About us<span className="text-white">Who we are</span>
          </h1>
        </div>
      </div>

      <div className="page-content pb-0">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mb-3 mb-lg-0">
              <h2 className="title">{about?.heading1}</h2>
              <p>
                <PortableText
                  value={about?.description1}
                  components={RichTextComponents}
                />{" "}
              </p>
            </div>

            <div className="col-lg-6">
              <h2 className="title">{about?.heading2}</h2>
              <p>
                <PortableText
                  value={about?.description2}
                  components={RichTextComponents}
                />{" "}
              </p>
            </div>
          </div>

          <div className="mb-5" />
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="brands-text">
                <h2 className="title">{about?.benefitsHeading}</h2>
                <p>
                  <PortableText
                    value={about?.benefitsDescription}
                    components={RichTextComponents}
                  />
                </p>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="brands-display">
                <div className="row justify-content-center">
                  {about?.benefitsLogos?.map((brand, index) => (
                    <div className="col-6 col-sm-4" key={index}>
                      <Link href="#" className="brand">
                        <img
                          src={urlFor(brand?.logo)?.url()}
                          alt="Brand Name"
                        />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="mt-4 mb-6" />

          <TeamSlider about={about} />
        </div>

        <div className="mb-2"></div>

        <div
          className="about-testimonials bg-light-2 pt-6 pb-6 position-relative"
          style={{ marginBottom: "-1px" }}
        >
          <div className="container">
            <h2 className="title text-center mb-3">
              Apa Kata Mereka Tentang Kami?
            </h2>

            <ReviewsSlider reviews={about?.reviews || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage