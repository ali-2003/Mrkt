"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slice/userSlice.js";

const initialState = {
  semail: "",
  spassword: "",
  remember: false,
};

const SignInComponent = ({ type }) => {
  const [formData, setFormData] = useState(initialState);
  const [formErrors, setFormErrors] = useState({
    semail: "",
    spassword: "",
    remember: "",
  });
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

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
      remember: e.target.checked,
    }));

    setFormErrors({});
  };

  const validateForm = (formData) => {
    const errors = {};

    if (!formData.semail.trim()) {
      errors.semail = "Please enter your email address";
      setFormErrors(errors);
      return false;
    } else if (!/\S+@\S+\.\S+/.test(formData.semail)) {
      errors.semail = "Please enter a valid email address";
      setFormErrors(errors);
      return false;
    }

    if (!formData.spassword.trim()) {
      errors.spassword = "Please enter your password";
      setFormErrors(errors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm(formData)) {
      return;
    }
    
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        identifier: formData.semail,
        type,
        password: formData.spassword,
      });

      if (res?.ok) {
        toast.success("Berhasil Masuk!");
        setFormData(initialState);
        router.push("/");
      } else {
        toast.error(res?.error || "Kesalahan Saat Masuk");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error Logging In");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Business accounts cannot use Google login
    if (type === 'business') {
      toast.error("Akun bisnis tidak dapat masuk dengan Google. Silakan gunakan email dan kata sandi.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("google", {
        redirect: false,
      });

      if (res?.ok) {
        // Successful Google login - will be handled by NextAuth callbacks
        toast.success("Berhasil Masuk!");
        router.push("/");
      } else if (res?.error) {
        // Handle different error types
        if (res.error === 'AccessDenied' || res.error === 'OAuthSignin') {
          toast.error("Tidak ditemukan akun dengan email Google ini. Silakan daftar terlebih dahulu atau gunakan metode masuk yang berbeda.");
        } else {
          toast.error("Kesalahan saat masuk dengan Google. Silakan coba lagi.");
        }
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error("Kesalahan saat masuk dengan Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-center py-2">
        Masuk {type === 'business' ? 'Bisnis' : 'Personal'}
      </h3>
      <div>
        <form>
          <div className="form-group">
            <label htmlFor="singin-email-2">Alamat email *</label>
            <input 
              type="text" 
              className="form-control" 
              id="singin-email-2" 
              value={formData.semail} 
              onChange={handleChange} 
              name="semail" 
            />
            {formErrors?.semail && <span className="text-red-600">*{formErrors.semail}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="singin-password-2">Kata sandi *</label>
            <input 
              type="password" 
              className="form-control" 
              id="singin-password-2" 
              value={formData.spassword} 
              onChange={handleChange} 
              name="spassword" 
            />
            {formErrors?.spassword && <span className="text-red-600">*{formErrors.spassword}</span>}
          </div>

          <div className="form-footer flex justify-between">
            <button 
              type="button" 
              onClick={handleSubmit} 
              className="btn btn-outline-primary-2" 
              disabled={loading}
            >
              <span>{loading ? "Memuat" : "Masuk"}</span>
              <i className="icon-long-arrow-right"></i>
            </button>
          </div>
        </form>
        
        {type === 'user' && (
          <div className="form-choice">
            <p className="text-center">or sign in with</p>
            <div className="row">
              <div className="col-sm-12">
                <button
                  className="btn btn-login btn-g w-full"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <i className="icon-google"></i>
                  {loading ? "Memuat..." : "Masuk dengan Google"}
                </button>
              </div>
            </div>
          </div>
        )}

        {type === 'business' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-700">
              <strong>Catatan:</strong> Akun bisnis hanya dapat masuk menggunakan email dan kata sandi. 
              Masuk dengan Google tidak tersedia untuk akun bisnis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInComponent;