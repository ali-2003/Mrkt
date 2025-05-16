import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import Link from "next/link";

function MobileMenu() {
  const path = usePathname();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    hideMobileMenu();
  }, []);

  function hideMobileMenu() {
    document.querySelector("body").classList.remove("mmenu-active");
  }

  function onSearchChange(e) {
    setSearchTerm(e.target.value);
  }

  function onSubmitSearchForm(e) {
    e.preventDefault();
  }

  return (
    <div className="mobile-menu-container">
      <div className="mobile-menu-wrapper">
        <span className="mobile-menu-close" onClick={hideMobileMenu}>
          <i className="icon-close"></i>
        </span>

        {/* <form
          action="#"
          method="get"
          onSubmit={onSubmitSearchForm}
          className="mobile-search"
        >
          <label htmlFor="mobile-search" className="sr-only">
            Search
          </label>
          <input
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={onSearchChange}
            name="mobile-search"
            id="mobile-search"
            placeholder="Search product ..."
            required
          />
          <button className="btn btn-primary" type="submit">
            <i className="icon-search"></i>
          </button>
        </form> */}

        <nav className="mobile-nav">
          <ul className="mobile-menu">
            <li
              className={`megamenu-container ${path === "/" ? "active" : ""}`}
              id="menu-home"
            >
              <Link href="/" className="sf">
                Home
              </Link>
            </li>
            <li
              onClick={hideMobileMenu}
              className={path?.includes("/ejuice") ? "active" : ""}
            >
              <Link href="/ejuice" className="sf" scroll={false}>
                Ejuices
              </Link>
            </li>
            <li
              onClick={hideMobileMenu}
              className={path?.includes("/informasi-penting") ? "active" : ""}
            >
              <Link href="/informasi-penting" className="sf">
                Benefits
              </Link>
            </li>
            <li
              onClick={hideMobileMenu}
              className={path?.includes("/tentang-kami") ? "active" : ""}
            >
              <Link href="/tentang-kami" className="sf">
                About
              </Link>
            </li>
            <li
              onClick={hideMobileMenu}
              className={path?.includes("/faq") ? "active" : ""}
            >
              <Link href="/faq" className="sf">
                FAQ
              </Link>
            </li>
          </ul>
        </nav>

        <div className="social-icons">
          <Link href="#" className="social-icon" title="Facebook">
            <i className="icon-facebook-f"></i>
          </Link>
          <Link href="#" className="social-icon" title="Twitter">
            <i className="icon-twitter"></i>
          </Link>
          <Link href="#" className="social-icon" title="Instagram">
            <i className="icon-instagram"></i>
          </Link>
          <Link href="#" className="social-icon" title="Youtube">
            <i className="icon-youtube"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;
