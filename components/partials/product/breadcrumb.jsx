"use client"

import Link from "next/link";

import urlFor from "@/sanity/lib/image";

function Breadcrumb(props) {
  const { prev, next, current, fullWidth = false } = props;

  return (
    <nav className="breadcrumb-nav border-0 mb-0">
      <div
        className={
          "d-flex align-items-center " +
          (fullWidth ? "container-fluid" : "container")
        }
      >
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/">Beranda</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/produk/default/dark-yellow-lace-cut-out-swing-dress">
              Produk
            </Link>
          </li>
          <li className="breadcrumb-item active">{current}</li>
        </ol>

        {/* <nav className="product-pager ml-auto">
          {prev ? (
            <Link
            href={`/produk/${prev.slug.current}`}
              className={`product-pager-link product-pager-prev ${
                !next ? "prev-only" : ""
              }`}
            >
              <i className="icon-angle-left"></i>
              <span>Prev</span>
              <div className="product-detail">
                <figure>
                  <img
                    src={urlFor(prev.pictures?.[0])?.url()}
                    alt="product"
                    width={376}
                    height={500}
                  />
                </figure>
                <h3 className="product-name mb-0">{prev.name}</h3>
              </div>
            </Link>
          ) : (
            ""
          )}

          {next ? (
            <Link
              href={`/produk/${next.slug.current}`}
              className="product-pager-link product-pager-next"
            >
              <span>Next</span>
              <i className="icon-angle-right"></i>
              <div className="product-detail">
                <figure>
                  <img
                    src={urlFor(next.pictures?.[0])?.url()}
                    alt="product"
                    width={next.sm_pictures?.[0]?.width}
                    height={next.sm_pictures?.[0]?.height}
                  />
                </figure>
                <h3 className="product-name mb-0">{next.name}</h3>
              </div>
            </Link>
          ) : (
            ""
          )}
        </nav> */}
      </div>
    </nav>
  );
}

export default Breadcrumb;
