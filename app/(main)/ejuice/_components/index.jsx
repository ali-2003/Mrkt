"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import PageHeader from "@/components/features/page-header";
import ShopListOne from "@/components/partials/shop/list/shop-list-one";
import Pagination from "@/components/features/pagination";

function CategoryPageComponent({ products: data }) {
  const [toggle, setToggle] = useState(false);
  
  const router = useRouter();
  const path = usePathname();
  const searchParams = useSearchParams();
  const sortBy = searchParams.get('sortBy');

  const loading = false;
  const perPage = 6;

  // FIXED: Use useMemo for sorted products to avoid mutations
  const products = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.warn('Invalid products data:', data);
      return [];
    }

    // Create a copy of the array to avoid mutation
    const productsCopy = [...data];

    if (!sortBy || sortBy === "default") {
      return productsCopy;
    }

    if (sortBy === "rating") {
      return productsCopy.sort((a, b) => {
        const ratingA = a?.ratings || 0;
        const ratingB = b?.ratings || 0;
        return ratingB - ratingA;
      });
    }

    if (sortBy === "new") {
      return productsCopy.sort((a, b) => {
        const dateA = a?._createdAt ? new Date(a._createdAt) : new Date(0);
        const dateB = b?._createdAt ? new Date(b._createdAt) : new Date(0);
        return dateB - dateA;
      });
    }

    return productsCopy;
  }, [data, sortBy]);

  const totalCount = products?.length || 0;

  useEffect(() => {
    window.addEventListener("resize", resizeHandle);
    resizeHandle();
    return () => {
      window.removeEventListener("resize", resizeHandle);
    };
  }, []);

  // FIXED: Improved resize handler
  function resizeHandle() {
    if (typeof window !== 'undefined' && document?.querySelector("body")) {
      if (document.querySelector("body").offsetWidth < 992) {
        setToggle(true);
      } else {
        setToggle(false);
      }
    }
  }

  // FIXED: Improved sort handler with error handling
  function onSortByChange(e) {
    try {
      const query = e.target.value;
      const url = path;

      if (query === "default") {
        router.push(url);
        return;
      }

      router.push(`${url}?sortBy=${query}`);
    } catch (error) {
      console.error('Error changing sort:', error);
    }
  }

  // FIXED: Add error boundary for invalid data
  if (!data) {
    return (
      <main className="main shop">
        <PageHeader title="Shop" subTitle="Ejuice" />
        <div className="container">
          <div className="alert alert-warning">
            No products available at the moment.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main shop">
      <PageHeader title="Shop" subTitle="Ejuice" />
      <nav className="breadcrumb-nav mb-2">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/">Beranda</Link>
            </li>
            <li className="breadcrumb-item active">Ejuice</li>
          </ol>
        </div>
      </nav>

      <div className="page-content">
        <div className="container">
          <div className="row skeleton-body">
            <div
              className={`w-full skel-shop-products ${
                !loading ? "loaded" : ""
              }`}
            >
              <div className="toolbox">
                <div className="toolbox-left">
                  {!loading && products ? (
                    <div className="toolbox-info">
                      Showing
                      <span>
                        {" "}
                        {products.length} of {totalCount}
                      </span>{" "}
                      Products
                    </div>
                  ) : (
                    ""
                  )}
                </div>

                <div className="toolbox-right">
                  <div className="toolbox-sort">
                    <label htmlFor="sortby">Sort by:</label>
                    <div className="select-custom">
                      <select
                        name="sortby"
                        id="sortby"
                        className="form-control"
                        onChange={onSortByChange}
                        value={sortBy || "default"}
                      >
                        <option value="default">Default</option>
                        <option value="rating">Most Rated</option>
                        <option value="new">Date</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <ShopListOne
                products={products}
                perPage={perPage}
                loading={loading}
              />

              {/* {totalCount > perPage ? (
                <Pagination perPage={perPage} total={totalCount}></Pagination>
              ) : (
                ""
              )} */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CategoryPageComponent;