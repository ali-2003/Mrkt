// app/checkout/page.js - UPDATED WITH RETRY LOGIC
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
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  
  // Form data
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
    password: "",
    confirmPassword: ""
  });

  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  
  const cart = useSelector((state) => state.cart);
  const { items, discount } = cart;

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1500; // 1.5 seconds

  useEffect(() => {
    if (!items || items.length === 0) {
      router.push("/keranjang");
      return;
    }
  }, [items, router]);

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        fullName: session.user.name || "",
        email: session.user.email || ""
      }));
    }
  }, [session]);

  useEffect(() => {
    if (formData.email && formData.email.includes('@')) {
      window.abandonmentSystem?.setUserEmail(formData.email);
    }
  }, [formData.email]);

  useEffect(() => {
    if (window.abandonmentSystem && items) {
      window.abandonmentSystem.updateCartStatus(items.length > 0);
    }
  }, [items]);

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

  const calculateCartTotals = async () => {
    if (!items || items.length === 0) return null;

    try {
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

      const validItems = items.map(item => ({
        ...item,
        qty: item.qty || 1,
        sum: typeof item.sum === 'number' ? item.sum : (item.sale_price || item.price || 0) * (item.qty || 1),
        productType: item.productType
      }));

      const subtotal = validItems.reduce((total, item) => total + item.sum, 0);

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

      const userDataObj = await getUserData();
      
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
        return !session?.user?.accountType || session?.user?.accountType !== 'business';
      };

      const bottleCount = countProductTypes(validItems, 'bottle');
      const hasPodDevice = countProductTypes(validItems, 'pod') > 0;
      const bottleTotal = getProductTypeTotal(validItems, 'bottle');

      let bestDiscount = { amount: 0, details: null };

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

      if (bestDiscount.amount > 0 && bestDiscount.details) {
        return {
          original: subtotal,
          discount: bestDiscount.amount,
          total: subtotal - bestDiscount.amount,
          discountDetails: bestDiscount.details
        };
      }

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

  useEffect(() => {
    if (items?.length > 0) {
      calculateCartTotals().then(calculation => {
        setCartCalculation(calculation);
      });
    }
  }, [items, session?.user, discount]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Format email tidak valid");
      return false;
    }

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

  // ADDED: Sleep utility for retry delays
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // UPDATED: Handle form submission with RETRY LOGIC
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setLastError(null);
    
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

      const itemsWithImageUrls = items.map(item => ({
        ...item,
        imageUrl: getCartImage(item)
      }));

      const checkoutData = {
        items: itemsWithImageUrls,
        shippingCost: shippingCost || 0,
        discount: discount || null,
        discountCalculation: cartCalculation,
        user: session?.user || null,
        shippingInfo,
        isGuest: !session?.user,
        userEmail: session?.user?.email || formData.email,
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

      // ADDED: Retry logic
      let lastAttemptError = null;
      let response = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`Checkout attempt ${attempt + 1}/${MAX_RETRIES + 1}...`);
          
          response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(checkoutData),
          });

          if (response.ok) {
            console.log("Checkout successful!");
            break; // Success, exit retry loop
          }

          if (attempt < MAX_RETRIES) {
            console.log(`Attempt ${attempt + 1} failed, retrying in ${RETRY_DELAY}ms...`);
            await sleep(RETRY_DELAY);
            continue;
          }

          lastAttemptError = `API returned ${response.status}`;
        } catch (fetchError) {
          lastAttemptError = fetchError.message;
          
          if (attempt < MAX_RETRIES) {
            console.log(`Network error on attempt ${attempt + 1}, retrying in ${RETRY_DELAY}ms...`);
            await sleep(RETRY_DELAY);
            continue;
          }
        }
      }

      // If all retries failed
      if (!response?.ok) {
        throw new Error(`Checkout gagal setelah ${MAX_RETRIES + 1} percobaan: ${lastAttemptError}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Checkout gagal");
      }

      if (!data.invoice_url) {
        throw new Error("Invoice URL tidak ditemukan dalam respons");
      }

      if (window.abandonmentSystem) {
        window.abandonmentSystem.markPurchaseComplete();
      }

      dispatch(emptyCart());
      toast.success("Pesanan berhasil dibuat! Mengalihkan ke halaman pembayaran...");

      setTimeout(() => {
        try {
          window.location.replace(data.invoice_url);
        } catch (redirectError) {
          console.error("Redirect error:", redirectError);
          window.location.href = data.invoice_url;
        }
      }, 1000);

    } catch (error) {
      console.error("Checkout error:", error);
      setLastError(error.message);
      
      // Show user-friendly error with option to retry
      toast.error(error.message || "Terjadi kesalahan saat checkout");
      
      if (retryCount < MAX_RETRIES) {
        toast.info(`Anda dapat mencoba kembali. Percobaan tersisa: ${MAX_RETRIES - retryCount}`);
        setRetryCount(retryCount + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

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

            {/* ADDED: Error message display */}
            {lastError && (
              <div className="alert alert-warning mb-4">
                <strong>Peringatan:</strong> {lastError}
                <br />
                <small>Coba lagi dengan mengklik tombol di bawah. Biasanya berhasil pada percobaan kedua.</small>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
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
                        disabled={!!session?.user?.email}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-sm-6">
                      <label>Nomor Telepon </label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(+62) xxx-xxxx-xxxx"
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

                <div className="col-lg-5">
                  <div className="order-summary">
                    <h3>Pesanan Anda</h3>

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
                      {loading ? `Memproses...${retryCount > 0 ? ` (Percobaan ${retryCount + 1})` : ''}` : 'LANJUT KE PEMBAYARAN'}
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