// app/checkout/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { toast } from "react-toastify";
import { emptyCart } from "@/redux/slice/cartSlice";
import urlFor from "@/sanity/lib/image";

function CheckoutPageComponent() {
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    notes: ""
  });

  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  
  // Get cart data from Redux
  const cart = useSelector((state) => state.cart);
  const { items, discount } = cart;

  // Redirect if not logged in
  useEffect(() => {
    if (!session) {
      router.push("/auth/masuk");
      return;
    }
    
    // Pre-fill form with session data
    setFormData(prev => ({
      ...prev,
      fullName: session.user.name || "",
      email: session.user.email || ""
    }));
  }, [session, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!items || items.length === 0) {
      router.push("/keranjang"); // Updated to use correct cart URL
      return;
    }
  }, [items, router]);

  // Fetch shipping zones from Sanity
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const statesData = await client.fetch(`
          *[_type == 'shippingZone' && isActive == true] | order(state asc) {
            _id,
            state,
            stateCode,
            shippingCost,
            estimatedDays
          }
        `);
        setStates(statesData);
      } catch (error) {
        console.error("Error fetching shipping zones:", error);
        toast.error("Failed to load shipping information");
      }
    };

    fetchStates();
  }, []);

  // Calculate cart totals (using cart's calculation)
  const calculateSubtotal = () => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((total, item) => total + (item.sum || 0), 0);
  };

  const calculateDiscount = () => {
    if (!discount || !discount.percentage) return 0;
    const subtotal = calculateSubtotal();
    return subtotal * (discount.percentage / 100);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscount();
  const afterDiscountTotal = subtotal - discountAmount;
  const finalTotal = afterDiscountTotal + shippingCost;

  // Handle state selection and update shipping cost
  const handleStateChange = (e) => {
    const stateId = e.target.value;
    setSelectedState(stateId);
    
    const selectedStateData = states.find(state => state._id === stateId);
    if (selectedStateData) {
      setShippingCost(selectedStateData.shippingCost || 0);
      setFormData(prev => ({
        ...prev,
        state: selectedStateData.state
      }));
    } else {
      setShippingCost(0);
      setFormData(prev => ({
        ...prev,
        state: ""
      }));
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state'];
    
    for (let field of required) {
      if (!formData[field] || formData[field].trim() === '') {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    if (!selectedState) {
      toast.error("Please select a state");
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const shippingInfo = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        notes: formData.notes
      };

      // Prepare discount calculation in the format the API expects
      const discountCalculation = {
        original: subtotal,
        discount: discountAmount,
        total: afterDiscountTotal,
        discountDetails: discount ? {
          name: discount.name,
          percentage: discount.percentage,
          amount: discountAmount,
          message: discount.percentage ? `${discount.percentage}% discount applied` : 'Discount applied',
          type: discount.type
        } : null
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          shippingCost,
          discount,
          discountCalculation,
          user: session.user,
          shippingInfo
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Checkout failed");
      }

      // Clear cart and redirect to Xendit payment page
      dispatch(emptyCart());
      
      // Redirect to Xendit invoice URL
      window.location.href = data.invoice_url;

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return price.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Get cart image
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

  if (!session || !items || items.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="main">
      <div className="page-content">
        <div className="checkout">
          <div className="container">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Shipping Information */}
                <div className="col-lg-7">
                  <h2 className="checkout-title">Shipping Information</h2>
                  
                  <div className="row">
                    <div className="col-sm-6">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        className="form-control"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-sm-6">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-sm-6">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(+62) 812-3456-7890"
                        required
                      />
                    </div>
                    
                    <div className="col-sm-6">
                      <label>Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        className="form-control"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <label>Address *</label>
                  <input
                    type="text"
                    name="address"
                    className="form-control"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    required
                  />

                  <div className="row">
                    <div className="col-sm-6">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        className="form-control"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-sm-6">
                      <label>State *</label>
                      <select
                        className="form-control"
                        value={selectedState}
                        onChange={handleStateChange}
                        required
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state._id} value={state._id}>
                            {state.state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label>Order Notes (Optional)</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    rows="4"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Notes about your order, e.g. special notes for delivery."
                  ></textarea>
                </div>

                {/* Order Summary */}
                <div className="col-lg-5">
                  <div className="order-summary">
                    <h3>Your Order</h3>

                    {/* Order Items */}
                    <table className="table table-mini-cart">
                      <thead>
                        <tr>
                          <th colSpan="2">Product</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.cartId}>
                            <td className="product-col">
                              <div className="product">
                                <figure className="product-media">
                                  <img
                                    src={getCartImage(item)}
                                    alt={item.name}
                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                  />
                                </figure>
                                <div className="product-details">
                                  <h3 className="product-title">
                                    {item.name}
                                    {item.selectedColor && (
                                      <span className="product-color">
                                        <br />
                                        <small>Color: {item.selectedColor.colorName}</small>
                                      </span>
                                    )}
                                  </h3>
                                  <span className="product-qty">Qty: {item.qty}</span>
                                </div>
                              </div>
                            </td>
                            <td className="price-col">
                              Rp {formatPrice(item.sum)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="cart-subtotal">
                          <td>
                            <strong>Subtotal</strong>
                          </td>
                          <td>
                            <strong>Rp {formatPrice(subtotal)}</strong>
                          </td>
                        </tr>

                        {discountAmount > 0 && (
                          <tr className="cart-discount">
                            <td>
                              <strong>
                                Discount
                                {discount?.name && (
                                  <div>
                                    <small>{discount.name}</small>
                                    {discount.percentage && (
                                      <small> ({discount.percentage}%)</small>
                                    )}
                                  </div>
                                )}
                              </strong>
                            </td>
                            <td>
                              <strong className="text-danger">
                                -Rp {formatPrice(discountAmount)}
                              </strong>
                            </td>
                          </tr>
                        )}

                        <tr className="cart-subtotal">
                          <td>
                            <strong>Subtotal After Discount</strong>
                          </td>
                          <td>
                            <strong>Rp {formatPrice(afterDiscountTotal)}</strong>
                          </td>
                        </tr>

                        <tr className="shipping-row">
                          <td>
                            <strong>Shipping</strong>
                            {selectedState && (
                              <div>
                                <small>{formData.state}</small>
                                {states.find(s => s._id === selectedState)?.estimatedDays && (
                                  
                                  <small className="text-muted">
                                      Est: {states.find(s => s._id === selectedState)?.estimatedDays}
                                  </small>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>
                              {shippingCost > 0 ? `Rp ${formatPrice(shippingCost)}` : 'Free'}
                            </strong>
                          </td>
                        </tr>

                        <tr className="order-total">
                          <td>
                            <strong>Total</strong>
                          </td>
                          <td>
                            <strong>Rp {formatPrice(finalTotal)}</strong>
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    <button
                      type="submit"
                      className="btn btn-outline-primary-2 btn-order btn-block"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'PROCEED TO PAYMENT'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPageComponent;