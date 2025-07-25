// BusinessWholesaleSignUpComponent - FIXED WITHOUT AGREEMENT VALIDATION
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

const initialState = {
  businessName: "",
  email: "",
  password: "",
  confirmPassword: "",
  whatsapp: "",
  toko: "",
  store: "online",
  url: "",
  address: "",
  // REMOVED: agreementChecked
};

const initialError = {
  businessName: "",
  email: "",
  password: "",
  confirmPassword: "",
  whatsapp: "",
  toko: "",
  store: "",
  url: "",
  address: "",
  // REMOVED: agreementChecked
}

const BusinessWholesaleSignUpComponent = ({ type }) => {
  const [formData, setFormData] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFormErrors({});
  };

  const validateForm = (formData) => {
    const errors = {};

    if (!formData.businessName.trim()) {
      errors.businessName = "Please enter your business name";
      setFormErrors(errors);
      return false;
    } 

    if (!formData.email.trim()) {
      errors.email = "Please enter your email address";
      setFormErrors(errors);
      return false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      setFormErrors(errors);
      return false;
    }

    if (formData.password?.trim()?.length < 6) {
      errors.password = "Kata sandi harus mengandung enam karakter";
      setFormErrors(errors);
      return false;
    }

    if (!formData.confirmPassword?.trim()) {
      errors.confirmPassword = "Please re-enter your password";
      setFormErrors(errors);
      return false;
    }

    if (formData.confirmPassword != formData.password) {
      errors.confirmPassword = "Passwords do not match";
      setFormErrors(errors);
      return false;
    }

    if (!formData.whatsapp.trim()) {
      errors.whatsapp = "Please enter your WhatsApp number";
      setFormErrors(errors);
      return false;
    }

    if (!formData.toko.trim()) {
      errors.toko = "Please enter your NPWP";
      setFormErrors(errors);
      return false;
    }

    // REMOVED: Agreement validation

    if (formData.store === 'online' && !formData.url.trim()) {
      errors.url = "Please enter your business URL";
      setFormErrors(errors);
      return false;
    }

    if (formData.store === 'physical' && !formData.address.trim()) {
      errors.address = "Please enter your business address";
      setFormErrors(errors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm(formData)) return;

    setLoading(true);

    try {
      const code = searchParams.get("code");

      const res = await fetch("/api/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          accountType: 'business',
          businessType: 'physical',
          code,
        }),
      });

      const data = await res.json();

      if (data.status !== "success") {
        toast.error(data.message);
        return;
      }
      toast.success("Business Registered! Please wait for admin approval before you can login.");
      setFormData(initialState);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Error Registering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-700">
          <strong>Note:</strong> Business accounts cannot sign up with Google. Please use email and password registration. Your account will need admin approval before you can login.
        </p>
      </div>

      <form action="#" className="mt-1">
        <div className="form-group">
          <label htmlFor="business-name2">Nama pemilik bisnis *</label>
          <input type="text" className="form-control" id="business-name2" value={formData.businessName} onChange={handleChange} name="businessName" />
          {formErrors?.businessName && <span className="text-red-600">*{formErrors.businessName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="register-email-22">Alamat email *</label>
          <input type="email" className="form-control" id="register-email-22" value={formData.email} onChange={handleChange} name="email" />
          {formErrors?.email && <span className="text-red-600">*{formErrors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="whatsapp3">Nomor WhatsApp</label>
          <input type="text" className="form-control" id="whatsapp3" value={formData.whatsapp} onChange={handleChange} name="whatsapp" />
          {formErrors?.whatsapp && <span className="text-red-600">*{formErrors.whatsapp}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="register-password-21">Kata sandi *</label>
          <input type="password" className="form-control" id="register-password-21" value={formData.password} onChange={handleChange} name="password" />
          {formErrors?.password && <span className="text-red-600">*{formErrors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="register-password-22">Konfirmasi sandi *</label>
          <input type="password" className="form-control" id="register-password-22" value={formData.confirmPassword} onChange={handleChange} name="confirmPassword" />
          {formErrors?.confirmPassword && <span className="text-red-600">*{formErrors.confirmPassword}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="toko">NPWP Toko *</label>
          <input type="text" className="form-control" id="toko" value={formData.toko} onChange={handleChange} name="toko" />
          {formErrors?.toko && <span className="text-red-600">*{formErrors.toko}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="store">
          Toko grosir yang Anda miliki? *
          </label>
              <select className="form-control" name="store" id="store" value={formData.store} onChange={handleChange}>
                <option value="online">Toko grosir online</option>
                <option value="physical">Toko grosir fisik/konvensional</option>
              </select>
          {formErrors?.store && <span className="text-red-600">*{formErrors.store}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="url">Input url akun bisnis Anda{formData.store === 'online' && <span>{" "}*</span>}</label>
          <input type="text" className="form-control" id="url" value={formData.url} onChange={handleChange} name="url" />
          {formErrors?.url && <span className="text-red-600">*{formErrors.url}</span>}
        </div>

        {formData.store === 'physical' && (
          <div className="form-group">
            <label htmlFor="address">Input alamat bisnis Anda *</label>
            <input type="text" className="form-control" id="address" value={formData.address} onChange={handleChange} name="address" />
            {formErrors?.address && <span className="text-red-600">*{formErrors.address}</span>}
          </div>
        ) }

        <div className="form-footer">
          {/* REMOVED: Entire checkbox section */}
          
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-outline-primary-2 mt-3">
            <span>{loading ? "Loading" : "Register"}</span>
            <i className="icon-long-arrow-right"></i>
          </button>
        </div>

        <div className="text-gray-600 text-center py-3">Data Anda aman dan dijamin oleh mrkt. Indonesia</div>
      </form>
    </div>
  );
};

export default BusinessWholesaleSignUpComponent;