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

  // Enhanced function to get the correct cart image
  const getCartImage = (item) => {
    // Priority: cartImage > selectedColor first image > regular pictures
    if (item.cartImage) {
      return urlFor(item.cartImage).url();
    } else if (item.selectedColor?.pictures && item.selectedColor.pictures[0]) {
      return urlFor(item.selectedColor.pictures[0]).url();
    } else if (item.pictures && item.pictures.length > 0) {
      return urlFor(item.pictures[0]).url();
    }
    return '/placeholder-image.jpg'; // Fallback
  };

  // Enhanced function to get display name with color
  const getDisplayName = (item) => {
    if (item.displayName) {
      return item.displayName;
    } else if (item.selectedColor) {
      return `${item.name} - ${item.selectedColor.colorName}`;
    }
    return item.name;
  };

  // Get base product name without color for the link
  const getBaseProductName = (item) => {
    return item.originalProduct?.name || item.name;
  };

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
                        {getBaseProductName(item)}
                      </Link>
                    </h4>

                    {/* Color information display */}
                    {item.selectedColor && (
                      <div className="cart-color-info" style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '4px',
                        marginBottom: '4px',
                        gap: '6px'
                      }}>
                        <div 
                          className="color-indicator-mini"
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: item.selectedColor.colorCode,
                            borderRadius: '50%',
                            border: '1px solid #ddd',
                            flexShrink: 0
                          }}
                        ></div>
                        <span style={{
                          fontSize: '11px',
                          color: '#666',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {item.selectedColor.colorName}
                        </span>
                      </div>
                    )}

                    {/* Product type display */}
                    {item.productType && (
                      <div className="cart-product-type" style={{
                        fontSize: '10px',
                        color: '#999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '2px'
                      }}>
                        {item.productType}
                      </div>
                    )}

                    <span className="cart-product-info">
                      <span className="cart-product-qty">{item.qty} </span>x Rp{" "}
                      {session && session?.user?.type === 'business' ? item?.business_price?.toFixed(3) : item?.sale_price
                        ? item.sale_price.toFixed(3)
                        : item.price.toFixed(3)}
                    </span>

                    {/* Stock warning for colored products */}
                    {item.selectedColor?.stock && item.selectedColor.stock < 5 && (
                      <div style={{
                        fontSize: '9px',
                        color: '#e74c3c',
                        marginTop: '2px'
                      }}>
                        Only {item.selectedColor.stock} left
                      </div>
                    )}
                  </div>

                  <figure className="product-image-container ml-2">
                    <Link
                      href={`/produk/${item.slug.current}`}
                      className="product-image"
                    >
                      <Image
                        src={getCartImage(item)}
                        height={50}
                        width={50}
                        alt={getDisplayName(item)}
                        style={{ 
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: item.selectedColor ? `2px solid ${item.selectedColor.colorCode}20` : 'none'
                        }}
                      />
                    </Link>
                  </figure>
                  
                  <button
                    className="btn-remove"
                    title={`Remove ${getDisplayName(item)}`}
                    onClick={() => dispatch(removeFromCart(item.cartId))}
                  >
                    <i className="icon-close"></i>
                  </button>
                </div>
              ))}
            </div>
            
            {/* Color summary section (shows what colors are in cart) */}
            {cartlist.some(item => item.selectedColor) && (
              <div className="dropdown-cart-colors" style={{
                padding: '8px 15px',
                borderTop: '1px solid #eee',
                borderBottom: '1px solid #eee',
                background: '#f9f9f9'
              }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                  Colors in cart:
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[...new Map(
                    cartlist
                      .filter(item => item.selectedColor)
                      .map(item => [item.selectedColor.colorName, item.selectedColor])
                  ).values()].map((color, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: '#fff',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '9px',
                      border: '1px solid #ddd'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: color.colorCode,
                        borderRadius: '50%',
                        border: '1px solid #ccc'
                      }}></div>
                      <span style={{ textTransform: 'capitalize' }}>
                        {color.colorName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
                View Cart ({cartQtyTotal(cartlist)} items)
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartMenu;