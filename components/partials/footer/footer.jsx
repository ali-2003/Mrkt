import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { sendReferFriendEmail } from "@/utils/referFriend";
import { useDispatch } from "react-redux";
import { updateDiscount } from "@/redux/slice/cartSlice";

function Footer() {
  const router = useRouter();
  const [isBottomSticky, setIsBottomSticky] = useState(false);
  const [containerClass, setContainerClass] = useState("container");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const dispatch = useDispatch();

  useEffect(() => {
    handleBottomSticky();
    setContainerClass(
      router?.asPath?.includes("fullwidth") ? "container-fluid" : "container"
    );
  }, [router?.asPath]);

  useEffect(() => {
    window.addEventListener("resize", handleBottomSticky, { passive: true });
    return () => {
      window.removeEventListener("resize", handleBottomSticky);
    };
  }, []);
  
  const handleLogout = () => {
    dispatch(updateDiscount(null))
    signOut()
  } 

  function handleBottomSticky() {
    setIsBottomSticky(
      router?.pathname?.includes("product/default") && window.innerWidth > 991
    );
  }

  const handleRefer = async (e) => {
    e.preventDefault();
    
    // Validate email input first
    if (!email || !email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Check if user is logged in
    if (!session) {
      // Store the email they were trying to refer in sessionStorage
      // so we can use it after they log in
      sessionStorage.setItem('referralEmail', email);
      toast.info("Please log in to refer a friend");
      router.push("/auth/masuk");
      return;
    }
    
    // Check that user is not referring themselves
    if (email.toLowerCase() === session.user.email.toLowerCase()) {
      toast.error("You cannot refer yourself");
      return;
    }
    
    try {
      setLoading(true);
      
      // Get user name parts
      const firstName = session.user.name.split(" ")?.[0] || '';
      const lastName = session.user.name.split(" ")?.[1] || '';
      
      // Make sure the URL is valid
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      // Call the email sending function
      const result = await sendReferFriendEmail(
        session.user.email,
        email,
        firstName,
        lastName,
        siteUrl
      );
      
      if (result && result.success) {
        toast.success("Referral email sent successfully!");
        setEmail(""); // Clear the input
      } else {
        toast.error(result?.message || "Failed to send referral. Please try again.");
      }
    } catch (err) {
      console.error("Referral error:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer footer-1 bg-[#FCFCFC]">
      <div className="cta cta-horizontal bg-secondary">
        <div className={containerClass}>
          <div className="row align-items-center">
            <div className="col-lg-6 col-xl-5 offset-xl-1">
              <h3 className="cta-title text-white font-weight-normal mb-1 mb-lg-0">
                Dapatkan diskon besar!
              </h3>
              <p className="cta-desc font-weight-normal text-white">
                Bagikan ke teman untuk dapatkan diskon besar untuk order selanjutnya
              </p>
            </div>

            <div className="col-lg-6 col-xl-5">
              <form onSubmit={handleRefer}>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control mr-0 border-0 font-weight-normal"
                    placeholder="Masukan email teman kamu"
                    aria-label="Email Adress"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="input-group-append">
                    <button
                      className="btn btn-white font-weight-lighter !border-l !border-l-black"
                      disabled={loading}
                      type="submit"
                    >
                      {loading ? "Membagikan..." : "Bagikan"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the footer remains the same */}
      <div className="footer-middle text-black">
        <div className="container">
          <div className="row">
            <div className="col-sm-12 col-lg-6 col-xl-2-5col">
              <div className="widget widget-about">
                <Image
                  src="/images/home/header-logo-t.png"
                  className="footer-logo my-2 !w-[130px]"
                  alt="Footer Logo"
                  width={100}
                  height={31}
                />
                <p className="font-weight-normal mb-3">
                  {/* <br />{" "} */}
                </p>

                <div className="widget-about-info">
                  <div className="payment-info">
                    <span className="widget-about-title font-weight-normal">
                      Payment Method
                    </span>
                    <figure className="footer-payments">
                      <Image
                        src="/images/payments.png"
                        alt="Payment methods"
                        width={272}
                        height={20}
                      />
                    </figure>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-4 col-lg-2 col-xl-5col">
              <div className="widget">
                <h4 className="widget-titlefont-weight-lighter">
                Layanan Pelanggan
                </h4>

                <ul className="widget-list">
                  <li>
                    <Link href="/">Beranda</Link>
                  </li>
                  <li>
                    <Link href="/ejuice">E-liquid</Link>
                  </li>
                  <li>
                    <Link href="/informasi-penting">Informasi Penting</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-sm-4 col-lg-2 col-xl-5col">
              <div className="widget">
                <h4 className="widget-titlefont-weight-lighter">
                Informasi
                </h4>

                <ul className="widget-list">
                  <li>
                    <Link href="/tentang-kami">Tentang Kami</Link>
                  </li>
                  <li>
                    <Link href="/faq">FAQ</Link>
                  </li>
                  <li>
                    <Link href="/kontak-kami">Kontak Kami</Link>
                  </li>
                  <li>
                    <Link href="/syarat-and-ketentuan">
                    Syarat & Ketentuan
                    </Link>
                  </li>
                  <li>
                    <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-sm-4 col-lg-2 col-xl-5col">
              <div className="widget">
                <h4 className="widget-title font-weight-lighter">
                Akun Saya
                </h4>

                <ul className="widget-list">
                  <li>
                  {session ? (
                      <span
                        onClick={handleLogout}
                        className="!text-[#999999] cursor-pointer"
                      >
                        Keluar
                      </span>
                    ) : (
                      <Link href="/auth/masuk">Masuk</Link>
                    )}
                  </li>
                  <li>
                    <Link href="/keranjang">Lihat Keranjang</Link>
                  </li>
                  <li>
                    <Link href="/favorit">Favorit</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className={containerClass}>
          <p className="footer-copyright font-weight-normal">
            Copyright © {new Date().getFullYear()} Mrkt. All Rights
            Reserved.
          </p>

          <ul className="footer-menu">
            <li>
              <Link
                href="/syarat-and-ketentuan"
                className="font-weight-normal"
              >
                Syarat & Ketentuan
              </Link>
            </li>
            <li>
              <Link
                href="/kebijakan-privasi"
                className="font-weight-normal"
              >
                Kebijakan Privasi
              </Link>
            </li>
          </ul>

          <div className="social-icons social-icons-color">
            <span className="social-label font-weight-normal">
            Media Sosial
            </span>
            
            <a
              href="https://www.instagram.com/mrkt.id/"
              className="social-icon social-instagram"
              title="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="icon-instagram"></i>
            </a>
            <a
              href="https://www.tiktok.com/@mrkt.id"
              className="social-icon"
              title="TikTok"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      {isBottomSticky ? <div className="mb-10"></div> : ""}
    </footer>
  );
}

export default Footer;