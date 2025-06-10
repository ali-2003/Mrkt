// app/auth/error/page.js
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = () => {
    switch (error) {
      case "AccessDenied":
        return "Tidak ditemukan akun dengan alamat email Google ini. Silakan daftar terlebih dahulu atau masuk menggunakan email/kata sandi.";
      case "OAuthSignin":
        return "Terjadi kesalahan saat masuk dengan Google. Silakan coba lagi.";
      case "OAuthCallback":
        return "Terjadi kesalahan saat proses autentikasi Google.";
      case "OAuthCreateAccount":
        return "Tidak dapat membuat akun dengan Google. Silakan daftar secara manual.";
      case "EmailCreateAccount":
        return "Tidak dapat membuat akun dengan email ini.";
      case "Callback":
        return "Terjadi kesalahan saat proses autentikasi.";
      case "OAuthAccountNotLinked":
        return "Email ini sudah terkait dengan akun lain.";
      case "EmailSignin":
        return "Periksa email Anda untuk tautan masuk.";
      case "CredentialsSignin":
        return "Email atau kata sandi tidak valid.";
      case "SessionRequired":
        return "Silakan masuk untuk mengakses halaman ini.";
      default:
        return "Terjadi kesalahan autentikasi. Silakan coba lagi.";
    }
  };

  const getErrorTitle = () => {
    switch (error) {
      case "AccessDenied":
        return "Akun Tidak Ditemukan";
      case "OAuthSignin":
      case "OAuthCallback":
        return "Kesalahan Masuk Google";
      case "CredentialsSignin":
        return "Gagal Masuk";
      default:
        return "Kesalahan Autentikasi";
    }
  };

  const getActionButton = () => {
    switch (error) {
      case "AccessDenied":
        return (
          <div className="flex flex-col space-y-3">
            <Link 
              href="/auth/daftar" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Buat Akun Baru
            </Link>
            <Link 
              href="/auth/masuk" 
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Masuk dengan Email
            </Link>
          </div>
        );
      default:
        return (
          <Link 
            href="/auth/masuk" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Coba Masuk Lagi
          </Link>
        );
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
          {error === "AccessDenied" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                <strong>Catatan:</strong> Anda perlu mendaftar akun terlebih dahulu sebelum dapat masuk dengan Google. 
                Masuk dengan Google hanya berfungsi untuk akun yang sudah terdaftar.
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-3">
            {getActionButton()}
            
            <Link 
              href="/" 
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}