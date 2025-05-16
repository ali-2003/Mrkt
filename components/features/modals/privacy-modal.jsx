"use client";

import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Cookie from "js-cookie";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(51,51,51,0.6)",
    zIndex: "10001",
  },
};

Modal.setAppElement("body");

function PrivacyModal() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const router = useRouter();

  useEffect(() => {
    if (!Cookie.get(`hideConfirm-privacy-mrkt`)) {
      setOpen(true);
    }
  }, []);

  function closeModal(e) {
    document.getElementById("hide-privacy-popup-modal").classList.remove("ReactModal__Content--after-open");

    if (document.querySelector(".overlay-privacy-modal")) {
      document.querySelector(".overlay-privacy-modal").style.display = "none";
    }
  }

  const storeCookie = () => {
    setTimeout(() => {
      setOpen(false);
      Cookie.set(`hideConfirm-privacy-mrkt`, "true", {
        expires: 7,
      });
    }, 350);
  };

  const handleConfirm = () => {
    closeModal();
    storeCookie();
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
      contentLabel="Privacy Modal"
      className="newsletter-popup-container h-auto flex justify-center"
      overlayClassName="flex items-end pb-2 justify-center overlay-privacy-modal newsletter-modal"
      id="hide-privacy-popup-modal"
    >
      <div className="modal-content h-[300px] w-[90vw] max-w-[90vw] overflow-hidden">
        <div className="row justify-content-center position-relative overflow-y-scroll">
          <button type="button" className="close absolute top-[7px] md:top-[5px] right-[12px] md:right-[5px] z-[99999]" onClick={closeModal}>
            <span aria-hidden="true">
              <i className="icon-close"></i>
            </span>
          </button>

          <div className="w-full">
            <div className="w-full flex justify-center items-center bg-white newsletter-popup-content">
              <div className="banner-content">
                <h2 className="text-center text-4xl md:text-5xl font-semibold py-0 md:py-4">Kami menghargai privasi Anda</h2>

                <p>
                  Website ini menggunakan cookie dan teknologi pelacak lainnya untuk meningkatkan pengalaman penelusuran agar lebih sesuai dengan kebutuhan Anda. Dengan mengklik
                  “Terima”, Anda menyetujui pemrosesan data pribadi Anda sesuai dengan <Link href="/kebijakan-privasi">Kebijakan Privasi dan Kebijakan Cookie</Link>
                </p>
                {!collapsed && (
                  <>
                    <p>Kami tidak membagikan informasi pribadi Anda dengan pihak ketiga, kecuali jika dibutuhkan untuk kebutuhan profesional dan bisnis kami secara sah.</p>

                    <div>
                      <h3 className="text-2xl md:text-3xl font-semibold">Poin Penting</h3>
                      <ul>
                        <li className="list-disc">
                          Kami mengumpulkan data pribadi seperti alamat IP, perilaku penelusuran, dan informasi lain yang dibutuhkan untuk fungsionalitas dan peningkatan situs web.
                        </li>
                        <li className="list-disc">Kami mungkin membagikan data Anda kepada pihak ketiga yang terpercaya.</li>
                        <li className="list-disc">Anda memiliki hak untuk mengakses, memperbaiki dan menghapus data Anda.</li>
                      </ul>
                      <p>
                        Detail informasi tambahan terkait data yang kami kumpulkan dan hak Anda, dapat mengunjungi <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
                      </p>

                      <div>
                        <h3 className="text-2xl md:text-3xl font-semibold">Options dengan kelola preferensi</h3>
                        <p>Kelola Preferensi:</p>
                        <div>
                          <label className="flex gap-2 items-center">
                            <input type="checkbox" />
                            Cookie Esensial (dibutuhkan untuk fungsionalitas situs web)
                          </label>
                          <label className="flex gap-2 items-center">
                            <input type="checkbox" />
                            Cookie Analytics (membantu kami untuk meningkatkan performa situs web)
                          </label>
                          <label className="flex gap-2 items-center">
                            <input type="checkbox" />
                            Cookie Pemasaran (iklan dipersonalisasi)
                          </label>
                        </div>

                        <p>Dengan terus menggunakan situs web ini tanpa mengubah pengaturan, Anda menyetujui atas penggunaan cookie dan teknologi penelusuran lainnya.</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="w-full flex flex-col md:flex-row items-center">
                  {/* <button onClick={cancelConfirm} className="hover:underline transition-all duration-300 ease-in py-4 w-full rounded-lg text-2xl"> */}
                  {collapsed && (
                    <button onClick={() => setCollapsed(false)} className="hover:underline transition-all duration-300 ease-in py-4 w-full rounded-lg text-2xl ">
                      Mengelola Preferensi
                    </button>
                  )}
                  <button onClick={handleConfirm} className="bg-[#154881] hover:bg-[#154881e6] transition-all duration-100 ease-in text-white py-4 w-full rounded-lg text-2xl">
                    Terima Semua
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PrivacyModal;
