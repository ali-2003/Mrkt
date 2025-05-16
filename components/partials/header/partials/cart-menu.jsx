import { useEffect } from "react";
import Link from "next/link";

import { cartQtyTotal, cartPriceTotal, cartPriceTotalDiscount } from "@/utils/index";
import { useDispatch, useSelector } from "react-redux";
import urlFor from "@/sanity/lib/image";
import { removeFromCart, updateDiscount } from "@/redux/slice/cartSlice";
import { useSession } from "next-auth/react";
import { sanityAdminClient } from "@/sanity/lib/client";
import Image from "next/image";

function CartMenu() {
  const { data: session } = useSession()
  const dispatch = useDispatch();
  const { items: cartlist, discount } = useSelector((state) => state.cart);

  const fetchDiscounts = async () => {
    try {
      const email = session?.user?.email
      if (session) {
        const res = await sanityAdminClient.fetch(`*[_type == 'user' && email == $email] {
          ...,
        }`, { email })
        // discountsAvailable[]->

        dispatch(updateDiscount(res?.[0]?.discountsAvailable?.[0]))
      }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (session?.user?.email) {
      fetchDiscounts()
    }
  }, [session?.user?.email])

  return (
    <div className="dropdown cart-dropdown">
      <Link
        href="/keranjang"
        className="dropdown-toggle"
        role="button"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
        data-display="static"
      >
        <i className="icon-shopping-cart text-black"></i>
        <span className="cart-count font-weight-bolder bg-secondary">
          {cartQtyTotal(cartlist)}
        </span>
      </Link>

      <div
        className={`dropdown-menu dropdown-menu-right ${
          cartlist?.length === 0 ? "text-center" : ""
        }`}
      >
        {0 === cartlist?.length ? (
          <p>No Produk dalam keranjang.</p>
        ) : (
          <>
            <div className="dropdown-cart-products">
              {cartlist?.map((item) => (
                <div className="product justify-content-between" key={item.cartId}>
                  <div className="product-cart-details">
                    <h4 className="product-title">
                      <Link href={`/produk/${item.slug.current}`}>
                        {item.name}
                      </Link>
                    </h4>

                    {/* <div className="cart-product-info">
                      {item?.nicotinePercentage}% Nicotine
                    </div> */}

                    <span className="cart-product-info">
                      <span className="cart-product-qty">{item.qty} </span>x Rp{" "}
                      {session && session?.user?.type === 'business' ? item?.business_price?.toFixed(3) : item?.sale_price
                        ? item.sale_price.toFixed(3)
                        : item.price.toFixed(3)}
                    </span>
                  </div>

                  <figure className="product-image-container ml-2">
                    <Link
                      href={`/produk/${item.slug.current}`}
                      className="product-image"
                    >
                      <Image
                        src={urlFor(item.pictures?.[0])?.url()}
                        // fill
                        height={50}
                        width={50}
                        alt="product"
                      />
                    </Link>
                  </figure>
                  <button
                    className="btn-remove"
                    title="Remove Product"
                    onClick={() => dispatch(removeFromCart(item.cartId))}
                  >
                    <i className="icon-close"></i>
                  </button>
                </div>
              ))}
            </div>
            <div className="dropdown-cart-total flex justify-between w-full">
              <span>Total</span>
              <div>


              {discount?.percentage ? <span className="cart-total-price !text-[1.45rem] line-through pr-1">
                Rp{" "}
                {cartPriceTotal(cartlist)?.toLocaleString(undefined, {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}
              </span> : null}
              <span className="cart-total-price !text-[1.6rem] text-[#ef837b]">
                Rp{" "}
                {cartPriceTotalDiscount(cartPriceTotal(cartlist), discount?.percentage)?.toLocaleString(undefined, {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}
              </span>
              </div>

            </div>

            <div className="dropdown-cart-action">
              <Link href="/keranjang" className="btn btn-primary w-full">
                View Cart
              </Link>
              {/* <Link href="/checkout" className="btn btn-outline-primary-2">
                <span>Checkout</span>
                <i className="icon-long-arrow-right"></i>
              </Link> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartMenu;
