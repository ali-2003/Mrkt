// app/auth/complete-profile-check/page.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CompleteProfileCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // Still loading

    console.log("Profile check - status:", status);
    console.log("Profile check - session:", session);

    if (!session) {
      // No session, redirect to login
      console.log("No session, redirecting to login");
      setRedirecting(true);
      router.push("/auth/masuk");
      return;
    }

    console.log("Profile check - session data:", {
      profileCompleted: session.user?.profileCompleted,
      authType: session.user?.authType,
      id: session.user?.id
    });

    // Check if profile is incomplete for Google users
    if (session.user?.authType === 'google' && session.user?.profileCompleted === false) {
      console.log("Google user with incomplete profile, redirecting to complete profile");
      setRedirecting(true);
      router.push("/auth/complete-profile");
    } else if (session.user?.profileCompleted === true) {
      // Profile is complete, redirect to dashboard
      console.log("Profile complete, redirecting to dashboard");
      setRedirecting(true);
      router.push("/dashboard");
    } else {
      // For non-Google users or other cases, redirect to dashboard
      console.log("Non-Google user or other case, redirecting to dashboard");
      setRedirecting(true);
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading" || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {status === "loading" ? "Loading your session..." : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Checking your profile...</p>
      </div>
    </div>
  );
}