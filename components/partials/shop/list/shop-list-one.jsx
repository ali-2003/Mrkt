import { useState, useEffect } from "react";

import ProductEleven from "@/components/features/products/product-eleven";

function ShopListOne(props) {
  const { loading, products = [], perPage } = props;
  const [fakeArray, setFakeArray] = useState([]);

  useEffect(() => {
    let temp = [];
    for (let i = 0; i < perPage; i++) {
      temp.push(i);
    }
    setFakeArray(temp);
  }, [perPage]);

  return (
    <div className="products mb-3">
      {products?.length == 0 && !loading ? (
        <p className="no-results">No products matching your selection.</p>
      ) : (
        <>
          <div className="row">
            {loading
              ? fakeArray.map((item, index) => (
                  <div className="col-6" key={index}>
                    <div className="skel-pro"></div>
                  </div>
                ))
              : products.map((product, index) => (
                  <div className="col-6" key={index}>
                    <ProductEleven product={product} />
                  </div>
                ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ShopListOne;
