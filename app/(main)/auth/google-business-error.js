'use client';
// Save this file as /app/auth/google-business-error/page.js
import Link from 'next/link';

export default function GoogleBusinessError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign-in Not Allowed
          </h2>
          <div className="mt-2 text-center text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-700 mb-4">
            Google sign-in is only available for personal accounts.
          </p>
          <p className="text-gray-700 mb-6">
            Your email is registered as a business account. Please use your email and password to sign in instead.
          </p>
          
          <div className="mt-6">
            <Link href="/auth/masuk" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}