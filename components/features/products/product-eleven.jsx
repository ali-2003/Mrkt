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

  function onCartClick(e) {
    e.preventDefault();

    dispatch(addToCart(product));
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

        {product?.sale_price ? (
          <span className="product-label label-sale">Promo</span>
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
            {/* <a
              href="#"
              className="btn-product-icon btn-quickview"
              title="Quick View"
              onClick={onQuickView}
            >
              <span>quick view</span>
            </a> */}
            {/* <a
              href="#"
              className="btn-product-icon btn-compare"
              onClick={onCompareClick}
            >
              <span>compare</span>
            </a> */}
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
            <a
              href="#"
              className="btn-product-icon btn-quickview"
              title="Quick View"
              onClick={onQuickView}
            >
              <span>quick view</span>
            </a>
          </div>
        )}

        {/* {product?.stock && product?.stock !== 0 ? (
          <div className="product-action">
            {nicotinePercentage?.length > 0 ? (
              <Link
                href={`/produk/${product.slug.current}`}
                className="btn-product btn-cart btn-select"
              >
                <span>Pilih Varian</span>
              </Link>
            ) : (
              <button className="btn-product btn-cart" onClick={onCartClick}>
                <span>Keranjang</span>
              </button>
            )}
          </div>
        ) : (
          ""
        )} */}
      </figure>

      {/* <div className="product-body">
        <div className="product-cat">
          {product?.category?.map((item, index) => (
            <React.Fragment key={item.slug + "-" + index}>
              <Link
                href={{
                  pathname: "/sidebar/list",
                  query: { category: item.slug },
                }}
              >
                {item.name}
              </Link>
              {index < product?.category?.length - 1 ? ", " : ""}
            </React.Fragment>
          ))}
        </div> */}

        <h3 className="product-title pt-3">
          <Link href={`/produk/${product.slug.current}`}>{product.name}</Link>
        </h3>

        {product?.stock < 1 ? (
          <div className="product-price">
            <span className="out-price">Rp {session && session?.user?.type === 'business' ? product?.business_price?.toFixed(3) : product?.sale_price?.toFixed(2) || product.price.toFixed(2)}</span>
          </div>
        ) : product?.sale_price && (!session || session?.user?.type === 'user') ? (
          <div className="product-price">
            <span className="old-price pr-2">Rp {product.price.toFixed(2)}</span>
            <span className="new-price">Rp {product.sale_price.toFixed(2)}</span>
          </div>
        ) : (
          <div className="product-price">
            <span className="out-price">Rp {session && session?.user?.type === 'business' ? product?.business_price?.toFixed(3) : product.price?.toFixed(2)}</span>
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
          {product?.reviews?.length && <span className="ratings-text">( {product?.reviews?.length} Reviews )</span>}
        </div>

        {/* {product?.nicotinePercentage?.length > 0 ? (
          <div className="product-nav product-nav-dots">
            <div className="row no-gutters">
              {product?.variants?.map((item, index) => (
                <Link
                  href="#"
                  style={{ backgroundColor: item.color }}
                  key={index}
                >
                  <span className="sr-only">Color Name</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          ""
        )} */}
    </div>
  );
}

export default ProductEleven;
