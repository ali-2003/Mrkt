"use client";

import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Cookie from "js-cookie";
import { useRouter } from "next/navigation";
import Image from "next/image";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(51,51,51,0.6)",
    zIndex: "10001",
  },
};

Modal.setAppElement("body");

function AgeConfirmModal() {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    Cookie.get(`hideConfirm-mrkt`) || setOpen(true);
  }, []);

  function closeModal(e) {
    document
      .getElementById("hide-popup-modal")
      .classList.remove("ReactModal__Content--after-open");

    if (document.querySelector(".ReactModal__Overlay")) {
      document.querySelector(".ReactModal__Overlay").style.opacity = "0";
    }
  }

  const storeCookie = () => {
    setTimeout(() => {
      setOpen(false);
      Cookie.set(`hideConfirm-mrkt`, "true", {
        expires: 7,
      });
    }, 350);
  }

  const handleConfirm = () => {
    closeModal();
    storeCookie();
  }

  const cancelConfirm = () => {
    closeModal()
    router.back();
  }

  return (
    <Modal
      isOpen={open}
      onRequestClose={closeModal}
      style={customStyles}
      shouldReturnFocusAfterClose={false}
      contentLabel="Newsletter Modal"
      className="container newsletter-popup-container h-auto flex justify-center"
      overlayClassName="flex items-center justify-center newsletter-modal"
      id="hide-popup-modal"
    >
      <div className="modal-content max-w-[800px] overflow-hidden">
        <div className="row justify-content-center position-relative">
          <div className="w-full">
            <div className="w-full flex justify-center items-center bg-white newsletter-popup-content">
              <div className="banner-content text-center">
                <Image
                  src="/images/home/header-logo-t.png"
                  alt="logo"
                  className="logo"
                  width="100"
                  height="15"
                />
                <h2 className="banner-title">Yuk konfirmasi bahwa umurmu diatas 18+</h2>
                <p>
                Mrkt. hanya bisa diakses oleh pengguna berusia 18 tahun ke atas.
                </p>
                <div className="w-full flex flex-col-reverse md:flex-row items-center">
                  <button onClick={cancelConfirm} className="hover:underline transition-all duration-300 ease-in py-4 w-full rounded-lg text-2xl">
                    Cancel
                  </button>
                  <button onClick={handleConfirm} className="bg-[#154881] hover:bg-[#154881e6] transition-all duration-100 ease-in text-white py-4 w-full rounded-lg text-2xl">
                    Confirm
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

export default AgeConfirmModal;
