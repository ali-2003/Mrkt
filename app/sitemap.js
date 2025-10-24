// app/sitemap.js
import { client } from "@/sanity/lib/client";

export default async function sitemap() {
  try {
    const postsResponse = await client.fetch(`*[_type == 'product'] {
      _id,
      slug,
      _updatedAt
    }`);
    
    const blogResponse = await client.fetch(`*[_type == 'post'] {
      _id,
      slug,
      _updatedAt
    }`);

    // Product pages
    const products = postsResponse.map((post) => {
      return {
        url: `https://www.mrkt.co.id/produk/${post.slug.current}`,
        lastModified: post._updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    });

    // Blog/Informasi Penting pages
    const blogs = blogResponse.map((blog) => {
      return {
        url: `https://www.mrkt.co.id/informasi-penting/${blog.slug.current}`,
        lastModified: blog._updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      };
    });

    // Static pages
    const staticPages = [
      // Main pages
      {
        url: `https://www.mrkt.co.id/`,
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `https://www.mrkt.co.id/ejuice`,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `https://www.mrkt.co.id/devices`,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `https://www.mrkt.co.id/informasi-penting`,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `https://www.mrkt.co.id/keranjang`,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `https://www.mrkt.co.id/checkout`,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `https://www.mrkt.co.id/refundPolicy`,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `https://www.mrkt.co.id/warrantyPolicy`,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `https://www.mrkt.co.id/payment/success`,
        changeFrequency: 'never',
        priority: 0.3,
      },
      {
        url: `https://www.mrkt.co.id/payment/failed`,
        changeFrequency: 'never',
        priority: 0.3,
      },

      // Misc pages
      {
        url: `https://www.mrkt.co.id/faq`,
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `https://www.mrkt.co.id/tentang-kami`,
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `https://www.mrkt.co.id/kebijakan-privasi`,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `https://www.mrkt.co.id/syarat-and-ketentuan`,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `https://www.mrkt.co.id/kontak-kami`,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `https://www.mrkt.co.id/affiliate-marketing`,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `https://www.mrkt.co.id/favorit`,
        changeFrequency: 'weekly',
        priority: 0.5,
      },

      // Auth pages
      {
        url: `https://www.mrkt.co.id/auth/masuk`,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `https://www.mrkt.co.id/auth/daftar`,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `https://www.mrkt.co.id/auth/complete-profile`,
        changeFrequency: 'never',
        priority: 0.3,
      },
      {
        url: `https://www.mrkt.co.id/success`,
        changeFrequency: 'never',
        priority: 0.3,
      },
    ];

    return [...staticPages, ...products, ...blogs];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least the static pages if there's an error
    return [
      { url: `https://www.mrkt.co.id/` },
    ];
  }
}