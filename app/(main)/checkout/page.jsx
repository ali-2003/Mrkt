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
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [cartCalculation, setCartCalculation] = useState(null);
  
  // Form data - Updated for Indonesian address format
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    district: "",
    city: "",
    postalCode: "",
    province: "",
    country: "Indonesia",
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
      router.push("/keranjang");
      return;
    }
  }, [items, router]);

  // Fetch shipping zones from Sanity
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const provincesData = await client.fetch(`
          *[_type == 'shippingZone' && isActive == true] | order(state asc) {
            _id,
            state,
            stateCode,
            shippingCost,
            estimatedDays
          }
        `);
        setProvinces(provincesData);
      } catch (error) {
        console.error("Error fetching shipping zones:", error);
        toast.error("Gagal memuat informasi pengiriman");
      }
    };

    fetchProvinces();
  }, []);

  // CRITICAL FIX: Use the same discount calculation logic as the cart page
  const calculateCartTotals = async () => {
    if (!items || items.length === 0) return null;

    try {
      // Get user data for first order discount calculation
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
      const userDataObj = await getUserData();
      
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
      
      const isEligibleForDiscounts = () => {
        return !session || session?.user?.type !== 'business';
      };

      const bottleCount = countProductTypes(validItems, 'bottle');
      const hasPodDevice = countProductTypes(validItems, 'pod') > 0;
      const bottleTotal = getProductTypeTotal(validItems, 'bottle');

      let bestDiscount = { amount: 0, details: null };

      // Check for first order discount (logged in users only)
      if (session?.user && userDataObj?.orderCount === 0) {
        const discountAmount = subtotal * 0.2;
        if (discountAmount > bestDiscount.amount) {
          bestDiscount = {
            amount: discountAmount,
            details: {
              name: "Diskon Pesanan Pertama",
              percentage: 15,
              amount: discountAmount,
              type: "first"
            }
          };
        }
      }

      // If not a business account, check for bundle discounts
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

  // Calculate cart totals on component mount and when dependencies change
  useEffect(() => {
    if (items?.length > 0) {
      calculateCartTotals().then(calculation => {
        setCartCalculation(calculation);
      });
    }
  }, [items, session?.user, discount]);

  // Handle province selection and update shipping cost
  const handleProvinceChange = (e) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    
    const selectedProvinceData = provinces.find(province => province._id === provinceId);
    if (selectedProvinceData) {
      setShippingCost(selectedProvinceData.shippingCost || 0);
      setFormData(prev => ({
        ...prev,
        province: selectedProvinceData.state
      }));
    } else {
      setShippingCost(0);
      setFormData(prev => ({
        ...prev,
        province: ""
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
    const required = ['fullName', 'email', 'phone', 'streetAddress', 'district', 'city', 'postalCode', 'province'];
    const fieldNames = {
      fullName: 'Nama Lengkap',
      email: 'Email',
      phone: 'Nomor Telepon',
      streetAddress: 'Alamat Jalan',
      district: 'Kecamatan',
      city: 'Kota',
      postalCode: 'Kode Pos',
      province: 'Provinsi'
    };
    
    for (let field of required) {
      if (!formData[field] || formData[field].trim() === '') {
        toast.error(`Harap isi ${fieldNames[field]}`);
        return false;
      }
    }
    
    if (!selectedProvince) {
      toast.error("Harap pilih provinsi");
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
        streetAddress: formData.streetAddress,
        district: formData.district,
        city: formData.city,
        postalCode: formData.postalCode,
        province: formData.province,
        country: formData.country,
        notes: formData.notes
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
          discountCalculation: cartCalculation,
          user: session.user,
          shippingInfo
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Checkout gagal");
      }

      // Clear cart and redirect to Xendit payment page
      dispatch(emptyCart());
      
      // Redirect to Xendit invoice URL
      window.location.href = data.invoice_url;

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Terjadi kesalahan saat checkout");
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

  // Calculate final totals
  const subtotalAfterDiscount = cartCalculation?.total || (items?.reduce((total, item) => total + (item.sum || 0), 0) || 0);
  const finalTotal = subtotalAfterDiscount + shippingCost;

  if (!session || !items || items.length === 0) {
    return <div>Memuat...</div>;
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
                  <h2 className="checkout-title">Informasi Pengiriman</h2>
                  
                  <div className="row">
                    <div className="col-sm-6">
                      <label>Nama Lengkap *</label>
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
                      <label>Nomor Telepon *</label>
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
                      <label>Kode Pos *</label>
                      <input
                        type="text"
                        name="postalCode"
                        className="form-control"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <label>Alamat Jalan *</label>
                  <input
                    type="text"
                    name="streetAddress"
                    className="form-control"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    placeholder="Alamat jalan lengkap"
                    required
                  />

                  <label>Kecamatan *</label>
                  <input
                    type="text"
                    name="district"
                    className="form-control"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Kecamatan atau kelurahan"
                    required
                  />

                  <div className="row">
                    <div className="col-sm-6">
                      <label>Kota *</label>
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
                      <label>Provinsi *</label>
                      <select
                        className="form-control"
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        required
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map((province) => (
                          <option key={province._id} value={province._id}>
                            {province.state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label>Negara</label>
                  <input
                    type="text"
                    name="country"
                    className="form-control"
                    value={formData.country}
                    onChange={handleInputChange}
                    readOnly
                  />

                  <label>Catatan Pesanan (Opsional)</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    rows="4"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Catatan khusus untuk pesanan Anda, misalnya instruksi pengiriman khusus."
                  ></textarea>
                </div>

                {/* Order Summary */}
                <div className="col-lg-5">
                  <div className="order-summary">
                    <h3>Pesanan Anda</h3>

                    {/* Order Items */}
                    <table className="table table-mini-cart">
                      <thead>
                        <tr>
                          <th colSpan="2">Produk</th>
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
                                        <small> - {item.selectedColor.colorName}</small>
                                      </span>
                                    )}
                                  </h3>
                                  <span className="product-qty">Jumlah: {item.qty}</span>
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
                            <strong>Rp {formatPrice(subtotalAfterDiscount)}</strong>
                          </td>
                        </tr>

                        <tr className="shipping-row">
                          <td>
                            <strong>Pengiriman</strong>
                            {selectedProvince && (
                              <div>
                                <small>{formData.province}</small>
                                {provinces.find(p => p._id === selectedProvince)?.estimatedDays && (
                                  <small className="text-muted d-block">
                                    Estimasi: {provinces.find(p => p._id === selectedProvince)?.estimatedDays} Hari
                                  </small>
                                )}
                              </div>
                            )}
                            {!selectedProvince && (
                              <div>
                                <small className="text-muted">Akan dihitung</small>
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>
                              {selectedProvince 
                                ? (shippingCost > 0 ? `Rp ${formatPrice(shippingCost)}` : 'Gratis')
                                : 'Akan dihitung'
                              }
                            </strong>
                          </td>
                        </tr>

                        <tr className="order-total">
                          <td>
                            <strong>Total</strong>
                          </td>
                          <td>
                            <strong>
                              {selectedProvince 
                                ? `Rp ${formatPrice(finalTotal)}`
                                : 'Akan dihitung'
                              }
                            </strong>
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    <button
                      type="submit"
                      className="btn btn-outline-primary-2 btn-order btn-block"
                      disabled={loading || !selectedProvince}
                    >
                      {loading ? 'Memproses...' : 'LANJUT KE PEMBAYARAN'}
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