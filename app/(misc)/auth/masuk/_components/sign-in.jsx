"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import { sanityAdminClient } from "@/sanity/lib/client.js";
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
  const dispatch = useDispatch()

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

    return true
  }

  const checkUser = async () => {
    const existingUser = await sanityAdminClient.fetch(`*[email == $email][0]`, { email: formData.semail })
    if (existingUser && existingUser?.userType === type) {
      dispatch(setUser(existingUser))
      return true
    } else {
      toast.error(`${type === 'individual' ? 'User' : 'Business'} not found${type === business ? ' or approved yet.' : '.'}`);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm(formData)) {
      return;
    }
    
    setLoading(true);

    try {

      const res = await signIn("credentials", {
      // const res = await signIn("sanity-login", {
        redirect: false,
        identifier: formData.semail,
        type,
        password: formData.spassword,
      });

      if (res?.ok) {
        toast.success("Login Successfull!");
        setFormData(initialState);
        router.push("/");
      } else {
        toast.error(res?.error || "Error Logging In");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Error Registering");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // const userValid = await checkUser()

      // if (!userValid) {
      //   return;
      // }
      
      await signIn("google");
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error("Error Logging In");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-center py-2">Masuk</h3>
      <div>
        <form>
          <div className="form-group">
            <label htmlFor="singin-email-2">Alamat email *</label>
            <input type="text" className="form-control" id="singin-email-2" value={formData.semail} onChange={handleChange} name="semail" />
            {formErrors?.semail && <span className="text-red-600">*{formErrors.semail}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="singin-password-2">Kata sandi *</label>
            <input type="password" className="form-control" id="singin-password-2" value={formData.spassword} onChange={handleChange} name="spassword" />
            {formErrors?.spassword && <span className="text-red-600">*{formErrors.spassword}</span>}
          </div>

          <div className="form-footer flex justify-between">
            <button type="button" onClick={handleSubmit} className="btn btn-outline-primary-2" disabled={loading}>
              <span>{loading ? "Memuat" : "Masuk"}</span>
              <i className="icon-long-arrow-right"></i>
            </button>
          </div>
        </form>
        <div className="form-choice">
          <p className="text-center">or sign in with</p>
          <div className="row">
            <div className="col-sm-12">
              <button
                className="btn btn-login btn-g w-full"
                onClick={handleGoogleLogin}
              >
                <i className="icon-google"></i>
                Masuk dengan Google
              </button>
            </div>
            {/* <div className="col-sm-6">
              <button
                className="btn btn-login btn-f w-full"
                onClick={() => signIn("facebook")}
              >
                <i className="icon-facebook-f"></i>
                Login With Facebook
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInComponent;
