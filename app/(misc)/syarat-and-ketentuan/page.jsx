import { client } from "@/sanity/lib/client";
import { PortableText } from "@portabletext/react";

import PageHeader from "@/components/features/page-header";
import { RichTextComponents } from "@/components/features/rich-text-component";

export const metadata = {
  title: "Syarat Layanan mrkt.",
  description: "Silakan baca Syarat Layanan berikut dengan cermat sebelum menggunakan Situs ini agar mengetahui tentang hak dan kewajiban."
};

const fetchData = async () => {
  try {
    const res = await client.fetch(`*[_type == 'termsCondition'] {
        ...,
      }`);
    return res?.[0];
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const revalidate = 60;

const termsAndConditionsPage = async () => {
  const data = await fetchData();

  return (
    <div className="main">
      <PageHeader title="Syarat & Ketentuan" subTitle="" />
      <div className="w-[95%] md:w-[85%] max-w-[1000px] mx-auto py-20">
        <PortableText
          value={data?.termsConditionText || ""}
          components={RichTextComponents}
        />
      </div>
    </div>
  );
};

export default termsAndConditionsPage;
