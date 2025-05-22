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
  const [shippingCost, setShippingCost] = useState(0);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartCalculation, setCartCalculation] = useState(null);
  const [userData, setUserData] = useState(null);

  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const cart = useSelector((state) => state.cart);
  const { items, discount } = cart;

  // Function to get user data
  const getUserData = async () => {
    if (!session?.user?.email) return null;

    try {
      const userData = await client.fetch(
        `*[_type == 'user' && email == $email][0]{
          ...,
          "orderCount": count(*[_type == 'order' && customerEmail == $email]), 
          "lifetimeSpend": sum(*[_type == 'order' && customerEmail == $email].total)
        }`,
        { email: session.user.email }
      );
      return userData || { orderCount: 0, lifetimeSpend: 0 };
    } catch (err) {
      console.error("Error fetching user data:", err);
      return { orderCount: 0, lifetimeSpend: 0 };
    }
  };

  // Function to calculate the subtotal
  const calculateSubtotal = () => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    
    return items.reduce((total, item) => {
      if (item && typeof item.sum === 'number') {
        return total + item.sum;
      }
      // Fallback calculation if sum is not available
      if (item) {
        const price = item.sale_price || item.price || 0;
        const qty = item.qty || 1;
        return total + (price * qty);
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

  // Function to calculate total for a product type
  const getProductTypeTotal = (items, productType) => {
    if (!items || !Array.isArray(items)) return 0;
    return items
      .filter(item => item?.productType === productType)
      .reduce((total, item) => total + (item.sum || 0), 0);
  };

  // Function to check if discounts are eligible
  const isEligibleForDiscounts = () => {
    return !session || session?.user?.type !== 'business';
  };

  // Check if cart has pod devices
  const hasPodDevices = () => {
    return items.some(item => item.productType === 'pod');
  };

  // Count number of bottles in cart
  const getBottleCount = () => {
    return countProductTypes(items, 'bottle');
  };

  // CRITICAL FIX: Create a single source of truth for discount calculation
  const calculateDiscount = async (cartItems, manualDiscount = null) => {
    if (!cartItems || cartItems.length === 0) return null;

    try {
      // Ensure all items have necessary properties
      const validItems = cartItems.map(item => ({
        ...item,
        qty: item.qty || 1,
        sum: typeof item.sum === 'number' ? item.sum : (item.sale_price || item.price || 0) * (item.qty || 1),
        productType: item.productType
      }));

      // Calculate base subtotal
      const subtotal = validItems.reduce((total, item) => total + item.sum, 0);

      // For debugging:
      console.log("Cart items:", validItems.map(item => ({
        name: item.name,
        productType: item.productType,
        qty: item.qty,
        sum: item.sum
      })));
      
      // If there's a manual discount, apply it
      if (manualDiscount && manualDiscount.percentage) {
        console.log("Applying manual discount:", manualDiscount);
        const discountAmount = subtotal * (manualDiscount.percentage / 100);
        return {
          original: subtotal,
          discount: discountAmount,
          total: subtotal - discountAmount,
          discountDetails: {
            name: manualDiscount.name || "Discount",
            percentage: manualDiscount.percentage,
            message: `${manualDiscount.percentage}% discount applied`
          }
        };
      }

      // Initialize variables for bundles 
      const bottleCount = countProductTypes(validItems, 'bottle');
      const hasPodDevice = countProductTypes(validItems, 'pod') > 0;
      const bottleTotal = getProductTypeTotal(validItems, 'bottle');
      
      console.log("Bottle count:", bottleCount);
      console.log("Has pods:", hasPodDevice);
      console.log("Bottle total:", bottleTotal);

      // Initialize best discount
      let bestDiscount = {
        amount: 0,
        details: null
      };

      // Otherwise check for automatic discounts
      // Get user data if logged in
      const userDataObj = await getUserData();
      
      // IMPORTANT: For testing purposes, let's check ALL potential discounts
      // and apply the best one, rather than having a fixed precedence

      // Check for first order discount (logged in users only)
      if (session?.user && userDataObj?.orderCount === 0) {
        const discountAmount = subtotal * 0.2; // 20% first order discount
        console.log("First order discount possible:", discountAmount);
        
        if (discountAmount > bestDiscount.amount) {
          bestDiscount = {
            amount: discountAmount,
            details: {
              name: "First Order Discount",
              percentage: 20,
              message: "20% off your first order"
            }
          };
        }
      }

      // If not a business account, check for bundle discounts
      if (isEligibleForDiscounts()) {
        // Pod + 3+ bottles: 50% off bottles
        if (hasPodDevice && bottleCount >= 3) {
          const discountAmount = bottleTotal * 0.5;
          console.log("Pod + 3+ bottles discount possible:", discountAmount);
          
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Bundle Discount",
                percentage: 50,
                message: `Pod device + ${bottleCount} bottles: 50% off bottles`
              }
            };
          }
        } 
        // Pod + 1-2 bottles: 30% off bottles
        else if (hasPodDevice && bottleCount > 0) {
          const discountAmount = bottleTotal * 0.3;
          console.log("Pod + 1-2 bottles discount possible:", discountAmount);
          
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Bundle Discount",
                percentage: 30,
                message: `Pod device + bottle: 30% off bottle`
              }
            };
          }
        } 
        // 5+ bottles: 30% off
        else if (bottleCount >= 5) {
          const discountAmount = bottleTotal * 0.3;
          console.log("5+ bottles discount possible:", discountAmount);
          
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Volume Discount",
                percentage: 30,
                message: `${bottleCount} bottles bundle: 30% off`
              }
            };
          }
        } 
        // 3-4 bottles: 20% off
        else if (bottleCount >= 3) {
          const discountAmount = bottleTotal * 0.2;
          console.log("3-4 bottles discount possible:", discountAmount);
          
          if (discountAmount > bestDiscount.amount) {
            bestDiscount = {
              amount: discountAmount,
              details: {
                name: "Volume Discount",
                percentage: 20,
                message: `${bottleCount} bottles bundle: 20% off`
              }
            };
          }
        }
      }

      console.log("Best discount selected:", bestDiscount);

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

    // Calculate discount - key change here is to pass the discount directly
    calculateDiscount(items, discount)
      .then(calculation => {
        console.log("Setting cart calculation:", calculation);
        setCartCalculation(calculation);
      })
      .catch(error => {
        console.error("Error calculating discount:", error);
        // Fallback to basic calculation
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

  }, [items, session?.user, discount]); // Include discount in dependencies

  // FIX: Use a simpler mechanism for user data loading
  useEffect(() => {
    if (session?.user) {
      getUserData().then(data => setUserData(data));
    }
  }, [session?.user]);

  // Change shipping cost
  function onChangeShipping(value) {
    setShippingCost(value);
  }

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
        toast.error("Only 1 discount allowed per checkout");
        return;
      }
      
      if (!code.trim()) {
        toast.error("Please enter a discount code");
        return;
      }
      
      setLoading(true);

      // For testing - apply a hard-coded discount
      if (code === "TEST") {
        console.log("Applying test discount");
        const testDiscount = {
          code: "TEST",
          name: "Test Discount",
          percentage: 25, // 25% off for test
          type: "test"
        };
        
        // Apply to Redux
        dispatch(applyDiscount(testDiscount));
        
        toast.success("Test discount applied!");
        setCode("");
        return;
      }

      // First check for discount codes in the database
      const res = await client.fetch(`*[_type == 'discount' && code=='${code}' && (email == '${session?.user?.email}' || email == null)] {
        ...
      }`);

      // If no discount found, check if it's a referral code
      if (!res?.length) {
        const referralCheck = await client.fetch(`*[_type == 'user' && referralCode=='${code}' && email != '${session?.user?.email}'][0]`);
        
        if (referralCheck) {
          // Create a referral discount object
          const referralDiscount = {
            code: code,
            name: "Referral Discount",
            percentage: 40, // 40% off for referrals
            type: "referral",
            referredBy: referralCheck.email
          };
          
          // Apply to Redux
          dispatch(applyDiscount(referralDiscount));
          
          toast.success("Referral discount applied!");
          setCode("");
          return;
        }
        
        toast.error("Invalid discount code");
        return;
      }

      // Apply database discount to Redux
      dispatch(applyDiscount(res[0]));
      
      toast.success("Discount applied!");
    } catch (err) {
      console.error("Error applying discount:", err);
      toast.error("Error applying discount");
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
  async function handleCheckout(e) {
    e.preventDefault();

    if (!session) {
      router.push("/auth/masuk");
      return;
    }
    
    if (items?.length < 1) {
      toast.error("No products in the cart");
      return;
    }

    setLoading(true);

    try {
      // Prepare cart items with product type information
      // FIXED: No longer use a default fallback here since products should have productType set
      const cartItems = items.map(item => ({
        ...item
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems,
          shippingCost,
          discount: cart?.discount,
          discountCalculation: cartCalculation,
          user: session?.user,
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Checkout failed");
      }
      
      dispatch(emptyCart());
      router.push(data.invoice_url);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err.message || "An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  }

  // Format price with locale
  const formatPrice = (price) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

  // Calculate final price for display
  const getItemPrice = (item) => {
    if (session && session?.user?.type === 'business') {
      return item?.business_price || item.price;
    }
    return item.sale_price || item.price;
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
      <PageHeader title="Keranjang Belanja" subTitle="Shop" />
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
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
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
                                    src={urlFor(item.pictures?.[0]).url()}
                                    alt={item.name}
                                  />
                                </Link>
                              </figure>

                              <h4 className="product-title">
                                <Link href={`/produk/${item.slug.current}`}>
                                  {item.name}
                                </Link>
                                {item.productType && (
                                  <span className="ml-2 text-sm text-neutral-500">
                                    ({item.productType})
                                  </span>
                                )}
                              </h4>
                            </div>
                          </td>

                          <td className="price-col">
                            Rp {formatPrice(getItemPrice(item))}
                          </td>

                          <td className="quantity-col">
                            <Qty
                              value={item.qty}
                              changeQty={(current) => changeQty(current, index)}
                              adClass="cart-product-quantity"
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
                              placeholder="coupon code"
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
                              {discount.name} {discount.percentage ? `(${discount.percentage}%)` : ''} applied
                            </span>
                          </div>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={handleRemoveDiscount}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      className="btn btn-outline-dark-2"
                      onClick={updateCart}
                    >
                      <span>UPDATE CART</span>
                      <i className="icon-refresh"></i>
                    </button>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="summary summary-cart">
                    <h3 className="summary-title">Cart Total</h3>

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
                              Discount <br />
                              {cartCalculation.discountDetails.name || discount?.name || "Discount"}
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
                          <td>Subtotal After Discount:</td>
                          <td>
                            Rp {formatPrice(getAfterDiscountTotal())}
                          </td>
                        </tr>
                        
                        {/* <tr className="summary-shipping">
                          <td>Shipping:</td>
                          <td>&nbsp;</td>
                        </tr>

                        <tr className="summary-shipping-row">
                          <td>
                            <div className="custom-control custom-radio">
                              <input
                                type="radio"
                                id="free-shipping"
                                name="shipping"
                                className="custom-control-input"
                                onChange={(e) => onChangeShipping(0)}
                                defaultChecked={true}
                              />
                              <label
                                className="custom-control-label"
                                htmlFor="free-shipping"
                              >
                                Free Shipping
                              </label>
                            </div>
                          </td>
                          <td>Rp 0.000</td>
                        </tr>

                        <tr className="summary-shipping-row">
                          <td>
                            <div className="custom-control custom-radio">
                              <input
                                type="radio"
                                id="standard-shipping"
                                name="shipping"
                                className="custom-control-input"
                                onChange={(e) => onChangeShipping(10000)}
                              />
                              <label
                                className="custom-control-label"
                                htmlFor="standard-shipping"
                              >
                                Standard:
                              </label>
                            </div>
                          </td>
                          <td>Rp 10.000</td>
                        </tr>

                        <tr className="summary-shipping-row">
                          <td>
                            <div className="custom-control custom-radio">
                              <input
                                type="radio"
                                id="express-shipping"
                                name="shipping"
                                className="custom-control-input"
                                onChange={(e) => onChangeShipping(20000)}
                              />
                              <label
                                className="custom-control-label"
                                htmlFor="express-shipping"
                              >
                                Express:
                              </label>
                            </div>
                          </td>
                          <td>Rp 20.000</td>
                        </tr> */}

                        <tr className="summary-total">
                          <td>Total:</td>
                          <td>
                            Rp {formatPrice(getAfterDiscountTotal())}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Display eligible discounts info for customers */}
                    {isEligibleForDiscounts() && items.length > 0 && !cartCalculation?.discountDetails && (
                      <div className="alert alert-info pb-1 pt-1 mb-2 mt-2">
                        <small>
                          {!session && "Sign up for discounts! "}
                          {session && userData?.orderCount === 0 && "First order discount: 20% off! "}
                          {hasPodDevices() && getBottleCount() >= 3 && "Pod + 3 bottles: 50% off bottles! "}
                          {hasPodDevices() && getBottleCount() > 0 && getBottleCount() < 3 && "Pod + bottle: 30% off bottle! "}
                          {!hasPodDevices() && getBottleCount() >= 5 && "5+ bottles bundle: 30% off! "}
                          {!hasPodDevices() && getBottleCount() >= 3 && getBottleCount() < 5 && "3+ bottles bundle: 20% off! "}
                        </small>
                      </div>
                    )}

                    <button
                      className="btn btn-outline-primary-2 btn-order btn-block"
                      type="button"
                      disabled={items.length < 1 || loading}
                      onClick={handleCheckout}
                    >
                      {loading ? 'Loading...' : 'PROCEED TO CHECKOUT'}
                    </button>
                  </div>

                  <Link
                    href="/ejuice"
                    className="btn btn-outline-dark-2 btn-block mb-3"
                  >
                    <span>CONTINUE SHOPPING</span>
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
                      No Produk dalam keranjang
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