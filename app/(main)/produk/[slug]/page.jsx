import { client } from "@/sanity/lib/client"
import NotFound from "@/app/not-found"
import Breadcrumb from "@/components/partials/product/breadcrumb";
import GallerySticky from "@/components/partials/product/gallery/gallery-sticky";
import RelatedProductsOne from "@/components/partials/product/related/related-one";
import ProductMain from "./_components/product-main";

export async function generateMetadata({ params, searchParams }, parent) {
  const slug = params.slug;
  
  try {
    const res = await client.fetch(
      `*[_type == 'product' && slug.current == $slug] {
        ...,
      }`,
      { slug }
    );
    
    // Check if res exists and has items before accessing properties
    if (res && res.length > 0) {
      return {
        title: res[0].name || "Produk",
        description: res[0]?.short_desc || res[0]?.title || "Produk",
      };
    } else {
      return {
        title: "Produk",
        description: "Produk",
      };
    }
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return {
      title: "Produk",
      description: "Produk",
    };
  }
}

const fetchData = async (slug) => {
  try {
    const res = await client.fetch(
      `*[_type == 'product' && slug.current == $slug] {
        ...,
        relatedProducts[]->,
      }`, 
      { slug }
    );
    return res;
  } catch (err) {
    console.error("Error fetching product data:", err);
    return [];
  }
}

export const revalidate = 60;

const ProductPage = async ({ params }) => {
  const { slug = '' } = params;
  const product = await fetchData(slug);
  
  if (!product?.length || !slug) return <NotFound />;
  
  const loading = false;
  const related = product[0]?.relatedProducts || [];
  const prev = product[0];
  const next = product[0];
  
  return (
    <div className="main">
      <Breadcrumb prev={prev} next={next} current={product[0]?.name || ''} />
      <div className="page-content">
        <div className="container skeleton-body">
          <div className="product-details-top">
            <div
              className={`row skel-pro-single sticky ${
                loading ? "" : "loaded"
              }`}
            >
              <div className="col-md-6">
                <div className="skel-product-gallery"></div>
                {!loading ? <GallerySticky product={product[0]} /> : ""}
              </div>
              <div className="col-md-6">
                <ProductMain product={product[0]} />
              </div>
            </div>
          </div>
          <RelatedProductsOne products={related} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default ProductPage;