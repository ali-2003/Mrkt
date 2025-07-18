import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

function MainMenu() {
  let path = usePathname();
  const { data: session } = useSession();

  function showAllDemos(e) {
    let demoItems = document.querySelectorAll(".demo-item.hidden");
    for (let i = 0; i < demoItems?.length; i++) {
      demoItems[i].classList.toggle("show");
    }
    document
      .querySelector(".view-all-demos")
      .classList.toggle("disabled-hidden");
    e.preventDefault();
  }

  return (
    <nav className="main-nav">
      <ul className="menu sf-arrows">
        <li
          className={`megamenu-container ${path === "/" ? "active" : ""}`}
          id="menu-home"
        >
          <Link href="/" className="sf">
            Beranda
          </Link>
        </li>
        <li className={path?.includes("/ejuice") ? "active" : ""}>
          <Link href="/ejuice" className="sf" scroll={false}>
            E-liquid
          </Link>
        </li>
        <li className={path?.includes("/devices") ? "active" : ""}>
          <Link href="/devices" className="sf" scroll={false}>
            Devices
          </Link>
        </li>
        <li className={path?.includes("/informasi-penting") ? "active" : ""}>
          <Link href="/informasi-penting" className="sf">
            Informasi Penting
          </Link>
        </li>
        
        {/* Show "Daftar" only when user is NOT logged in */}
        {!session && (
          <li className={path?.includes("/daftar") ? "active" : ""}>
            <Link href="/auth/daftar" className="sf">
              Daftar
            </Link>
          </li>
        )}
        
        <li className={path?.includes("/tentang-kami") ? "active" : ""}>
          <Link href="/tentang-kami" className="sf">
            Tentang Kami
          </Link>
        </li>
        <li className={path?.includes("/faq") ? "active" : ""}>
          <Link href="/faq" className="sf">
            FAQ
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default MainMenu;