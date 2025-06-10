// app/auth/error/page.js
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const getErrorMessage = () => {
    if (message) return decodeURIComponent(message);
    
    switch (error) {
      case "BusinessGoogleLogin":
        return "Business accounts cannot sign in with Google. Please use your email and password to login.";
      case "SignInError":
        return "An error occurred during sign in. Please try again.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      default:
        return "An authentication error occurred. Please try again.";
    }
  };

  const getErrorTitle = () => {
    switch (error) {
      case "BusinessGoogleLogin":
        return "Google Sign-in Not Available";
      case "SignInError":
        return "Sign-in Error";
      case "AccessDenied":
        return "Access Denied";
      case "Verification":
        return "Verification Error";
      default:
        return "Authentication Error";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {getErrorTitle()}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage()}
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          {error === "BusinessGoogleLogin" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                <strong>Business users:</strong> Please use the email and password login option instead of Google sign-in.
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-3">
            <Link 
              href="/auth/masuk" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Sign In Again
            </Link>
            
            <Link 
              href="/auth/daftar" 
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create New Account
            </Link>
            
            <Link 
              href="/" 
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}