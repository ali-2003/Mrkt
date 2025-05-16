import { client } from "@/sanity/lib/client";

export default async function sitemap() {
    const postsResponse = await client.fetch(`*[_type == 'product'] {
        ...,
    }`);
    const blogResponse = await client.fetch(`*[_type == 'post'] {
        ...,
    }`);

    const posts = postsResponse.map((post) => {
        return {
        url: `https://mrkt.co.id/produk/${post.slug.current}`,
        };
    });
    const blogs = blogResponse.map((blog) => {
        return {
        url: `https://mrkt.co.id/informasi-penting/${blog.slug.current}`,
        };
    });

  return [
    {
      url: `https://mrkt.co.id/`,
    },
    {
      url: `https://mrkt.co.id/ejuice`,
    },
    {
      url: `https://mrkt.co.id/informasi-penting`,
    },
    {
      url: `https://mrkt.co.id/keranjang`,
    },
    {
      url: `https://mrkt.co.id/produk`,
    },
    {
      url: `https://mrkt.co.id/faq`,
    },
    {
      url: `https://mrkt.co.id/kebijakan-privasi`,
    },
    {
      url: `https://mrkt.co.id/syarat-and-ketentuan`,
    },
    {
      url: `https://mrkt.co.id/tentang-kami`,
    },
    ...posts,
    ...blogs,
  ];
}
