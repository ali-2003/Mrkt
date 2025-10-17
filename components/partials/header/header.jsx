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

  // Fixed logout function
  const handleLogout = async () => {
    try {
      // Clear cart state
      dispatch(emptyCart());
      // dispatch(removeDiscount()); // Fixed: use removeDiscount instead of updateDiscount
      
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

  return (
    <>
      {/* Mobile Menu Dropdown Styles */}
      <style jsx global>{`
        /* Mobile Menu Dropdown - Similar to existing Links dropdown */
        .mobile-menu-dropdown {
          display: none;
        }

        @media (max-width: 991px) {
          /* Show mobile menu dropdown on mobile */
          .mobile-menu-dropdown {
            display: block !important;
          }
          
          /* Hide desktop navigation on mobile */
          .main-nav {
            display: none !important;
          }
          
          /* Hide existing header-top on mobile */
          .header-top {
            display: none !important;
          }
        }

        /* Style the mobile dropdown to match existing dropdown */
        .mobile-menu-dropdown .top-menu {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .mobile-menu-dropdown .top-menu > li {
          position: relative;
        }

        .mobile-menu-dropdown .top-menu > li > a {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          color: #333;
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mobile-menu-dropdown .top-menu > li > a:hover {
          background: #e9ecef;
          color: #007bff;
        }

        .mobile-menu-dropdown .top-menu > li > a i {
          margin-right: 8px;
          font-size: 18px;
        }

        /* Dropdown menu styling */
        .mobile-menu-dropdown .top-menu ul {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 200px;
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          list-style: none;
          margin: 0;
          padding: 8px 0;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .mobile-menu-dropdown .top-menu > li:hover ul {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .mobile-menu-dropdown .top-menu ul li {
          border-bottom: 1px solid #f0f0f0;
        }

        .mobile-menu-dropdown .top-menu ul li:last-child {
          border-bottom: none;
        }

        .mobile-menu-dropdown .top-menu ul li a,
        .mobile-menu-dropdown .top-menu ul li span {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: #333;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s ease;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }

        .mobile-menu-dropdown .top-menu ul li a:hover,
        .mobile-menu-dropdown .top-menu ul li span:hover {
          background: #f8f9fa;
          color: #007bff;
          padding-left: 25px;
        }

        .mobile-menu-dropdown .top-menu ul li a i,
        .mobile-menu-dropdown .top-menu ul li span i {
          margin-right: 10px;
          font-size: 16px;
          width: 18px;
          text-align: center;
        }

        /* Badge styling for favorites count */
        .mobile-menu-badge {
          background-color: #007bff;
          color: white;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 5px;
          min-width: 16px;
          text-align: center;
          font-weight: bold;
        }

        /* User info styling */
        .mobile-user-info {
          background-color: #f8f9fa !important;
          color: #007bff !important;
          font-weight: 600 !important;
        }

        .mobile-logout-btn {
          color: #dc3545 !important;
        }

        .mobile-logout-btn:hover {
          background-color: #f8d7da !important;
          color: #721c24 !important;
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .mobile-menu-dropdown .top-menu ul {
            min-width: 180px;
            right: -10px;
          }
        }
      `}</style>

      <header className="header header-35 bg-[#FCFCFC]">
        {/* Original header-top for desktop */}
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
                    {/* <li>
                      <Link href="/affiliate-marketing">Affiliate Marketing</Link>
                    </li> */}
                    <li>
                      <Link href="/tentang-kami">Tentang Kami</Link>
                    </li>
                    <li>
                      <Link href="/kontak-kami">Kontak Kami</Link>
                    </li>
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
                  <Link href="/" className="logo">
                    <Image
                      src="/images/home/header-logo-t-2.png"
                      className="w-[80px]"
                      alt="Molla Logo"
                      width={100}
                      height={100}
                    />
                  </Link>

                  <MainMenu />
                </div>

                <div className="header-right">
                  <CartMenu />
                  
                  {/* Mobile Menu Dropdown - Shows only on mobile */}
                  <div className="mobile-menu-dropdown">
                    <ul className="top-menu">
                      <li>
                        <a href="#" style={{ textDecoration: 'none' }}>
                          <i className="icon-bars"></i>
                        </a>
                        <ul>
                          {/* 1. Devices */}
                          <li>
                            <Link href="/devices">
                              {/* <i className="icon-laptop"></i> */}
                              <span>Devices</span>
                            </Link>
                          </li>
                          
                          {/* 2. E-liquid */}
                          <li>
                            <Link href="/ejuice">
                              {/* <i className="icon-drink"></i> */}
                              <span>E-liquid</span>
                            </Link>
                          </li>
                          
                          {/* 3. Favorit */}
                          <li>
                            <Link href="/favorit">
                              {/* <i className="icon-heart-o"></i> */}
                              <span>
                                Favorit
                                {wishlist?.length > 0 && (
                                  <span className="mobile-menu-badge">{wishlist.length}</span>
                                )}
                              </span>
                            </Link>
                          </li>
                          
                          {/* 4 & 5. Authentication based on login status */}
                          {!session ? (
                            <>
                              {/* 4. Masuk (Login) */}
                              <li>
                                <Link href="/auth/masuk">
                                  <i className="icon-user"></i>
                                  <span>Masuk</span>
                                </Link>
                              </li>
                              
                              {/* 5. Daftar (Register) */}
                              <li>
                                <Link href="/auth/daftar">
                                  <i className="icon-user"></i>
                                  <span>Daftar</span>
                                </Link>
                              </li>
                            </>
                          ) : (
                            /* Show user info and logout when logged in */
                            <>
                              <li>
                                <span className="mobile-user-info">
                                  <i className="icon-user"></i>
                                  <span>Hello</span>
                                </span>
                              </li>
                              <li>
                                <span 
                                  className="mobile-logout-btn"
                                  onClick={handleLogout}
                                >
                                  <i className="icon-exit"></i>
                                  <span>Keluar</span>
                                </span>
                              </li>
                            </>
                          )}
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StickyHeader>
      </header>
    </>
  );
}

export default Header;