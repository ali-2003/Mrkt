import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";

import LoginModal from "@/components/features/modals/login-modal";
import HeaderSearch from "@/components/partials/header/partials/header-search";
import CartMenu from "@/components/partials/header/partials/cart-menu";
import MainMenu from "@/components/partials/header/partials/main-menu";
import StickyHeader from "@/components/features/sticky-header";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { updateDiscount } from "@/redux/slice/cartSlice";
import { useRouter } from "next/navigation";

function Header() {
  const { data: session } = useSession();
  const wishlist = useSelector((state) => state.wishlist.items);
  const dispatch = useDispatch()

  function openMobileMenu() {
    document.querySelector("body").classList.add("mmenu-active");
  }

  const handleLogout = () => {
    dispatch(updateDiscount(null))
    signOut()
  } 

  return (
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
  );
}

export default Header;