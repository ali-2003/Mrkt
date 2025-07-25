// app/cart/page.js
"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/features/page-header";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  applyDiscount,
  emptyCart,
  removeFromCart,
  updateItemQuantity,
  removeDiscount
} from "@/redux/slice/cartSlice";
import urlFor from "@/sanity/lib/image";
import { client } from "@/sanity/lib/client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Qty from "@/components/features/qty";

function CartPageComponent() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartCalculation, setCartCalculation] = useState(null);
  const [userData, setUserData] = useState(null);

  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const cart = useSelector((state) => state.cart);
  const { items, discount } = cart;

  // Check if user is business account
  const isBusinessUser = session?.user?.accountType === 'business';

  // Enhanced function to get the correct cart image
  const getCartImage = (item) => {
    if (item.cartImage) {
      return urlFor(item.cartImage).url();
    } else if (item.selectedColor?.pictures && item.selectedColor.pictures[0]) {
      return urlFor(item.selectedColor.pictures[0]).url();
    } else if (item.pictures && item.pictures.length > 0) {
      return urlFor(item.pictures[0]).url();
    }
    return '/placeholder-image.jpg';
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

  // Get base product name without color
  const getBaseProductName = (item) => {
    return item.originalProduct?.name || item.originalName || item.name;
  };

  // Get the actual price that was stored when item was added to cart
  const getStoredItemPrice = (item) => {
    if (item.effectivePrice) {
      return item.effectivePrice;
    }
    
    if (item.unitPrice) {
      return item.unitPrice;
    }

    if (item.isBusinessUser && item.business_price) {
      return item.business_price;
    }
    
    if (item.sale_price && !item.isBusinessUser) {
      return item.sale_price;
    }
    
    return item.price || 0;
  };

  // Function to get user data (modified to handle non-authenticated users)
  const getUserData = async () => {
    if (!session?.user?.email) return { orderCount: 0, lifetimeSpend: 0 };

    try {
      const userData = await client.fetch(
        `*[_type == 'user' && email == $email][0]{
          ...,
          "orderCount": count(*[_type == 'order' && email == $email]), 
          "lifetimeSpend": sum(*[_type == 'order' && email == $email].totalPrice)
        }`,
        { email: session.user.email }
      );
      return userData || { orderCount: 0, lifetimeSpend: 0 };
    } catch (err) {
      console.error("Error fetching user data:", err);
      return { orderCount: 0, lifetimeSpend: 0 };
    }
  };

  // UPDATED: Modified discount calculation to work with guest users
  const calculateCartTotals = async () => {
    if (!items || items.length === 0) return null;

    try {
      // Get user data for first order discount calculation (only for logged-in users)
      const getUserDataForDiscount = async () => {
        if (!session?.user?.email) return { orderCount: 0, lifetimeSpend: 0 };
        try {
          const userData = await client.fetch(
            `*[_type == 'user' && email == $email][0]{
              ...,
              "orderCount": count(*[_type == 'order' && email == $email]), 
              "lifetimeSpend": sum(*[_type == 'order' && email == $email].totalPrice)
            }`,
            { email: session.user.email }
          );
          return userData || { orderCount: 0, lifetimeSpend: 0 };
        } catch (err) {
          console.error("Error fetching user data:", err);
          return { orderCount: 0, lifetimeSpend: 0 };
        }
      };

      // Ensure all items have necessary properties
      const validItems = items.map(item => ({
        ...item,
        qty: item.qty || 1,
        sum: typeof item.sum === 'number' ? item.sum : (item.sale_price || item.price || 0) * (item.qty || 1),
        productType: item.productType
      }));

      // Calculate base subtotal
      const subtotal = validItems.reduce((total, item) => total + item.sum, 0);

      // If there's a manual discount applied, use it
      if (discount && discount.percentage) {
        const discountAmount = subtotal * (discount.percentage / 100);
        return {
          original: subtotal,
          discount: discountAmount,
          total: subtotal - discountAmount,
          discountDetails: {
            name: discount.name || "Diskon",
            percentage: discount.percentage,
            amount: discountAmount,
            type: discount.type
          }
        };
      }

      // Otherwise check for automatic discounts
      const userDataObj = await getUserDataForDiscount();
      
      // Helper functions
      const countProductTypes = (items, productType) => {
        return items.filter(item => item?.productType === productType)
          .reduce((count, item) => count + (item.qty || 1), 0);
      };
      
      const getProductTypeTotal = (items, productType) => {
        return items
          .filter(item => item?.productType === productType)
          .reduce((total, item) => total + (item.sum || 0), 0);
      };
      
      // Updated: Allow discounts for non-business users (including guests)
      const isEligibleForDiscounts = () => {
        return !session?.user?.accountType || session?.user?.accountType !== 'business';
      };

      const bottleCount = countProductTypes(validItems, 'bottle');
      const hasPodDevice = countProductTypes(validItems, 'pod') > 0;
      const bottleTotal = getProductTypeTotal(validItems, 'bottle');

      let bestDiscount = { amount: 0, details: null };

      // Check for first order discount (ONLY for logged in users with no previous orders)
      if (session?.user && userDataObj?.orderCount === 0) {
        const discountAmount = subtotal * 0.2; // 20% first order discount
        if (discountAmount > bestDiscount.amount) {
          bestDiscount = {
            amount: discountAmount,
            details: {
              name: "Diskon Pesanan Pertama",
              percentage: 15, // Display as 15% but calculate 20%
              amount: discountAmount,
              type: "first"
            }
          };
        }
      }

      // Bundle and volume discounts available for all non-business users (including guests)
      if (isEligibleForDiscounts()) {
        if (hasPodDevice && bottleCount >= 3) {
          const discountAmount = bottleTotal * 0.5;
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Diskon Bundle",
                percentage: 50,
                amount: discountAmount,
                type: "bundle"
              }
            };
          }
        } else if (hasPodDevice && bottleCount > 0) {
          const discountAmount = bottleTotal * 0.3;
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Diskon Bundle", 
                percentage: 30,
                amount: discountAmount,
                type: "bundle"
              }
            };
          }
        } else if (bottleCount >= 5) {
          const discountAmount = bottleTotal * 0.3;
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Diskon Volume",
                percentage: 30,
                amount: discountAmount,
                type: "volume"
              }
            };
          }
        } else if (bottleCount >= 3) {
          const discountAmount = bottleTotal * 0.2;
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Diskon Volume",
                percentage: 20,
                amount: discountAmount,
                type: "volume"
              }
            };
          }
        }
      }

      // Apply the best discount if any
      if (bestDiscount.amount > 0 && bestDiscount.details) {
        return {
          original: subtotal,
          discount: bestDiscount.amount,
          total: subtotal - bestDiscount.amount,
          discountDetails: bestDiscount.details
        };
      }

      // No discounts apply
      return {
        original: subtotal,
        discount: 0,
        total: subtotal,
        discountDetails: null
      };

    } catch (error) {
      console.error("Error in discount calculation:", error);
      const subtotal = items.reduce((total, item) => total + (item?.sum || 0), 0);
      return {
        original: subtotal,
        discount: 0,
        total: subtotal,
        discountDetails: null
      };
    }
  };

  // Function to calculate the subtotal using stored prices
  const calculateSubtotal = () => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    
    return items.reduce((total, item) => {
      if (item && typeof item.sum === 'number') {
        return total + item.sum;
      }
      if (item) {
        const storedPrice = getStoredItemPrice(item);
        const qty = item.qty || 1;
        return total + (storedPrice * qty);
      }
      return total;
    }, 0);
  };

  // Check if cart has specific device types
  const hasAryaPrimeDevice = () => {
    return items.some(item => {
      const productName = (item.name || '').toLowerCase();
      const productType = (item.productType || '').toLowerCase();
      return productName.includes('arya prime') || productType.includes('aryaprime') || productType.includes('arya_prime');
    });
  };

  const hasPodPack = () => {
    return items.some(item => {
      const productName = (item.name || '').toLowerCase();
      const productType = (item.productType || '').toLowerCase();
      return (productName.includes('pod') && !productName.includes('arya prime')) || productType === 'pod';
    });
  };

  // Count number of bottles in cart
  const getBottleCount = () => {
    return items.filter(item => item?.productType === 'bottle')
      .reduce((count, item) => count + (item.qty || 1), 0);
  };

  // Function to check if discounts are eligible (updated for guest users)
  const isEligibleForDiscounts = () => {
    return !session?.user?.accountType || session?.user?.accountType !== 'business';
  };

  // Updated calculation effect
  useEffect(() => {
    if (!items?.length) {
      setCartCalculation(null);
      return;
    }

    setLoading(true);

    calculateCartTotals()
      .then(calculation => {
        setCartCalculation(calculation);
      })
      .catch(error => {
        console.error("Error calculating discount:", error);
        const subtotal = calculateSubtotal();
        setCartCalculation({
          original: subtotal,
          discount: 0,
          total: subtotal,
          discountDetails: null
        });
      })
      .finally(() => {
        setLoading(false);
      });

  }, [items, session?.user, discount]);

  useEffect(() => {
    if (session?.user) {
      getUserData().then(data => setUserData(data));
    } else {
      setUserData({ orderCount: 0, lifetimeSpend: 0 });
    }
  }, [session?.user]);

  // ABANDONMENT EMAIL TRACKING - Track cart status changes
  useEffect(() => {
    if (window.abandonmentSystem && items) {
      window.abandonmentSystem.updateCartStatus(items.length > 0);
    }
  }, [items]);

  function changeQty(value, index) {
    const item = items[index];
    if (item) {
      dispatch(updateItemQuantity({ cartId: item.cartId, qty: value }));
    }
  }

  // Updated discount handler to work with guests
  const handleDiscount = async () => {
    try {
      if (discount) {
        toast.error("Hanya 1 diskon yang diizinkan per checkout");
        return;
      }
      
      if (!code.trim()) {
        toast.error("Harap masukkan kode diskon");
        return;
      }
      
      setLoading(true);

      if (code === "TEST") {
        const testDiscount = {
          code: "TEST",
          name: "Diskon Test",
          percentage: 25,
          type: "test"
        };
        
        dispatch(applyDiscount(testDiscount));
        toast.success("Diskon test diterapkan!");
        setCode("");
        return;
      }

      // Modified query to work with or without user email
      const userEmail = session?.user?.email || null;
      const res = await client.fetch(`*[_type == 'discount' && code=='${code}' && (email == '${userEmail}' || email == null)] {
        ...
      }`);

      if (!res?.length) {
        // Check referral code only if user is logged in
        if (session?.user?.email) {
          const referralCheck = await client.fetch(`*[_type == 'user' && referralCode=='${code}' && email != '${session.user.email}'][0]`);
          
          if (referralCheck) {
            const referralDiscount = {
              code: code,
              name: "Diskon Referral",
              percentage: 40,
              type: "referral",
              email: referralCheck.email
            };
            
            dispatch(applyDiscount(referralDiscount));
            toast.success("Diskon referral diterapkan!");
            setCode("");
            return;
          }
        }
        
        toast.error("Kode diskon tidak valid");
        return;
      }

      dispatch(applyDiscount(res[0]));
      toast.success("Diskon diterapkan!");
    } catch (err) {
      console.error("Error applying discount:", err);
      toast.error("Gagal menerapkan diskon");
    } finally {
      setLoading(false);
      setCode("");
    }
  };

  function updateCart(e) {
    let button = e.currentTarget;
    button.querySelector(".icon-refresh").classList.add("load-more-rotating");

    setTimeout(() => {
      button
        .querySelector(".icon-refresh")
        .classList.remove("load-more-rotating");
    }, 400);
  }

  // UPDATED: Remove mandatory login requirement
  const handleCheckout = (e) => {
    e.preventDefault();
    
    if (items?.length < 1) {
      toast.error("Tidak ada produk dalam keranjang");
      return;
    }

    try {
      // Show loading state
      setLoading(true);
      
      // Add a small delay to ensure cart state is properly saved
      setTimeout(() => {
        router.push("/checkout");
      }, 100);
      
    } catch (error) {
      console.error("Router.push failed:", error);
      // Fallback: try direct navigation
      try {
        window.location.href = "/checkout";
      } catch (fallbackError) {
        console.error("Fallback navigation failed:", fallbackError);
        toast.error("Gagal mengarahkan ke halaman checkout");
      }
    } finally {
      // Reset loading state after a delay
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleRemoveDiscount = () => {
    dispatch(removeDiscount());
  };

  const getDisplaySubtotal = () => {
    return cartCalculation?.original || calculateSubtotal();
  };

  const getAfterDiscountTotal = () => {
    return cartCalculation?.total || calculateSubtotal();
  };

  return (
    <div className="main">
      <PageHeader title="Keranjang Belanja" subTitle="Belanja" />
      <nav className="breadcrumb-nav">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item active">Keranjang Belanja</li>
          </ol>
        </div>
      </nav>

      <div className="page-content pb-5">
        <div className="cart">
          <div className="container">
            {items?.length > 0 ? (
              <div className="row">
                <div className="col-lg-9">
                  <table className="table table-cart table-mobile">
                    <thead>
                      <tr>
                        <th>Produk</th>
                        <th>Harga</th>
                        <th>Jumlah</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.cartId}>
                          <td className="product-col">
                            <div className="product">
                              <figure className="product-media">
                                <Link
                                  href={`/produk/${item.slug.current}`}
                                  className="product-image"
                                >
                                  <img
                                    src={getCartImage(item)}
                                    alt={getDisplayName(item)}
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                  />
                                </Link>
                              </figure>

                              <div className="product-details">
                                <h4 className="product-title">
                                  <Link href={`/produk/${item.slug.current}`}>
                                    {getBaseProductName(item)}
                                  </Link>
                                  {item.productType && (
                                    <span className="ml-2 text-sm text-neutral-500">
                                      ({item.productType})
                                    </span>
                                  )}
                                </h4>
                                
                                {item.selectedColor && (
                                  <div className="product-color-info" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginTop: '6px',
                                    gap: '8px'
                                  }}>
                                    <div 
                                      className="color-indicator"
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        backgroundColor: item.selectedColor.colorCode,
                                        borderRadius: '50%',
                                        border: '2px solid #fff',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        flexShrink: 0
                                      }}
                                    ></div>
                                    <span style={{
                                      fontSize: '13px',
                                      color: '#666',
                                      fontWeight: '500',
                                      textTransform: 'capitalize'
                                    }}>
                                      Warna: {item.selectedColor.colorName}
                                    </span>
                                  </div>
                                )}

                                {item.isBusinessUser && (
                                  <div className="business-price-info" style={{
                                    fontSize: '12px',
                                    color: '#667eea',
                                    marginTop: '4px',
                                    fontWeight: '500'
                                  }}>
                                    Harga Bisnis Diterapkan
                                  </div>
                                )}

                                {item.selectedColor?.stock && (
                                  <div className="stock-info" style={{
                                    fontSize: '12px',
                                    color: item.selectedColor.stock < 5 ? '#e74c3c' : '#27ae60',
                                    marginTop: '4px'
                                  }}>
                                    {item.selectedColor.stock < 5 ? 
                                      `Hanya ${item.selectedColor.stock} tersisa dalam warna ${item.selectedColor.colorName}` : 
                                      `${item.selectedColor.stock} tersedia dalam warna ${item.selectedColor.colorName}`
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="price-col">
                            Rp {formatPrice(getStoredItemPrice(item))}
                          </td>

                          <td className="quantity-col">
                            <Qty
                              value={item.qty}
                              changeQty={(current) => changeQty(current, index)}
                              adClass="cart-product-quantity"
                              max={item.selectedColor?.stock || item.stock || 999}
                            />
                          </td>

                          <td className="total-col">
                            Rp {formatPrice(item.sum)}
                          </td>

                          <td className="remove-col">
                            <button
                              className="btn-remove"
                              onClick={() => dispatch(removeFromCart(item.cartId))}
                            >
                              <i className="icon-close"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="cart-bottom">
                    <div className="cart-discount">
                      {isEligibleForDiscounts() && !discount && (
                        <form onSubmit={(e) => { e.preventDefault(); handleDiscount(); }}>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              required
                              placeholder="kode kupon"
                              value={code}
                              onChange={(e) => setCode(e.target.value)}
                            />
                            <div className="input-group-append">
                              <button
                                className="btn btn-outline-primary-2"
                                type="submit"
                                disabled={loading}
                              >
                                <i
                                  className={
                                    loading
                                      ? "icon-refresh load-more-rotating"
                                      : "icon-long-arrow-right"
                                  }
                                ></i>
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                      
                      {discount && (
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-success">
                              {discount.name} {discount.percentage ? `(${discount.percentage}%)` : ''} diterapkan
                            </span>
                          </div>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={handleRemoveDiscount}
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      className="btn btn-outline-dark-2"
                      onClick={updateCart}
                    >
                      <span>PERBARUI KERANJANG</span>
                      <i className="icon-refresh"></i>
                    </button>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="summary summary-cart">
                    <h3 className="summary-title">Total Keranjang</h3>

                    <table className="table table-summary">
                      <tbody>
                        <tr className="summary-shipping">
                          <td className="!pb-0">Subtotal:</td>
                          <td className="pb-0">
                            Rp {formatPrice(getDisplaySubtotal())}
                          </td>
                        </tr>
                        
                        {cartCalculation?.discount > 0 && cartCalculation?.discountDetails && (
                          <tr className="summary-shipping">
                            <td className="py-0">
                              {cartCalculation.discountDetails.name}
                              {cartCalculation.discountDetails.percentage 
                                ? ` (${cartCalculation.discountDetails.percentage}%)` 
                                : ''}
                            </td>
                            <td className="text-[#ef837b] py-0">
                              - Rp {formatPrice(cartCalculation.discount)}
                            </td>
                          </tr>
                        )}
                        
                        <tr className="summary-subtotal">
                          <td>Subtotal Setelah Diskon:</td>
                          <td>
                            Rp {formatPrice(getAfterDiscountTotal())}
                          </td>
                        </tr>

                        <tr className="summary-total">
                          <td>Total:</td>
                          <td>
                            Rp {formatPrice(getAfterDiscountTotal())}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Updated discount hint message */}
                    {isEligibleForDiscounts() && items.length > 0 && !cartCalculation?.discountDetails && (
                      <div className="alert alert-info pb-1 pt-1 mb-2 mt-2">
                        <small>
                          {!session && "Masuk untuk mendapat diskon pesanan pertama 15%! "}
                          {session && userData?.orderCount === 0 && "Diskon pesanan pertama: 15% off! "}
                          {hasAryaPrimeDevice() && getBottleCount() >= 3 && "Arya Prime + 3 botol: 35% off botol! "}
                          {hasAryaPrimeDevice() && getBottleCount() >= 1 && getBottleCount() < 3 && "Arya Prime + botol: 15% off botol! "}
                          {hasPodPack() && getBottleCount() >= 3 && "Pod Pack + 3 botol: 30% off botol! "}
                          {!hasAryaPrimeDevice() && !hasPodPack() && getBottleCount() >= 3 && "Bundle 3 botol: 20% off! "}
                        </small>
                      </div>
                    )}

                    <button
                      className="btn btn-outline-primary-2 btn-order btn-block"
                      type="button"
                      disabled={items.length < 1 || loading}
                      onClick={handleCheckout}
                    >
                      {loading ? "Memuat..." : "LANJUT KE CHECKOUT"}
                    </button>

                    {/* Login suggestion for guests */}
                    {!session && (
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          Sudah punya akun? <Link href="/auth/masuk" className="text-primary">Masuk</Link> untuk diskon khusus!
                        </small>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/ejuice"
                    className="btn btn-outline-dark-2 btn-block mb-3"
                  >
                    <span>LANJUT BELANJA</span>
                    <i className="icon-refresh"></i>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="row">
                <div className="col-12">
                  <div className="cart-empty-page text-center">
                    <i
                      className="cart-empty icon-shopping-cart"
                      style={{ lineHeight: 1, fontSize: "15rem" }}
                    ></i>
                    <p className="px-3 py-2 cart-empty mb-3">
                      Tidak ada produk dalam keranjang
                    </p>
                    <p className="return-to-shop mb-0">
                      <Link href="/ejuice" className="btn btn-primary">
                        Kembali ke Beranda
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPageComponent;