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

  // Check if user is business account (FIXED: use accountType)
  const isBusinessUser = session?.user?.accountType === 'business';

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

  // Get base product name without color
  const getBaseProductName = (item) => {
    return item.originalProduct?.name || item.originalName || item.name;
  };

  // CRITICAL FIX: Get the actual price that was stored when item was added to cart
  const getStoredItemPrice = (item) => {
    console.log("Getting price for:", item.name, {
      effectivePrice: item.effectivePrice,
      unitPrice: item.unitPrice,
      isBusinessUser: item.isBusinessUser,
      business_price: item.business_price,
      sale_price: item.sale_price,
      price: item.price
    });

    // Priority order for getting the correct stored price
    if (item.effectivePrice) {
      return item.effectivePrice;
    }
    
    if (item.unitPrice) {
      return item.unitPrice;
    }

    // Fallback: recalculate based on stored context
    if (item.isBusinessUser && item.business_price) {
      return item.business_price;
    }
    
    if (item.sale_price && !item.isBusinessUser) {
      return item.sale_price;
    }
    
    return item.price || 0;
  };

  // Function to get user data
  const getUserData = async () => {
    if (!session?.user?.email) return null;

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

  // Function to calculate the subtotal using stored prices
  const calculateSubtotal = () => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    
    return items.reduce((total, item) => {
      if (item && typeof item.sum === 'number') {
        return total + item.sum;
      }
      // Fallback calculation using stored price
      if (item) {
        const storedPrice = getStoredItemPrice(item);
        const qty = item.qty || 1;
        return total + (storedPrice * qty);
      }
      return total;
    }, 0);
  };

  // Function to count product types
  const countProductTypes = (items, productType) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.filter(item => item?.productType === productType)
      .reduce((count, item) => count + (item.qty || 1), 0);
  };

  // Function to count products by name/type (for different devices)
  const countProductsByType = (items, type) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.filter(item => {
      const productName = (item.name || '').toLowerCase();
      const productType = (item.productType || '').toLowerCase();
      return productName.includes(type.toLowerCase()) || productType.includes(type.toLowerCase());
    }).reduce((count, item) => count + (item.qty || 1), 0);
  };

  // Function to calculate total for a product type using stored prices
  const getProductTypeTotal = (items, productType) => {
    if (!items || !Array.isArray(items)) return 0;
    return items
      .filter(item => item?.productType === productType)
      .reduce((total, item) => {
        // Use the stored sum or calculate from stored price
        if (item.sum) return total + item.sum;
        return total + (getStoredItemPrice(item) * (item.qty || 1));
      }, 0);
  };

  // Function to check if discounts are eligible (FIXED: use accountType)
  const isEligibleForDiscounts = () => {
    return !session || session?.user?.accountType !== 'business';
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
    return countProductTypes(items, 'bottle');
  };

  // UPDATED: Create a single source of truth for discount calculation with corrected bundles
  const calculateDiscount = async (cartItems, manualDiscount = null) => {
    if (!cartItems || cartItems.length === 0) return null;

    try {
      // Ensure all items have necessary properties using stored prices
      const validItems = cartItems.map(item => ({
        ...item,
        qty: item.qty || 1,
        sum: typeof item.sum === 'number' ? item.sum : (getStoredItemPrice(item) * (item.qty || 1)),
        productType: item.productType
      }));

      // Calculate base subtotal using stored prices
      const subtotal = validItems.reduce((total, item) => total + item.sum, 0);

      // If there's a manual discount, apply it
      if (manualDiscount && manualDiscount.percentage) {
        const discountAmount = subtotal * (manualDiscount.percentage / 100);
        return {
          original: subtotal,
          discount: discountAmount,
          total: subtotal - discountAmount,
          discountDetails: {
            name: manualDiscount.name || "Diskon",
            percentage: manualDiscount.percentage,
            amount: discountAmount,
            message: `Diskon ${manualDiscount.percentage}% diterapkan`
          }
        };
      }

      // Initialize variables for bundles 
      const bottleCount = countProductTypes(validItems, 'bottle');
      const hasAryaPrime = hasAryaPrimeDevice();
      const hasPod = hasPodPack();
      const bottleTotal = getProductTypeTotal(validItems, 'bottle');

      // Initialize best discount
      let bestDiscount = {
        amount: 0,
        details: null
      };

      // Get user data if logged in
      const userDataObj = await getUserData();
      
      // Check for first order discount (logged in users only)
      if (session?.user && userDataObj?.orderCount === 0) {
        const discountAmount = subtotal * 0.15; // 15% first order discount
        
        if (discountAmount > bestDiscount.amount) {
          bestDiscount = {
            amount: discountAmount,
            details: {
              name: "Diskon Pesanan Pertama",
              percentage: 15,
              amount: discountAmount,
              message: "Diskon 15% untuk pesanan pertama",
              type: "first"
            }
          };
        }
      }

      // If not a business account, check for bundle discounts
      if (isEligibleForDiscounts()) {
        // UPDATED BUNDLE DISCOUNTS:
        
        // Arya Prime + 3 bottles: 35% off
        if (hasAryaPrime && bottleCount >= 3) {
          const discountAmount = bottleTotal * 0.35;
          
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Diskon Bundle Arya Prime",
                percentage: 35,
                amount: discountAmount,
                message: `Arya Prime + ${bottleCount} botol: 35% off botol`,
                type: "bundle"
              }
            };
          }
        }
        // Pod Pack + 3 bottles: 30% off bottles
        else if (hasPod && bottleCount >= 3) {
          const discountAmount = bottleTotal * 0.3;
          
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Diskon Bundle Pod Pack",
                percentage: 30,
                amount: discountAmount,
                message: `Pod Pack + ${bottleCount} botol: 30% off botol`,
                type: "bundle"
              }
            };
          }
        }
        // Arya Prime Device + 1 bottle: 15% off
        else if (hasAryaPrime && bottleCount >= 1) {
          const discountAmount = bottleTotal * 0.15;
          
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Diskon Bundle Arya Prime",
                percentage: 15,
                amount: discountAmount,
                message: `Arya Prime + botol: 15% off botol`,
                type: "bundle"
              }
            };
          }
        }
        // 3 bottles: 20% off (standalone without devices)
        else if (!hasAryaPrime && !hasPod && bottleCount >= 3) {
          const discountAmount = bottleTotal * 0.2;
          
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Diskon Volume Botol",
                percentage: 20,
                amount: discountAmount,
                message: `Bundle ${bottleCount} botol: 20% off`,
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
      const subtotal = Array.isArray(cartItems) 
        ? cartItems.reduce((total, item) => total + (item?.sum || 0), 0)
        : 0;
      
      return {
        original: subtotal,
        discount: 0,
        total: subtotal,
        discountDetails: null
      };
    }
  };

  // CRITICAL FIX: Use a single useEffect to update the cart calculation
  useEffect(() => {
    // Don't proceed if cart is empty
    if (!items?.length) {
      setCartCalculation(null);
      return;
    }

    // Set loading state to prevent unnecessary recalculations
    setLoading(true);

    // Calculate discount using stored prices
    calculateDiscount(items, discount)
      .then(calculation => {
        setCartCalculation(calculation);
      })
      .catch(error => {
        console.error("Error calculating discount:", error);
        // Fallback to basic calculation using stored prices
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

  // User data loading
  useEffect(() => {
    if (session?.user) {
      getUserData().then(data => setUserData(data));
    }
  }, [session?.user]);

  // Change item quantity
  function changeQty(value, index) {
    const item = items[index];
    if (item) {
      dispatch(updateItemQuantity({ cartId: item.cartId, qty: value }));
    }
  }

  // Handle discount code application
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

      // For testing - apply a hard-coded discount
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

      // Check for discount codes in the database
      const res = await client.fetch(`*[_type == 'discount' && code=='${code}' && (email == '${session?.user?.email}' || email == null)] {
        ...
      }`);

      // If no discount found, check if it's a referral code
      if (!res?.length) {
        const referralCheck = await client.fetch(`*[_type == 'user' && referralCode=='${code}' && email != '${session?.user?.email}'][0]`);
        
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
        
        toast.error("Kode diskon tidak valid");
        return;
      }

      // Apply database discount to Redux
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

  // Update cart animation
  function updateCart(e) {
    let button = e.currentTarget;
    button.querySelector(".icon-refresh").classList.add("load-more-rotating");

    setTimeout(() => {
      button
        .querySelector(".icon-refresh")
        .classList.remove("load-more-rotating");
    }, 400);
  }

  // Handle checkout
  const handleCheckout = (e) => {
    e.preventDefault();
    
    if (!session) {
      router.push("/auth/masuk");
      return;
    }
    
    if (items?.length < 1) {
      toast.error("Tidak ada produk dalam keranjang");
      return;
    }

    try {
      router.push("/checkout");
    } catch (error) {
      console.error("Router.push failed:", error);
      window.location.href = "/checkout";
    }
  };

  // Format price with locale
  const formatPrice = (price) => {
    return price.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Handle removing a discount
  const handleRemoveDiscount = () => {
    dispatch(removeDiscount());
  };

  // Get display subtotal and discount totals from cartCalculation
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
                                
                                {/* Color information display */}
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

                                {/* Business pricing indicator */}
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

                                {/* Stock info for colored products */}
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
                            {/* CRITICAL FIX: Use stored price */}
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
                              Diskon
                              {cartCalculation.discountDetails.name || discount?.name || "Diskon"}
                              {cartCalculation.discountDetails.percentage 
                                ? ` - ${cartCalculation.discountDetails.percentage}%` 
                                : discount?.percentage ? ` - ${discount.percentage}%` : ''}
                              {cartCalculation.discountDetails.message && 
                                <small className="d-block text-muted">{cartCalculation.discountDetails.message}</small>}
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

                    {/* UPDATED: Display eligible discounts info for customers */}
                    {isEligibleForDiscounts() && items.length > 0 && !cartCalculation?.discountDetails && (
                      <div className="alert alert-info pb-1 pt-1 mb-2 mt-2">
                        <small>
                          {!session && "Daftar untuk mendapat diskon! "}
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
                      disabled={items.length < 1}
                      onClick={handleCheckout}
                    >
                      LANJUT KE CHECKOUT
                    </button>
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