"use client";
import { useState, useEffect } from "react";
import StickyBox from "react-sticky-box";
import DetailOne from "@/components/partials/product/details/detail-one";
import InfoThree from "@/components/partials/product/info-tabs/info-three";

const ProductMain = ({ product, onColorChange, selectedColor: parentSelectedColor }) => {
  const [selectedColor, setSelectedColor] = useState(null);

  // Sync with parent component's selected color
  useEffect(() => {
    if (parentSelectedColor !== selectedColor) {
      setSelectedColor(parentSelectedColor);
    }
  }, [parentSelectedColor]);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    // Notify parent component if callback is provided
    if (onColorChange) {
      onColorChange(color);
    }
  };

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
      <DetailOne 
        product={product} 
        onColorChange={handleColorChange}
        selectedColor={selectedColor}
      />
      <InfoThree 
        product={product} 
        selectedColor={selectedColor}
      />
    </StickyBox>
  );
};

export default ProductMain;