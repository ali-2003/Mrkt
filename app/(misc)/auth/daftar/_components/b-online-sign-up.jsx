"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { signIn } from "next-auth/react";
import { Trash2 } from "lucide-react";

const initialState = {
  email: "",
  password: "",
  confirmPassword: "",
  whatsapp: "",
  agreementChecked: false,
};

const BusinessOnlineSignUpComponent = ({ type }) => {
  const [formData, setFormData] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialState);
  const [showOther, setShowOther] = useState(false);
  const [onlineShops, setOnlineShops] = useState([]);
  const [currentStore, setCurrentStore] = useState({
    name: "",
    accountId: "",
  });
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

  const handleCheckboxChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      agreementChecked: e.target.checked,
    }));

    setFormErrors({});
  };

  const validateForm = (formData, type='credentials') => {
    const errors = {};

    if (type==='credentials' && !formData.email.trim()) {
      errors.email = "Please enter your email address";
      setFormErrors(errors);
      return false;
    } else if (type==='credentials' && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      setFormErrors(errors);
      return false;
    }

    if (type==='credentials' && formData.password?.trim()?.length < 6) {
      errors.password = "Kata sandi harus mengandung enam karakter";
      setFormErrors(errors);
      return false;
    }

    if (type==='credentials' && !formData.confirmPassword?.trim()) {
      errors.confirmPassword = "Please re-enter your password";
      setFormErrors(errors);
      return false;
    }

    if (type==='credentials' && formData.confirmPassword != formData.password) {
      errors.confirmPassword = "Passwords do not match";
      setFormErrors(errors);
      return false;
    }

    if (!formData.agreementChecked) {
      errors.agreementChecked = "Please agree to the privacy policy";
      setFormErrors(errors);
      return false;
    }

    return true;
  };

  const checkSelect = (e) => {
    if (e.target.value === "custom") {
      setShowOther(true);
      return;
    }

    setCurrentStore({ ...currentStore, name: e.target.value });
  };

  const handleStoreAdd = () => {
    if (!currentStore.name || !currentStore.accountId) {
      return;
    }
    setOnlineShops([...onlineShops, currentStore]);
    setCurrentStore({ name: "", accountId: "" });
    setShowOther(false);
  };

  const handleStoreDelete = (idx) => {
    const newShops = onlineShops.filter((_, i) => i !== idx);
    setOnlineShops(newShops);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm(formData, 'google')) return;

    setLoading(true);

    try {
      const code = searchParams.get("code");
      // const res1 = await signUp({
      //   name: formData.name,
      //   email: formData.email,
      //   password: formData.password,
      // });

      // if (code) {
      //   const res2 = await fetch("/api/addDiscount", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       email: formData.email,
      //       code,
      //     }),
      //   });
      // }
      const res = await fetch("/api/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          accountType: 'business',
          businessType: 'online',
          onlineShops,
        }),
      });

      const data = await res.json();

      if (data.status !== "success") {
        toast.error(data.message);
        return;
      }
      toast.success("Business Registered! Please wait for approval.");
      setFormData(initialState);
      setOnlineShops([]);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Error Registering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="mt-1">
        <div className="form-group">
          <label htmlFor="register-email-2">Alamat email *</label>
          <input type="email" className="form-control" id="register-email-2" value={formData.email} onChange={handleChange} name="email" />
          {formErrors?.email && <span className="text-red-600">*{formErrors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="whatsapp2">Nomor WhatsApp</label>
          <input type="text" className="form-control" id="whatsapp2" value={formData.whatsapp} onChange={handleChange} name="whatsapp" />
          {formErrors?.whatsapp && <span className="text-red-600">*{formErrors.whatsapp}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="shop-id">
            Toko online yang Anda miliki?
            <span className="block w-full text-[1.2rem]">Anda dapat memilih lebih dari satu jenis e-commerce</span>
          </label>
          <div className="flex gap-4 items-center">
            {!showOther ? (
              <select className="form-control flex-[3/7]" value={currentStore.name} onChange={(e) => checkSelect(e)}>
                <option value="">Select</option>
                <option value="Shopee">Shopee</option>
                <option value="Tokopedia">Tokopedia</option>
                <option value="Lazada">Lazada</option>
                <option value="Blibli">Blibli</option>
                <option value="TikTok Shop">TikTok Shop</option>
                <option value="YUAP ID">YUAP ID</option>
                <option value="Vapestore.id">Vapestore.id</option>
                <option value="Vape.id">Vape.id</option>
                <option value="Vapemagz">Vapemagz</option>
                <option value="custom">Lainnya</option>
              </select>
            ) : (
              <input type="text" className="form-control flex-[3/7]" value={currentStore.name} onChange={(e) => setCurrentStore({ ...currentStore, name: e.target.value })} />
            )}
            <input
              type="text"
              className="form-control flex-[3/7]"
              id="shop-id"
              placeholder="Ketik nama/link akun Anda"
              value={currentStore.accountId}
              onChange={(e) => setCurrentStore({ ...currentStore, accountId: e.target.value })}
            />
            <span className="flex-[1/7] cursor-pointer icon-arrow-up" onClick={handleStoreAdd}></span>
          </div>
          {formErrors?.whatsapp && <span className="text-red-600">*{formErrors.whatsapp}</span>}
        </div>

        <div className="form-group">
          {onlineShops.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {onlineShops.map((shop, idx) => (
                <span key={idx} className="bg-gray-200 px-4 py-2 rounded-full flex items-center">
                  {shop.name}
                  <Trash2 onClick={() => handleStoreDelete(idx)} size={20} className="pl-2 cursor-pointer text-red-500" />
                </span>
              ))}
            </div>
          )}
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

        <div className="form-footer">
          <div className="custom-control custom-checkbox">
            <input
              type="checkbox"
              className="custom-control-input"
              id="register-policy-2"
              name="agreementChecked"
              checked={formData.agreementChecked}
              onChange={handleCheckboxChange}
            />
            <label className={`custom-control-label ${formErrors?.agreementChecked ? "text-red-600" : "text-black"}`} htmlFor="register-policy-2">
              Saya merupakan penjual tembakau elektronik berusia di atas 18 tahun, bertujuan menggunakan produk yang ada di website ini untuk keperluan bisnis/komersial*
            </label>
          </div>

          <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-outline-primary-2 mt-3">
            <span>{loading ? "Loading" : "Register"}</span>
            <i className="icon-long-arrow-right"></i>
          </button>
        </div>

        <div className="text-gray-600 text-center py-3">Data Anda aman dan dijamin oleh mrkt. Indonesia</div>
      </form>
      <div className="form-choice">
        <p className="text-center">or sign in with</p>
        <div className="row">
          <div className="col-sm-12">
            <button className="btn btn-login btn-g w-full" onClick={() => {}}>
            {/* <button className="btn btn-login btn-g w-full" onClick={() => signIn("google")}> */}
              <i className="icon-google"></i>
              Masuk dengan Google
            </button>
          </div>
          {/* <div className="col-sm-6">
            <button
              className="btn btn-login btn-f w-full"
              // onClick={() => signIn("facebook")}
            >
              <i className="icon-facebook-f"></i>
              Login With Facebook
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default BusinessOnlineSignUpComponent;
