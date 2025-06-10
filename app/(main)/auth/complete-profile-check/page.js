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
    } else {
      // Profile is complete or non-Google user, redirect to homepage
      console.log("Profile complete or non-Google user, redirecting to homepage");
      setRedirecting(true);
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {status === "loading" ? "Memuat sesi Anda..." : "Mengalihkan..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Memeriksa profil Anda...</p>
      </div>
    </div>
  );
}