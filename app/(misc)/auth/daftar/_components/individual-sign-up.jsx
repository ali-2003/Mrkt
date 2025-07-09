"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { signIn, useSession } from "next-auth/react";

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
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Handle Google OAuth callback and incomplete profiles
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // If user is logged in with Google but profile is incomplete
      if (session.user.authType === 'google' && !session.user.profileCompleted) {
        setIsGoogleFlow(true);
        setFormData(prev => ({
          ...prev,
          name: session.user.name || "",
          email: session.user.email || "",
        }));
        toast.info("Please complete your profile to continue");
      } 
      // If user is already logged in with complete profile, redirect to dashboard
      else if (session.user.profileCompleted) {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  // Handle URL parameters for Google signup completion
  useEffect(() => {
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const authType = searchParams.get('authType');
    
    if (email && name && authType === 'google') {
      setIsGoogleFlow(true);
      setFormData(prev => ({
        ...prev,
        name: decodeURIComponent(name),
        email: decodeURIComponent(email),
      }));
      toast.info("Please complete your profile to finish Google signup");
    }
  }, [searchParams]);

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

  const validateForm = (formData, type = 'credentials') => {
    const errors = {};
    
    if (type === 'credentials' && !formData.name.trim()) {
      errors.name = "Please enter your full name";
      setFormErrors(errors);
      return false;
    }

    if (type === 'credentials' && !formData.email.trim()) {
      errors.email = "Please enter your email address";
      setFormErrors(errors);
      return false;
    } else if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      setFormErrors(errors);
      return false;
    }

    if (type === 'credentials' && formData.password?.trim()?.length < 6) {
      errors.password = "Kata sandi harus mengandung enam karakter";
      setFormErrors(errors);
      return false;
    }

    if (type === 'credentials' && !formData.confirmPassword?.trim()) {
      errors.confirmPassword = "Please re-enter your password";
      setFormErrors(errors);
      return false;
    }

    if (type === 'credentials' && formData.confirmPassword != formData.password) {
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
      errors.dob = "Please enter your Date of birth";
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationType = isGoogleFlow ? 'google' : 'credentials';
    if (!validateForm(formData, validationType)) return;

    setLoading(true);

    try {
      const code = searchParams.get("code");
      
      let endpoint = '/api/sign-up';
      let payload = {
        ...formData,
        accountType: 'user',
        code,
      };

      // If it's Google flow, use complete-profile endpoint
      if (isGoogleFlow && session?.user?.id) {
        endpoint = '/api/complete-profile';
        payload = {
          userId: session.user.id,
          whatsapp: formData.whatsapp,
          dob: formData.dob,
          code,
        };
      } else if (isGoogleFlow && !session?.user?.id) {
        // Handle URL-based Google flow (when redirected from OAuth)
        endpoint = '/api/complete-google-profile';
        payload = {
          email: formData.email,
          name: formData.name,
          whatsapp: formData.whatsapp,
          dob: formData.dob,
          code,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status !== 'success') {
        toast.error(data.message || 'Error Registering. Try again');
        return;
      }

      if (isGoogleFlow) {
        toast.success("Profile completed successfully!");
        // Force sign in to refresh session
        const result = await signIn('credentials', {
          identifier: formData.email,
          password: 'google_auth', // Special identifier for Google users
          redirect: false
        });
        if (result?.ok) {
          router.push("/");
        } else {
          router.push("/auth/masuk");
        }
      } else {
        toast.success("User Registered! Login to continue.");
        setFormData(initialState);
        router.push("/auth/masuk");
      }

    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Error Registering");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    setLoading(true);

    try {
      const code = searchParams.get("code");
      
      // Store referral code in sessionStorage for after OAuth
      if (code) {
        sessionStorage.setItem('referralCode', code);
      }

      // Initiate Google OAuth with explicit callback URL
      const result = await signIn("google", {
        callbackUrl: `${window.location.origin}/auth/complete-profile-check`,
        redirect: true,
      });
      
      // This shouldn't execute if redirect is true
      if (result?.error) {
        toast.error("Error signing in with Google");
        setLoading(false);
      }

    } catch (error) {
      console.error("Google Signin error:", error);
      toast.error("Error signing in with Google");
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-center py-2">
        {isGoogleFlow ? "Complete Your Profile" : "Registrasi Personal"}
      </h3>
      <form action="#" className="mt-1">
        {!isGoogleFlow && (
          <>
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
          </>
        )}

        {isGoogleFlow && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              Signed in as: <strong>{formData.name}</strong> ({formData.email})
            </p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="whatsapp">Nomor WhatsApp *</label>
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
            {/* <label
              className={`custom-control-label ${
                formErrors?.agreementChecked ? "text-red-600" : "text-black"
              }`}
              htmlFor="register-policy-2"
            >
              Saya menyatakan bahwa saya adalah perokok dan/atau pengguna produk tembakau alternatif berusia di atas 18 tahun, bertujuan menggunakan produk yang ada di website ini untuk keperluan pribadi saya sendiri*
            </label> */}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-outline-primary-2 mt-3"
          >
            <span>
              {loading 
                ? "Loading" 
                : isGoogleFlow 
                  ? "Complete Profile" 
                  : "Register"
              }
            </span>
            <i className="icon-long-arrow-right"></i>
          </button>
        </div>

        <div className="text-gray-600 text-center py-3">
          Data Anda aman dan dijamin oleh mrkt. Indonesia
        </div>
      </form>

      {!isGoogleFlow && (
        <div className="form-choice">
          <p className="text-center">or sign in with</p>
          <div className="row">
            <div className="col-sm-12">
              <button
                className="btn btn-login btn-g w-full"
                onClick={handleGoogleSignin}
                disabled={loading}
              >
                <i className="icon-google"></i>
                {loading ? "Loading..." : "Masuk dengan Google"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualSignUpComponent;