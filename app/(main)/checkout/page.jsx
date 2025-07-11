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
import Link from "next/link";

function CheckoutPageComponent() {
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [cartCalculation, setCartCalculation] = useState(null);
  const [createAccount, setCreateAccount] = useState(false);
  
  // Form data - Updated for guest checkout
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
    notes: "",
    // Additional fields for account creation
    password: "",
    confirmPassword: ""
  });

  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  
  // Get cart data from Redux
  const cart = useSelector((state) => state.cart);
  const { items, discount } = cart;

  // Redirect if cart is empty
  useEffect(() => {
    if (!items || items.length === 0) {
      router.push("/keranjang");
      return;
    }
  }, [items, router]);

  // Pre-fill form with session data if user is logged in
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        fullName: session.user.name || "",
        email: session.user.email || ""
      }));
    }
  }, [session]);

  // ABANDONMENT EMAIL TRACKING - Capture email when user types it
  useEffect(() => {
    if (formData.email && formData.email.includes('@')) {
      window.abandonmentSystem?.setUserEmail(formData.email);
    }
  }, [formData.email]);

  // ABANDONMENT EMAIL TRACKING - Track cart status from Redux
  useEffect(() => {
    if (window.abandonmentSystem && items) {
      window.abandonmentSystem.updateCartStatus(items.length > 0);
    }
  }, [items]);

  // UPDATED: Fetch shipping zones via API route
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        console.log("🔍 Fetching shipping zones via API route...");
        console.log("🌐 Current domain:", window.location.hostname);
        console.log("🌐 Current URL:", window.location.href);
        
        const response = await fetch('/api/shipping-zones', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store' // Don't cache the response
        });

        console.log("📡 API Response status:", response.status);
        console.log("📡 API Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Response error:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("📦 API Response data:", data);

        if (!data.success) {
          console.error("❌ API returned error:", data.message);
          throw new Error(data.message || 'API returned unsuccessful response');
        }

        if (!data.data || !Array.isArray(data.data)) {
          console.error("❌ Invalid data format:", data);
          throw new Error('Invalid data format received from API');
        }

        console.log("✅ Successfully loaded shipping zones:", data.data.length);
        setProvinces(data.data);

        if (data.data.length === 0) {
          toast.warn("Tidak ada zona pengiriman aktif yang tersedia. Silakan hubungi administrator.");
        } else {
          console.log("🎉 Shipping zones loaded successfully!");
        }

      } catch (error) {
        console.error("❌ Error fetching shipping zones:", error);
        
        // Provide specific error messages based on error type
        if (error.message.includes('404')) {
          toast.error("API pengiriman tidak ditemukan. Silakan hubungi administrator.");
        } else if (error.message.includes('500')) {
          toast.error("Kesalahan server saat memuat data pengiriman. Silakan coba lagi.");
        } else if (error.message.includes('Failed to fetch')) {
          toast.error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
        } else {
          toast.error(`Gagal memuat informasi pengiriman: ${error.message}`);
        }

        // Fallback data for critical functionality
        console.log("🔄 Loading fallback shipping data...");
        const fallbackProvinces = [
          {
            _id: 'jakarta',
            state: 'DKI Jakarta',
            stateCode: 'JKT',
            shippingCost: 15000,
            estimatedDays: '1-2',
            isActive: true
          },
          {
            _id: 'jabar',
            state: 'Jawa Barat',
            stateCode: 'JABAR',
            shippingCost: 20000,
            estimatedDays: '2-3',
            isActive: true
          },
          {
            _id: 'jateng',
            state: 'Jawa Tengah',
            stateCode: 'JATENG',
            shippingCost: 25000,
            estimatedDays: '3-4',
            isActive: true
          },
          {
            _id: 'jatim',
            state: 'Jawa Timur',
            stateCode: 'JATIM',
            shippingCost: 25000,
            estimatedDays: '3-4',
            isActive: true
          },
          {
            _id: 'bali',
            state: 'Bali',
            stateCode: 'BALI',
            shippingCost: 30000,
            estimatedDays: '4-5',
            isActive: true
          }
        ];
        
        setProvinces(fallbackProvinces);
        toast.info("Menggunakan data pengiriman standar. Beberapa provinsi mungkin tidak tersedia.");
      }
    };

    fetchProvinces();
  }, []);

  // Same discount calculation logic as before...
  const calculateCartTotals = async () => {
    if (!items || items.length === 0) return null;

    try {
      // Get user data for first order discount calculation (only for logged-in users)
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
      
      // Allow discounts for non-business users (including guests)
      const isEligibleForDiscounts = () => {
        return !session?.user?.accountType || session?.user?.accountType !== 'business';
      };

      const bottleCount = countProductTypes(validItems, 'bottle');
      const hasPodDevice = countProductTypes(validItems, 'pod') > 0;
      const bottleTotal = getProductTypeTotal(validItems, 'bottle');

      let bestDiscount = { amount: 0, details: null };

      // Check for first order discount (ONLY for logged in users with no previous orders)
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Format email tidak valid");
      return false;
    }

    // If user wants to create account, validate password fields
    if (createAccount && !session) {
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password minimal 6 karakter");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Konfirmasi password tidak cocok");
        return false;
      }
    }
    
    return true;
  };

  // UPDATED: Handle form submission for both logged-in users and guests
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

      // Prepare checkout data in the format the API expects
      const checkoutData = {
        items: items || [],
        shippingCost: shippingCost || 0,
        discount: discount || null,
        discountCalculation: cartCalculation,
        user: session?.user || null,
        shippingInfo,
        // Additional flags
        isGuest: !session?.user,
        userEmail: session?.user?.email || formData.email,
        // Include account creation data if guest wants to create account
        ...(createAccount && !session && {
          createAccount: true,
          accountData: {
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            phone: formData.phone
          }
        })
      };

      console.log("Sending checkout data:", {
        itemCount: checkoutData.items?.length,
        hasDiscount: !!checkoutData.discount,
        isGuest: checkoutData.isGuest,
        userEmail: checkoutData.userEmail,
        shippingCost: checkoutData.shippingCost
      });

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Checkout API Error:", errorText);
        throw new Error(`Checkout gagal: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Checkout response:", data);

      if (!data.success) {
        throw new Error(data.message || "Checkout gagal");
      }

      if (!data.invoice_url) {
        throw new Error("Invoice URL tidak ditemukan dalam respons");
      }

      // ABANDONMENT EMAIL TRACKING - Mark purchase complete to prevent abandonment emails
      if (window.abandonmentSystem) {
        window.abandonmentSystem.markPurchaseComplete();
      }

      // Clear cart
      dispatch(emptyCart());
      
      // Show success message
      toast.success("Pesanan berhasil dibuat! Mengalihkan ke halaman pembayaran...");

      // Wait a moment for the toast to show, then redirect
      setTimeout(() => {
        try {
          // Force redirect to Xendit payment page
          window.location.replace(data.invoice_url);
        } catch (redirectError) {
          console.error("Redirect error:", redirectError);
          // Fallback: try regular href assignment
          window.location.href = data.invoice_url;
        }
      }, 1000);

    } catch (error) {
      console.error("Checkout error:", error);
      
      // Show specific error message
      if (error.message.includes("400")) {
        toast.error("Data checkout tidak valid. Harap periksa kembali form Anda.");
      } else if (error.message.includes("500")) {
        toast.error("Terjadi kesalahan server. Silakan coba lagi.");
      } else {
        toast.error(error.message || "Terjadi kesalahan saat checkout");
      }
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

  if (!items || items.length === 0) {
    return <div>Memuat...</div>;
  }

  return (
    <div className="main">
      <div className="page-content">
        <div className="checkout">
          <div className="container">
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="alert alert-warning mb-4">
                <small>
                  Debug: Provinces loaded: {provinces.length} | 
                  Selected: {selectedProvince} | 
                  Domain: {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}
                </small>
              </div>
            )}

            {/* Login suggestion for guests */}
            {!session && (
              <div className="alert alert-info mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <i className="icon-user"></i> Sudah punya akun? 
                    <Link href="/auth/masuk" className="ml-1 font-weight-bold">Masuk sekarang</Link> untuk mendapat diskon pesanan pertama 15%!
                  </span>
                </div>
              </div>
            )}

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
                        disabled={!!session?.user?.email} // Disable if user is logged in
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
                        placeholder="(+62) xxx-xxxx-xxxx"
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

                  {/* Account creation option for guests */}
                  {!session && (
                    <div className="mt-4">
                      <div className="custom-control custom-checkbox">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id="createAccount"
                          checked={createAccount}
                          onChange={(e) => setCreateAccount(e.target.checked)}
                        />
                        <label className="custom-control-label" htmlFor="createAccount">
                          Buat akun untuk pesanan yang lebih mudah di masa depan
                        </label>
                      </div>

                      {createAccount && (
                        <div className="row mt-3">
                          <div className="col-sm-6">
                            <label>Password *</label>
                            <input
                              type="password"
                              name="password"
                              className="form-control"
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Minimal 6 karakter"
                              required={createAccount}
                            />
                          </div>
                          <div className="col-sm-6">
                            <label>Konfirmasi Password *</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              className="form-control"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              placeholder="Konfirmasi password"
                              required={createAccount}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                            <strong>Rp {formatPrice(cartCalculation?.original || subtotalAfterDiscount)}</strong>
                          </td>
                        </tr>

                        {/* Show discount from cart calculation if exists */}
                        {cartCalculation?.discount > 0 && cartCalculation?.discountDetails && (
                          <tr className="cart-discount">
                            <td>
                              <strong>{cartCalculation.discountDetails.name}</strong>
                              {cartCalculation.discountDetails.percentage && (
                                <small className="d-block text-muted">
                                  {cartCalculation.discountDetails.percentage}% off
                                </small>
                              )}
                            </td>
                            <td>
                              <strong className="text-success">
                                -Rp {formatPrice(cartCalculation.discount)}
                              </strong>
                            </td>
                          </tr>
                        )}

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