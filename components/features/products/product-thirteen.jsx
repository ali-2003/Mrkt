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

  function onCartClick(e) {
    e.preventDefault();
    
    dispatch(addToCart(product))
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
    </div>
  );
}

export default ProductThirteen;
