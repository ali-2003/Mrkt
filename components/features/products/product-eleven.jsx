import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { isInWishlist, isInCompare } from "@/utils";
import Link from "next/link";
import Image from "next/image";
import urlFor from "@/sanity/lib/image";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/redux/slice/cartSlice";
import { toast } from "react-toastify";
import { nicotinePercentage } from "@/utils/constants";
import { addToWishlist } from "@/redux/slice/wishlistSlice";
import { useSession } from "next-auth/react";

function ProductEleven({ product }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.items);
  const { data: session } = useSession();

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
    toast.success("Product added to cart");
  }

  function onWishlistClick(e) {
    e.preventDefault();
    if (!isInWishlist(wishlist, product)) {
      dispatch(addToWishlist(product));
    } else {
      router.push("favorit");
    }
  }

  function onCompareClick(e) {
    e.preventDefault();
    if (!isInCompare(props.comparelist, product)) {
      props.addToCompare(product);
    }
  }

  function onQuickView(e) {
    e.preventDefault();
    props.showQuickView(product.slug.current);
  }

  return (
    <div className="product product-7 text-center w-100">
      <figure className="product-media">
        {product?.hot ? (
          <span className="product-label label-new">Hot</span>
        ) : (
          ""
        )}

        {product?.sale_price && !isBusinessUser ? (
          <span className="product-label label-sale">Promo</span>
        ) : (
          ""
        )}

        {/* Business user indicator */}
        {isBusinessUser && product?.business_price ? (
          <span className="product-label label-business">Business</span>
        ) : (
          ""
        )}

        {product?.featured ? (
          <span className="product-label label-top">Viral</span>
        ) : (
          ""
        )}

        {!product?.stock || product?.stock == 0 ? (
          <span className="product-label label-out">Out of Stock</span>
        ) : (
          ""
        )}

        <Link href={`/produk/${product.slug.current}`}>
          <Image
            alt="product"
            src={urlFor(product.pictures?.[0])?.url()}
            fill
            className="product-image"
          />
          {product?.pictures?.length >= 2 ? (
            <Image
              alt="product"
              src={urlFor(product.pictures?.[1])?.url()}
              fill
              className="product-image-hover"
            />
          ) : (
            ""
          )}
        </Link>

        {product?.stock > 0 ? (
          <div className="product-action-vertical">
            {isInWishlist(wishlist, product) ? (
              <Link
                href="/favorit"
                className="btn-product-icon btn-wishlist btn-expandable added-to-wishlist"
              >
                <span>go to wishlist</span>
              </Link>
            ) : (
              <a
                href="#"
                className="btn-product-icon btn-wishlist btn-expandable"
                onClick={onWishlistClick}
              >
                <span>add to wishlist</span>
              </a>
            )}
          </div>
        ) : (
          <div className="product-action-vertical">
            {isInWishlist(wishlist, product) ? (
              <Link
                href="/favorit"
                className="btn-product-icon btn-wishlist btn-expandable added-to-wishlist"
              >
                <span>go to wishlist</span>
              </Link>
            ) : (
              <a
                href="#"
                className="btn-product-icon btn-wishlist btn-expandable"
                onClick={onWishlistClick}
              >
                <span>add to wishlist</span>
              </a>
            )}
          </div>
        )}
      </figure>

      <h3 className="product-title pt-3">
        <Link href={`/produk/${product.slug.current}`}>{product.name}</Link>
      </h3>

      {/* Updated Price Display Logic */}
      {product?.stock < 1 ? (
        <div className="product-price">
          <span className="out-price">{formatPrice(getDisplayPrice())}</span>
        </div>
      ) : shouldShowSalePrice() ? (
        <div className="product-price">
          <span className="old-price pr-2">{formatPrice(product.price)}</span>
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

      <div className="ratings-container pb-2">
        <div className="ratings">
          <div
            className="ratings-val"
            style={{ width: product?.ratings * 20 + "%" }}
          ></div>
          <span className="tooltip-text">{product?.ratings.toFixed(2)}</span>
        </div>
        {product?.reviews?.length && (
          <span className="ratings-text">( {product?.reviews?.length} Reviews )</span>
        )}
      </div>

      <style jsx>{`
        .product-label.label-business {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-weight: 600;
        }
        
        .business-indicator {
          color: #667eea;
          font-weight: 500;
          font-size: 0.8em;
        }
        
        .old-price {
          text-decoration: line-through;
          color: #999;
        }
        
        .new-price {
          color: #e74c3c;
          font-weight: 600;
        }
        
        .out-price {
          color: #333;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default ProductEleven;