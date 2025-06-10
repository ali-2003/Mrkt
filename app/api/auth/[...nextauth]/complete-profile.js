// app/auth/complete-profile-check/page.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CompleteProfileCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      // No session, redirect to login
      router.push("/auth/masuk");
      return;
    }

    console.log("Profile check - session data:", {
      profileCompleted: session.user.profileCompleted,
      authType: session.user.authType,
      id: session.user.id
    });

    // Check if profile is incomplete
    if (session.user.authType === 'google' && !session.user.profileCompleted) {
      console.log("Redirecting to complete profile");
      router.push("/auth/complete-profile");
    } else {
      // Profile is complete or not a Google user, redirect to dashboard
      console.log("Profile complete, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}