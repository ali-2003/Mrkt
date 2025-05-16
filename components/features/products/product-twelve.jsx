'use client'

import { useRouter } from "next/navigation";

import { isInWishlist, isInCompare } from "@/utils";
import Image from "next/image";
import Link from "next/link";
import urlFor from "@/sanity/lib/image";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/redux/slice/cartSlice";
import { toast } from "react-toastify";
import { nicotinePercentage } from "@/utils/constants";
import { addToWishlist } from "@/redux/slice/wishlistSlice";
import { useSession } from "next-auth/react";


function ProductTwelve({ product }) {
  const router = useRouter();
  const dispatch = useDispatch()
  const wishlist = useSelector((state) => state.wishlist.items);
  const { data: session } = useSession();

  function onCartClick(e) {
    e.preventDefault();

    dispatch(addToCart(product))
    toast.success("Item added to cart")
  }

  function onWishlistClick(e) {
    e.preventDefault();
    if (!isInWishlist(wishlist, product)) {
      dispatch(addToWishlist(product));
    } else {
      router?.push("/favorit");
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
    props.showQuickView(product?.slug);
  }

  return (
    <div className="product product-4 text-center">
      <figure className="product-media">
        {product?.hot ? (
          <span className="product-label label-circle label-new">Hot</span>
        ) : (
          ""
        )}

        {product?.sale_price ? (
          <span className="product-label label-circle label-sale">Promo</span>
        ) : (
          ""
        )}

        {product?.featured ? (
          <span className="product-label label-circle label-top">Viral</span>
        ) : (
          ""
        )}

        {!product?.stock || product?.stock == 0 ? (
          <span className="product-label label-circle label-out">
            Out of Stock
          </span>
        ) : (
          ""
        )}

        <Link href={`/produk/${product.slug.current}`}>
          <Image
            alt="product"
            src={urlFor(product?.pictures?.[0])?.url()}
            fill
            className="product-image"
          />
          {product?.pictures?.length >= 2 ? (
            <Image
              alt="product"
              src={urlFor(product?.pictures[1])?.url()}
              fill
              className="product-image-hover"
            />
          ) : (
            ""
          )}
        </Link>

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

        
      </figure>

      <div className="product-body">
        <div className="ratings-container">
          <div className="ratings">
            <div
              className="ratings-val"
              style={{ width: product?.ratings * 20 + "%" }}
            ></div>
            <span className="tooltip-text">{product?.ratings?.toFixed(2)}</span>
          </div>
        </div>

        <h3 className="product-title !text-2xl">
          <Link href={`/produk/${product.slug.current}`}>{product.name}</Link>
        </h3>

        {product?.stock < 1 ? (
          <div className="product-price">
            <span className="out-price">Rp {session && session?.user?.type === 'business' ? product?.business_price?.toFixed(3) : product?.sale_price?.toFixed(2) || product.price.toFixed(2)}</span>
          </div>
        ) : product?.sale_price && (!session || session?.user?.type === 'user') ? (
          <div className="product-price">
            <span className="old-price">Rp {product.price.toFixed(2)}</span>
            <span className="new-price">Rp {product.sale_price.toFixed(2)}</span>
          </div>
        ) : (
          <div className="product-price">
            <span className="out-price">Rp {session && session?.user?.type === 'business' ? product?.business_price?.toFixed(3) : product.price?.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductTwelve;
