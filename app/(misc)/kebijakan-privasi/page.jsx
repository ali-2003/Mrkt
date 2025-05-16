import { client } from "@/sanity/lib/client";
import { PortableText } from "@portabletext/react";

import PageHeader from "@/components/features/page-header";
import { RichTextComponents } from "@/components/features/rich-text-component";

export const metadata = {
  title: "Penerapan Kebijakan Perlindungan Data Pembeli.",
  description: "mrkt. berkomitmen untuk melindungi data pembeli dan mematuhi semua undang-undang perlindungan data dan privasi yang berlaku."
};

const fetchData = async () => {
  try {
    const res = await client.fetch(`*[_type == 'privacyPolicy'] {
        ...,
      }`);
    return res?.[0];
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const revalidate = 60;

const PrivacyPolicyPage = async () => {
  const data = await fetchData();

  return (
    <div className="main">
      <PageHeader title="Kebijakan Privasi" subTitle="" />
      <div className="w-[95%] md:w-[85%] max-w-[1000px] mx-auto py-20">
        <PortableText
          value={data?.privacyPolicyText || ""}
          components={RichTextComponents}
        />
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
