import { client } from '@/sanity/lib/client'
import Link from 'next/link'
import urlFor from '@/sanity/lib/image'

import { PortableText } from '@portabletext/react'
import { RichTextComponents } from '@/components/features/rich-text-component'
import ContactForm from './_components/contact-form'

export const metadata = {
  title: "Hubungi Kami Sebab Anda yang Utama",
  description: "Temukan jawaban dari segala pertanyaan dan kendala  terkait kebutuhan dan keinginan bersama tim mrkt."
}

const fetchData = async (slug) => {
  try {
    const res = await client.fetch(`*[_type == 'contact'] {
      ...,
    }`)
    return res
  } catch (err) {
    console.log(err)
    return []
  }
}

export const revalidate = 60


const ContactPage = async () => {
  const data = await fetchData()
  if (!data) return null

  const contact = data[0]

  return (
    <div className="main">
      <nav className="breadcrumb-nav border-0 mb-0">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item active">Kontak Kami</li>
          </ol>
        </div>
      </nav>

      <div className="container">
        <div className="page-header page-header-big text-center" style={{ backgroundImage: urlFor(contact?.bannerImage)?.url() }}>
          <h1 className="page-title text-white">
            Contact us<span className="text-white">keep in touch with us</span>
          </h1>
        </div>
      </div>

      <div className="page-content pb-0">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mb-2 mb-lg-0">
              <h2 className="title mb-1">Informasi Kontak</h2>
              <p className="mb-3">
                <PortableText value={contact?.contactDescription} components={RichTextComponents} />
              </p>
            </div>
            <div className="col-lg-6">
              <h2 className="title mb-1">Ada pertanyaan?</h2>
              <p className="mb-2">Isi form ini untuk berkomunikasi dengan tim kami</p>
              <ContactForm />
            </div>
          </div>

          <hr className="mt-4 mb-5" />
        </div>
      </div>
    </div>
  )
}

export default ContactPage