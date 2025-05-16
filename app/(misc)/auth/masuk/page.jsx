

import Link from "next/link";
import LoginForm from "./_components/login-form";

export const metadata = {
  title: "Masuk dan daftar",
  description: "Masuk segera untuk dapatkan penawaran khusus dan terbatas"
}

function RegisterPageComponent() {
  return (
    <div className="main">
      <nav className="breadcrumb-nav border-0 mb-0">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item active">Masuk</li>
          </ol>
        </div>
      </nav>

      <div
        className="login-page bg-image pt-8 pb-8 pt-md-12 pb-md-12 pt-lg-17 pb-lg-17"
        style={{ backgroundImage: `url(/images/backgrounds/login-bg.jpg)` }}
      >
        <div className="container">
          <div className="form-box">
            <div className="form-tab">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPageComponent;
