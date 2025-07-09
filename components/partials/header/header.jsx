import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";

import LoginModal from "@/components/features/modals/login-modal";
import HeaderSearch from "@/components/partials/header/partials/header-search";
import CartMenu from "@/components/partials/header/partials/cart-menu";
import MainMenu from "@/components/partials/header/partials/main-menu";
import StickyHeader from "@/components/features/sticky-header";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { removeDiscount, emptyCart } from "@/redux/slice/cartSlice"; // Fixed import
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

function Header() {
  const { data: session } = useSession();
  const wishlist = useSelector((state) => state.wishlist.items);
  const dispatch = useDispatch();
  const pathname = usePathname();

  function openMobileMenu() {
    document.querySelector("body").classList.add("mmenu-active");
  }

  function closeMobileMenu() {
    document.querySelector("body").classList.remove("mmenu-active");
  }

  // Fixed logout function
  const handleLogout = async () => {
    try {
      // Clear cart state
      dispatch(emptyCart());
      dispatch(removeDiscount()); // Fixed: use removeDiscount instead of updateDiscount
      
      // Clear browser storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Sign out
      await signOut({ redirect: false });
      
      // Redirect to home
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const handleMobileLogout = async () => {
    closeMobileMenu();
    await handleLogout();
  };

  const handleMobileLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <>
      {/* Inline Mobile Menu CSS */}
      <style jsx global>{`
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .mobile-menu-container {
          position: fixed;
          top: 0;
          left: -300px;
          width: 280px;
          height: 100%;
          background-color: #fff;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          transition: left 0.3s ease;
          overflow-y: auto;
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          background-color: #f8f9fa;
        }

        .mobile-menu-logo {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .mobile-menu-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #333;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .mobile-menu-close:hover {
          color: #007bff;
          background-color: #e9ecef;
        }

        .mobile-menu-nav {
          padding: 20px 0;
        }

        .mobile-menu-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .mobile-menu-list li {
          border-bottom: 1px solid #f0f0f0;
          transform: translateX(-20px);
          opacity: 0;
          animation: slideInLeft 0.3s ease forwards;
        }

        .mobile-menu-list li:nth-child(1) { animation-delay: 0.1s; }
        .mobile-menu-list li:nth-child(2) { animation-delay: 0.2s; }
        .mobile-menu-list li:nth-child(3) { animation-delay: 0.3s; }
        .mobile-menu-list li:nth-child(4) { animation-delay: 0.4s; }
        .mobile-menu-list li:nth-child(5) { animation-delay: 0.5s; }
        .mobile-menu-list li:nth-child(6) { animation-delay: 0.6s; }

        .mobile-menu-list li:last-child {
          border-bottom: none;
        }

        .mobile-menu-list li a,
        .mobile-menu-list li button {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          color: #333;
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .mobile-menu-list li a:hover,
        .mobile-menu-list li button:hover,
        .mobile-menu-list li.active a {
          background-color: #f8f9fa;
          color: #007bff;
          padding-left: 25px;
        }

        .mobile-menu-list li a i,
        .mobile-menu-list li button i {
          margin-right: 12px;
          font-size: 18px;
          width: 20px;
          text-align: center;
        }

        .mobile-menu-list li.user-info {
          background-color: #f8f9fa;
          border-bottom: 2px solid #007bff;
        }

        .mobile-menu-list li.user-info .user-profile {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          color: #007bff;
          font-weight: 600;
        }

        .mobile-menu-list li.user-info .user-profile i {
          margin-right: 12px;
          font-size: 18px;
        }

        .mobile-logout-btn {
          color: #dc3545 !important;
        }

        .mobile-logout-btn:hover {
          background-color: #f8d7da !important;
          color: #721c24 !important;
        }

        .mobile-menu-badge {
          background-color: #007bff;
          color: white;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 5px;
          min-width: 18px;
          text-align: center;
        }

        /* Show mobile menu when body has mmenu-active class */
        body.mmenu-active .mobile-menu-overlay {
          opacity: 1;
          visibility: visible;
        }

        body.mmenu-active .mobile-menu-container {
          left: 0;
        }

        /* Prevent body scroll when mobile menu is open */
        body.mmenu-active {
          overflow: hidden;
        }

        /* Hide mobile menu on desktop */
        @media (min-width: 992px) {
          .mobile-menu-overlay {
            display: none;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .mobile-menu-container {
            width: 250px;
            left: -250px;
          }
        }

        @keyframes slideInLeft {
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <header className="header header-35 bg-[#FCFCFC]">
        {/* <header className="header header-35 bg-primary"> */}
        <div className="header-top">
          <div className="container py-3">
            <div className="header-left">
            </div>

            <div className="header-right">
              <ul className="top-menu">
                <li>
                  <a href="#">Links</a>
                  <ul>
                    <li>
                      <Link href="/favorit">
                        <i className="icon-heart-o"></i>Favorit{" "}
                        <span className="text-secondary">
                          ({wishlist?.length || 0})
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/affiliate-marketing">Affiliate Marketing</Link>
                    </li>
                    <li>
                      <Link href="/tentang-kami">Tentang Kami</Link>
                    </li>
                    <li>
                      <Link href="/kontak-kami">Kontak Kami</Link>
                    </li>
                    {/* <LoginModal /> */}
                    <li>
                      {session ? (
                        <span
                          onClick={handleLogout}
                          className="!text-[#999999] cursor-pointer"
                        >
                          <i className="icon-user"></i>Keluar
                        </span>
                      ) : (
                        <>
                          <i className="icon-user"></i>
                          <Link href="/auth/masuk">
                            Masuk
                          </Link>
                          <Link href="/auth/daftar" className="ml-3">
                            Daftar
                          </Link>
                        </>
                      )}
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <StickyHeader>
          <div className="header-middle sticky-header border-bottom-0">
            <div className="container">
              <div className="d-flex w-100 position-relative">
                <div className="header-left">
                  <button
                    className="mobile-menu-toggler"
                    onClick={openMobileMenu}
                  >
                    <span className="sr-only">Toggle mobile menu</span>
                    <i className="icon-bars"></i>
                  </button>

                  <Link href="/" className="logo">
                    <Image
                      src="/images/home/header-logo-t.png"
                      className="w-[130px]"
                      alt="Molla Logo"
                      width={100}
                      height={31}
                    />
                  </Link>

                  <MainMenu />
                </div>

                <div className="header-right">
                  {/* <HeaderSearch /> */}
                  <CartMenu />
                </div>
              </div>
            </div>
          </div>
        </StickyHeader>
      </header>

      {/* Custom Mobile Menu - Integrated directly in header */}
      <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
        <div className="mobile-menu-container" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-menu-header">
            <div className="mobile-menu-logo">Menu</div>
            <button 
              className="mobile-menu-close"
              onClick={closeMobileMenu}
            >
              <i className="icon-close"></i>
            </button>
          </div>
          
          <nav className="mobile-menu-nav">
            <ul className="mobile-menu-list">
              {/* 1. Devices */}
              <li className={pathname?.includes("/devices") ? "active" : ""}>
                <Link href="/devices" onClick={handleMobileLinkClick}>
                  <i className="icon-laptop"></i>
                  <span>Devices</span>
                </Link>
              </li>
              
              {/* 2. E-juice */}
              <li className={pathname?.includes("/ejuice") ? "active" : ""}>
                <Link href="/ejuice" onClick={handleMobileLinkClick}>
                  <i className="icon-drink"></i>
                  <span>E-liquid</span>
                </Link>
              </li>
              
              {/* 3. Favourite */}
              <li className={pathname?.includes("/favorit") ? "active" : ""}>
                <Link href="/favorit" onClick={handleMobileLinkClick}>
                  <i className="icon-heart-o"></i>
                  <span>
                    Favorit
                    {wishlist?.length > 0 && (
                      <span className="mobile-menu-badge">{wishlist.length}</span>
                    )}
                  </span>
                </Link>
              </li>
              
              {/* 4 & 5. Authentication - Show based on login status */}
              {!session ? (
                <>
                  {/* 4. Masuk (Login) */}
                  <li className={pathname?.includes("/auth/masuk") ? "active" : ""}>
                    <Link href="/auth/masuk" onClick={handleMobileLinkClick}>
                      <i className="icon-user"></i>
                      <span>Masuk</span>
                    </Link>
                  </li>
                  
                  {/* 5. Daftar (Register) */}
                  <li className={pathname?.includes("/auth/daftar") ? "active" : ""}>
                    <Link href="/auth/daftar" onClick={handleMobileLinkClick}>
                      <i className="icon-user-plus"></i>
                      <span>Daftar</span>
                    </Link>
                  </li>
                </>
              ) : (
                /* Show user info and logout when logged in */
                <>
                  <li className="user-info">
                    <div className="user-profile">
                      <i className="icon-user"></i>
                      <span>Hello, {session.user.name || session.user.email}</span>
                    </div>
                  </li>
                  <li>
                    <button 
                      className="mobile-logout-btn"
                      onClick={handleMobileLogout}
                    >
                      <i className="icon-exit"></i>
                      <span>Keluar</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

export default Header;