"use client"

// Import Custom Component
import ProductTwelve from "@/components/features/products/product-twelve";

// Import Utils
import { productSlider } from "@/utils/data";

import OwlCarousel from "@/components/features/owl-carousel";

function TopCollection({ products }) {

  return (
    <section className="product-section best-seller">
      <div className="container">
        <div className="heading heading-center">
          <h2 className="title pt-5">Eliquid Unggulan Kami</h2>
          <p className="title-desc">
          Rasa terpopuler yang dimiliki
          </p>
        </div>

        <OwlCarousel options={ productSlider }>
        {products?.length
          ? products
              .slice(0, 6)
              .map((item, index) => (
                <ProductTwelve product={item} key={"Latest:" + index} />
              ))
          : new Array(6)
              .fill(1)
              .map((item, index) => (
                <div className="skel-pro" key={"Skeleton" + index}></div>
              ))}
        </OwlCarousel>
      </div>
    </section>
  );
}

export default TopCollection;
