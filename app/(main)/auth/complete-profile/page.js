// app/auth/complete-profile/page.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function CompleteProfile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    whatsapp: "",
    dob: "",
    agreementChecked: false,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/masuk");
      return;
    }

    // If profile is already complete, redirect to homepage
    if (session.user.profileCompleted) {
      router.push("/");
      return;
    }

    // If not a Google user, redirect to registration
    if (session.user.authType !== 'google') {
      router.push("/auth/daftar");
      return;
    }

    // Check for stored referral code
    const storedCode = sessionStorage.getItem('referralCode');
    if (storedCode) {
      setFormData(prev => ({ ...prev, code: storedCode }));
      sessionStorage.removeItem('referralCode');
    }
  }, [session, status, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.whatsapp.trim()) {
      errors.whatsapp = "Please enter your WhatsApp number";
    }

    if (!formData.dob) {
      errors.dob = "Please enter your Date of birth";
    } else {
      const today = new Date();
      const dob = new Date(formData.dob);
      if (today.getFullYear() - dob.getFullYear() < 18) {
        errors.dob = "You must be at least 18 years old";
      }
    }

    if (!formData.agreementChecked) {
      errors.agreementChecked = "Please agree to the privacy policy";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          whatsapp: formData.whatsapp,
          dob: formData.dob,
          code: formData.code,
        }),
      });

      const data = await res.json();

      if (data.status !== 'success') {
        toast.error(data.message || 'Error completing profile');
        return;
      }

      toast.success("Profile completed successfully!");
      
      // Update the session to reflect completed profile
      await update({
        ...session,
        user: {
          ...session.user,
          profileCompleted: true,
          whatsapp: formData.whatsapp,
          dob: formData.dob,
        }
      });

      router.push("/");

    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error("Error completing profile");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.profileCompleted) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Lengkapi Profil Anda
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Selamat datang {session.user.name}! Silakan lengkapi profil Anda untuk melanjutkan.
          </p>
        </div>

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-700">
            Masuk sebagai: <strong>{session.user.name}</strong> ({session.user.email})
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                Nomor WhatsApp *
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="text"
                value={formData.whatsapp}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Masukkan nomor WhatsApp Anda"
              />
              {formErrors.whatsapp && (
                <p className="mt-1 text-sm text-red-600">{formErrors.whatsapp}</p>
              )}
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                Tanggal Lahir *
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
              {formErrors.dob && (
                <p className="mt-1 text-sm text-red-600">{formErrors.dob}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="agreementChecked"
                name="agreementChecked"
                type="checkbox"
                checked={formData.agreementChecked}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="agreementChecked" className="ml-2 block text-sm text-gray-900">
                Saya menyatakan bahwa saya adalah perokok dan/atau pengguna produk tembakau alternatif berusia di atas 18 tahun, 
                bertujuan menggunakan produk yang ada di website ini untuk keperluan pribadi saya sendiri *
              </label>
            </div>
            {formErrors.agreementChecked && (
              <p className="text-sm text-red-600">{formErrors.agreementChecked}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Melengkapi Profil..." : "Lengkapi Profil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}