"use client";
import { useState } from "react";
import Breadcrumb from "@/components/partials/product/breadcrumb";
import GallerySticky from "@/components/partials/product/gallery/gallery-sticky";
import RelatedProductsOne from "@/components/partials/product/related/related-one";
import ProductMain from "./_components/product-main";

function ProductPageClient({ product, related, prev, next }) {
  const [selectedColor, setSelectedColor] = useState(null);

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  const handleImageColorChange = (color) => {
    // When user clicks on an image in the gallery, update the selected color
    // Only update if it's different from current selection
    if (!selectedColor || selectedColor.colorName !== color.colorName) {
      setSelectedColor(color);
    }
  };

  const loading = false;

  return (
    <div className="main">
      <Breadcrumb prev={prev} next={next} current={product?.name || ''} />
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
                {!loading ? (
                  <GallerySticky 
                    product={product} 
                    selectedColor={selectedColor}
                    onImageColorChange={handleImageColorChange}
                  />
                ) : ""}
              </div>
              <div className="col-md-6">
                <ProductMain 
                  product={product} 
                  onColorChange={handleColorChange}
                  selectedColor={selectedColor}
                />
              </div>
            </div>
          </div>
          <RelatedProductsOne products={related} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default ProductPageClient;