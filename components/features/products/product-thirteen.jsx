// ProductThirteen.js - Updated with business pricing
'use client'
import { addToCart } from "@/redux/slice/cartSlice";
import urlFor from "@/sanity/lib/image.js";
import { nicotinePercentage } from "@/utils/constants";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

function ProductThirteen({ product }) {
  const dispatch = useDispatch()
  const { data: session } = useSession()

  // Check if user is business account (corrected field name)
  const isBusinessUser = session?.user?.accountType === 'business';

  // Function to get the appropriate price based on user type
  function getDisplayPrice() {
    if (isBusinessUser && product?.business_price) {
      return product.business_price;
    }
    if (product?.sale_price && !isBusinessUser) {
      return product.sale_price;
    }
    return product?.price || 0;
  }

  // Function to check if we should show sale price styling
  function shouldShowSalePrice() {
    return product?.sale_price && !isBusinessUser && product.sale_price < product.price;
  }

  // Function to format price consistently
  function formatPrice(price) {
    return `Rp ${price.toLocaleString('id-ID')}`;
  }

  function onCartClick(e) {
    e.preventDefault();

    // Add business pricing context to cart item
    const cartItem = {
      ...product,
      displayPrice: getDisplayPrice(),
      isBusinessUser: isBusinessUser,
      addedAsBusinessUser: isBusinessUser
    };

    dispatch(addToCart(cartItem));
    toast.success("Item added to cart")
  }

  return (
    <div className="tooltip">
      <figure className="product-media">
        <Link href={`/produk/${product.slug.current}`}>
          <Image
            alt="product"
            src={urlFor(product?.pictures?.[0])?.url()}
            className="product-image"
            fill
          />
          {product?.pictures?.length >= 2 ? (
            <Image
              alt="product"
              src={urlFor(product?.pictures?.[1])?.url()}
              className="product-image-hover"
              fill
            />
          ) : (
            ""
          )}
        </Link>
      </figure>
      
      <div className="product-body">
        <h3 className="product-title">
          <Link href={`/produk/${product.slug.current}`}>{product?.name}</Link>
        </h3>

        {/* Updated Price Display Logic */}
        {product?.stock < 1 ? (
          <div className="product-price">
            <span className="out-price">{formatPrice(getDisplayPrice())}</span>
          </div>
        ) : shouldShowSalePrice() ? (
          <div className="product-price">
            <span className="old-price">Rp {product.price.toLocaleString('id-ID')}</span>
            <span className="new-price">{formatPrice(getDisplayPrice())}</span>
          </div>
        ) : (
          <div className="product-price">
            <span className="out-price">
              {formatPrice(getDisplayPrice())}
              {isBusinessUser && product?.business_price && (
                <small className="business-indicator"> (Business)</small>
              )}
            </span>
          </div>
        )}

        {/* Uncomment if you want to add cart button */}
        {/* {product?.stock && product?.stock !== 0 ? (
          nicotinePercentage?.length > 0 ? (
            <Link
              href={`/produk/${product?.slug.current}`}
              className="btn btn-link btn-link-secondary-dark"
            >
              <span>Pilih Varian</span>
            </Link>
          ) : (
            <a
              href="#"
              className="btn btn-link btn-link-secondary-dark"
              onClick={onCartClick}
            >
              <span>Keranjang</span>
            </a>
          )
        ) : (
          ""
        )} */}
      </div>

      <style jsx>{`
        .business-indicator {
          color: #667eea;
          font-weight: 500;
          font-size: 0.8em;
        }
      `}</style>
    </div>
  );
}

export default ProductThirteen;