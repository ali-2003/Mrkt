"use client";

import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Cookie from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    zIndex: "10001",
  },
  content: {
    maxWidth: "520px",
    width: "90vw",
    margin: "auto",
    padding: 0,
    border: "none",
    borderRadius: "8px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    background: "#ffffff",
  }
};

Modal.setAppElement("body");

function CombinedConfirmationModal() {
  const [open, setOpen] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ageConfirmed = Cookie.get(`hideConfirm-mrkt`);
    const privacyConfirmed = Cookie.get(`hideConfirm-privacy-mrkt`);
    
    if (!ageConfirmed || !privacyConfirmed) {
      setOpen(true);
    }
  }, []);

  function closeModal() {
    document
      .getElementById("combined-popup-modal")
      ?.classList.remove("ReactModal__Content--after-open");

    if (document.querySelector(".combined-modal-overlay")) {
      document.querySelector(".combined-modal-overlay").style.opacity = "0";
    }
    
    setTimeout(() => setOpen(false), 300);
  }

  const handleAcceptAll = () => {
    Cookie.set(`hideConfirm-mrkt`, "true", { expires: 7 });
    Cookie.set(`hideConfirm-privacy-mrkt`, "true", { expires: 7 });
    closeModal();
  };

  const handleDecline = () => {
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
      <div className="modal-content">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Syarat & Privasi</h1>
          <p className="text-gray-600 leading-relaxed">
            Sebelum mengakses Mrkt, harap tinjau dan setujui syarat layanan dan kebijakan privasi kami.
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="space-y-6">
            {/* Age Confirmation */}
            <div className="pb-4 border-b border-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verifikasi Usia</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dengan melanjutkan, Anda mengkonfirmasi bahwa Anda berusia 18 tahun atau lebih. 
                Layanan ini hanya terbatas untuk pengguna dewasa.
              </p>
            </div>

            {/* Privacy Policy */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Kebijakan Privasi & Data</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Anda menyetujui praktik pemrosesan data kami sebagaimana diuraikan dalam{" "}
                <Link 
                  href="/kebijakan-privasi" 
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Kebijakan Privasi
                </Link>{" "}
                dan Kebijakan Cookie kami.
              </p>

              <button 
                onClick={() => setPrivacyExpanded(!privacyExpanded)} 
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center transition-colors"
              >
                {privacyExpanded ? 'Sembunyikan detail' : 'Lihat detail kebijakan'}
                <svg 
                  className={`ml-1 h-4 w-4 transition-transform ${privacyExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {privacyExpanded && (
                <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-100">
                  <div className="text-sm text-gray-700 space-y-4">
                    <p>
                      Kami mengumpulkan dan memproses data pribadi termasuk alamat IP, perilaku penelusuran, 
                      dan informasi lain yang diperlukan untuk menyediakan layanan kami secara efektif.
                    </p>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Poin Utama:</h4>
                      <ul className="space-y-1 ml-4">
                        <li className="relative">
                          <span className="absolute -left-4 text-gray-400">•</span>
                          Pengumpulan data mencakup alamat IP dan pola penelusuran
                        </li>
                        <li className="relative">
                          <span className="absolute -left-4 text-gray-400">•</span>
                          Informasi dapat dibagikan dengan pihak ketiga terpercaya
                        </li>
                        <li className="relative">
                          <span className="absolute -left-4 text-gray-400">•</span>
                          Anda memiliki hak untuk mengakses, memperbaiki, dan menghapus data Anda
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Preferensi Cookie:</h4>
                      <div className="space-y-2">
                        <label className="flex items-center text-sm">
                          <input 
                            type="checkbox" 
                            defaultChecked={true} 
                            disabled 
                            className="mr-3 accent-gray-900"
                          />
                          <span className="text-gray-600">Cookie esensial (diperlukan untuk fungsionalitas)</span>
                        </label>
                        <label className="flex items-center text-sm">
                          <input type="checkbox" className="mr-3 accent-gray-900" />
                          <span className="text-gray-600">Cookie analitik (peningkatan situs)</span>
                        </label>
                        <label className="flex items-center text-sm">
                          <input type="checkbox" className="mr-3 accent-gray-900" />
                          <span className="text-gray-600">Cookie pemasaran (iklan yang dipersonalisasi)</span>
                        </label>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                      Penggunaan berkelanjutan dari situs web ini tanpa mengubah pengaturan merupakan penerimaan kebijakan cookie kami.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button 
            onClick={handleDecline} 
            className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded font-medium hover:bg-gray-50 transition-colors"
          >
            Tolak
          </button>
          <button 
            onClick={handleAcceptAll} 
            className="flex-1 px-6 py-3 bg-gray-900 text-white rounded font-medium hover:bg-gray-800 transition-colors"
          >
            Setujui Semua Syarat
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CombinedConfirmationModal;