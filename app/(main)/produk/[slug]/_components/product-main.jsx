"use client";

import StickyBox from "react-sticky-box";

import DetailOne from "@/components/partials/product/details/detail-one";
import InfoThree from "@/components/partials/product/info-tabs/info-three";

const ProductMain = ({ product }) => {
  return (
    <StickyBox className="sticky-content" offsetTop={70}>
      <div className="entry-summary row">
        <div className="col-md-12">
          <div className="entry-summary1 mt-2 mt-md-0"></div>
        </div>
        <div className="col-md-12">
          <div className="entry-summary2"></div>
        </div>
      </div>
      <DetailOne product={product} />
      <InfoThree product={product} />
    </StickyBox>
  );
};

export default ProductMain;
