import Link from "next/link";
import { client } from "@/sanity/lib/client"

import PageHeader from "@/components/features/page-header";
import FaqAccordion from "./_components/faq-accordion";

export const metadata = {
  title: "Pertanyaan Seputar mrkt.",
  description: "Berikut merupakan beberapa pertanyaan umum seputar informasi produk, info pengiriman, promo terbaru, dan lainnya"
}

const fetchData = async (slug) => {
  try {
    const res = await client.fetch(`*[_type == 'faq'] {
      ...,
    }`)
    return res
  } catch (err) {
    console.log(err)
    return []
  }
}

export const revalidate = 60

async function FaqPage() {
  const data = await fetchData()

  return (
    <div className="main">
      <PageHeader title="F.A.Q" subTitle="Frequently Asked Questions" />

      <nav className="breadcrumb-nav">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item active">FAQ</li>
          </ol>
        </div>
      </nav>

      <div className="page-content">
        {data?.map((item, index) => (
          <FaqAccordion data={item} key={index} />
        ))}
      </div>

      {/* <div
        className="cta cta-display bg-image pt-4 pb-4"
        style={{ backgroundImage: `url(images/backgrounds/cta/bg-7.jpg)` }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10 col-lg-9 col-xl-7">
              <div
                className={`row no-gutters flex-sm-row align-items-sm-center`}
              >
                <div className="col">
                  <h3 className="cta-title text-white">
                    If You Have More Questions
                  </h3>
                  <p className="cta-desc text-white">
                    Quisque volutpat mattis eros
                  </p>
                </div>

                <div className="col-auto">
                  <Link href="/kontak-kami" className="btn btn-outline-white">
                    <span>CONTACT US</span>
                    <i className="icon-long-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default FaqPage;
