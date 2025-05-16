"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { signIn } from "next-auth/react";

const initialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  whatsapp: "",
  dob: "",
  agreementChecked: false,
};

const IndividualSignUpComponent = ({ type }) => {
  const [formData, setFormData] = useState(initialState);
  const [formErrors, setFormErrors] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
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
    
    if (type==='credentials' && !formData.name.trim()) {
      errors.name = "Please enter your full name";
      setFormErrors(errors);
      return false;
    }

    if (type==='credentials' && !formData.email.trim()) {
      errors.email = "Please enter your email address";
      setFormErrors(errors);
      return false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
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

    if (!formData.whatsapp.trim()) {
      errors.whatsapp = "Please enter your WhatsApp number";
      setFormErrors(errors);
      return false;
    }

    if (!formData.agreementChecked) {
      errors.agreementChecked = "Please agree to the privacy policy";
      setFormErrors(errors);
      return false;
    }

    if (!formData.dob) {
      errors.whatsapp = "Please enter your Date of birth";
      setFormErrors(errors);
      return false;
    }

    const today = new Date();
    const dob = new Date(formData.dob);
    if (today.getFullYear() - dob.getFullYear() < 18) {
      errors.dob = "You must be at least 18 years old";
      setFormErrors(errors);
      return false;
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm(formData, 'google')) return;

    setLoading(true);

    try {
      const code = searchParams.get("code");
      const res = await fetch('/api/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          accountType: 'user',
          code,
        }),
      });

      const data = await res.json();

      if (data.status !== 'success') {
        toast.error(data.message || 'Error Registering. Try again');
        return
      }

      toast.success("User Registered! Login to continue.");
      setFormData(initialState);
      router.push("/auth/masuk");

    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Error Registering");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    setLoading(true);

    if (!validateForm(formData, 'google')) return;

    try {
      const code = searchParams.get("code");

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
      // const res = await signIn("google", {
        // callbackUrl: "/",
        // });
        return
        await signIn("google")

    } catch (error) {
      console.error("Google Signin error:", error);
      toast.error("Error signing in with Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-center py-2">Registrasi Personal</h3>
      <form action="#" className="mt-1">
          <div className="form-group">
            <label htmlFor="register-name-2">Nama lengkap *</label>
            <input
              type="text"
              className="form-control"
              id="register-name-2"
              value={formData.name}
              onChange={handleChange}
              name="name"
            />
            {formErrors?.name && (
              <span className="text-red-600">*{formErrors.name}</span>
            )}
          </div>

        <div className="form-group">
          <label htmlFor="register-email-2">Alamat email *</label>
          <input
            type="email"
            className="form-control"
            id="register-email-2"
            value={formData.email}
            onChange={handleChange}
            name="email"
          />
          {formErrors?.email && (
            <span className="text-red-600">*{formErrors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="register-password-21">Kata sandi *</label>
          <input
            type="password"
            className="form-control"
            id="register-password-21"
            value={formData.password}
            onChange={handleChange}
            name="password"
          />
          {formErrors?.password && (
            <span className="text-red-600">*{formErrors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="register-password-22">Konfirmasi sandi *</label>
          <input
            type="password"
            className="form-control"
            id="register-password-22"
            value={formData.confirmPassword}
            onChange={handleChange}
            name="confirmPassword"
          />
          {formErrors?.confirmPassword && (
            <span className="text-red-600">*{formErrors.confirmPassword}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="whatsapp">Nomor WhatsApp</label>
          <input
            type="text"
            className="form-control"
            id="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            name="whatsapp"
          />
          {formErrors?.whatsapp && (
            <span className="text-red-600">*{formErrors.whatsapp}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="dob">Tanggal lahir *</label>
          <input
            type="date"
            className="form-control"
            id="dob"
            value={formData.dob}
            onChange={handleChange}
            name="dob"
          />
          {formErrors?.dob && (
            <span className="text-red-600">*{formErrors.dob}</span>
          )}
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
            <label
              className={`custom-control-label ${
                formErrors?.agreementChecked ? "text-red-600" : "text-black"
              }`}
              htmlFor="register-policy-2"
            >Saya menyatakan bahwa saya adalah perokok dan/atau pengguna produk tembakau alternatif berusia di atas 18 tahun, bertujuan menggunakan produk yang ada di website ini untuk keperluan pribadi saya sendiri*
            </label>
          </div>


          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-outline-primary-2 mt-3"
          >
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
            <button
              className="btn btn-login btn-g w-full"
              onClick={handleGoogleSignin}
            >
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

export default IndividualSignUpComponent;
