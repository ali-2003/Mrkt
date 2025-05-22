"use client";

import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Cookie from "js-cookie";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(51,51,51,0.4)",
    backdropFilter: "blur(5px)",
    zIndex: "10001",
  },
  content: {
    maxWidth: "450px",
    width: "85vw",
    margin: "auto",
    padding: 0,
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  }
};

Modal.setAppElement("body");

function CombinedConfirmationModal() {
  const [open, setOpen] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check cookies
    const ageConfirmed = Cookie.get(`hideConfirm-mrkt`);
    const privacyConfirmed = Cookie.get(`hideConfirm-privacy-mrkt`);
    
    if (!ageConfirmed || !privacyConfirmed) {
      setOpen(true);
      // Set checkboxes based on existing cookies
      if (ageConfirmed) setAgeChecked(true);
      if (privacyConfirmed) setPrivacyChecked(true);
    }
  }, []);

  function closeModal() {
    document
      .getElementById("combined-popup-modal")
      .classList.remove("ReactModal__Content--after-open");

    if (document.querySelector(".combined-modal-overlay")) {
      document.querySelector(".combined-modal-overlay").style.opacity = "0";
      document.querySelector(".combined-modal-overlay").style.display = "none";
    }
    
    setTimeout(() => setOpen(false), 350);
  }

  const storeAgeCookie = () => {
    Cookie.set(`hideConfirm-mrkt`, "true", {
      expires: 7,
    });
  };

  const storePrivacyCookie = () => {
    Cookie.set(`hideConfirm-privacy-mrkt`, "true", {
      expires: 7,
    });
  };

  const handleConfirm = () => {
    if (ageChecked) storeAgeCookie();
    if (privacyChecked) storePrivacyCookie();
    
    // Close only if both are checked
    if (ageChecked && privacyChecked) {
      closeModal();
    }
  };

  const cancelConfirm = () => {
    closeModal();
    router.back();
  };

  return (
    <Modal
      isOpen={open}
      onRequestClose={closeModal}
      style={customStyles}
      shouldReturnFocusAfterClose={false}
      contentLabel="Confirmation Modal"
      className="confirmation-modal-container"
      overlayClassName="flex items-center justify-center combined-modal-overlay"
      id="combined-popup-modal"
    >
      <div className="modal-content bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="modal-header p-3 border-b border-gray-200 flex items-center justify-between">
          <Image
            src="/images/home/header-logo-t.png"
            alt="logo"
            className="logo"
            width="90"
            height="15"
          />
          <button 
            type="button" 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={closeModal}
          >
            <span className="text-xl" aria-hidden="true">×</span>
          </button>
        </div>

        {/* Content area */}
        <div className="modal-body p-4 max-h-[60vh] overflow-y-auto text-base">
          <h2 className="text-2xl font-semibold mb-3 text-center">Selamat Datang di Mrkt</h2>
          
          <div className="age-confirmation mb-4 bg-gray-50 p-3 rounded-lg">
            <div className="flex gap-2 mb-2">
              <div className="flex-shrink-0 mt-1">
                <input 
                  type="checkbox" 
                  id="age-checkbox" 
                  className="w-5 h-5 accent-[#154881]" 
                  checked={ageChecked}
                  onChange={() => setAgeChecked(!ageChecked)}
                />
              </div>
              <div>
                <label htmlFor="age-checkbox" className="font-medium cursor-pointer text-lg">Konfirmasi Usia 18+</label>
                <p className="text-gray-600 mt-1">
                  Saya menyatakan bahwa saya berusia 18 tahun atau lebih. Mrkt. hanya bisa diakses oleh pengguna berusia 18 tahun ke atas.
                </p>
              </div>
            </div>
          </div>
          
          <div className="privacy-confirmation bg-gray-50 p-3 rounded-lg">
            <div className="flex gap-2 mb-2">
              <div className="flex-shrink-0 mt-1">
                <input 
                  type="checkbox" 
                  id="privacy-checkbox" 
                  className="w-5 h-5 accent-[#154881]" 
                  checked={privacyChecked}
                  onChange={() => setPrivacyChecked(!privacyChecked)}
                />
              </div>
              <div>
                <label htmlFor="privacy-checkbox" className="font-medium cursor-pointer text-lg">Kebijakan Privasi</label>
                <p className="text-gray-600 mt-1">
                  Saya menyetujui pemrosesan data pribadi sesuai dengan <Link href="/kebijakan-privasi" className="text-blue-600 hover:underline">Kebijakan Privasi dan Kebijakan Cookie</Link>
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setPrivacyExpanded(!privacyExpanded)} 
              className="flex items-center text-blue-600 mt-2 hover:underline"
            >
              {privacyExpanded ? 'Sembunyikan detail' : 'Lihat detail kebijakan'} 
              <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 transition-transform ${privacyExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {privacyExpanded && (
              <div className="expanded-privacy-content mt-3 pt-2 border-t border-gray-200">
                <p className="mb-2 text-gray-600">Kami tidak membagikan informasi pribadi Anda dengan pihak ketiga, kecuali jika dibutuhkan untuk kebutuhan profesional dan bisnis kami secara sah.</p>

                <h3 className="text-lg font-semibold mb-1">Poin Penting</h3>
                <ul className="pl-5 mb-2 text-gray-600">
                  <li className="list-disc mb-1">
                    Kami mengumpulkan data pribadi seperti alamat IP, perilaku penelusuran, dan informasi lain yang dibutuhkan.
                  </li>
                  <li className="list-disc mb-1">Kami mungkin membagikan data Anda kepada pihak ketiga yang terpercaya.</li>
                  <li className="list-disc mb-1">Anda memiliki hak untuk mengakses, memperbaiki dan menghapus data Anda.</li>
                </ul>
                
                <h3 className="text-lg font-semibold mb-1">Kelola Preferensi</h3>
                <div className="mb-2">
                  <label className="flex gap-2 items-center mb-1 text-gray-600">
                    <input type="checkbox" defaultChecked={true} disabled className="accent-blue-600" />
                    Cookie Esensial (dibutuhkan untuk fungsionalitas)
                  </label>
                  <label className="flex gap-2 items-center mb-1 text-gray-600">
                    <input type="checkbox" className="accent-blue-600" />
                    Cookie Analytics (membantu kami meningkatkan situs)
                  </label>
                  <label className="flex gap-2 items-center mb-1 text-gray-600">
                    <input type="checkbox" className="accent-blue-600" />
                    Cookie Pemasaran (iklan dipersonalisasi)
                  </label>
                </div>

                <p className="text-xs text-gray-500">Dengan terus menggunakan situs web ini tanpa mengubah pengaturan, Anda menyetujui penggunaan cookie.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="modal-footer p-3 border-t border-gray-200">
          <div className="flex gap-2">
            <button 
              onClick={cancelConfirm} 
              className="w-1/2 py-2.5 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-base"
            >
              Batal
            </button>
            <button 
              onClick={handleConfirm} 
              className={`w-1/2 py-2.5 px-4 ${ageChecked && privacyChecked ? 'bg-[#154881] hover:bg-[#154881e6]' : 'bg-gray-300 cursor-not-allowed'} text-white rounded transition-colors text-base`}
              disabled={!ageChecked || !privacyChecked}
            >
              Konfirmasi
            </button>
          </div>
          {(!ageChecked || !privacyChecked) && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Silakan setujui kedua persyaratan di atas untuk melanjutkan
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default CombinedConfirmationModal;