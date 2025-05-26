// pages/auth/complete-profile.js or app/auth/complete-profile/page.js

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import IndividualSignUpComponent from "@/components/IndividualSignUpComponent";

const CompleteProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      // Not signed in, redirect to sign in
      router.push("/auth/masuk");
      return;
    }

    if (session.user.profileCompleted) {
      // Profile already completed, redirect to dashboard
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.profileCompleted) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {session.user.name}!
            </h2>
            <p className="text-gray-600 mt-2">
              Please complete your profile to continue
            </p>
          </div>
          
          {/* Use your existing IndividualSignUpComponent */}
          <IndividualSignUpComponent />
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;