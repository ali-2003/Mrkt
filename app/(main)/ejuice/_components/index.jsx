"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import PageHeader from "@/components/features/page-header";
import ShopListOne from "@/components/partials/shop/list/shop-list-one";
import Pagination from "@/components/features/pagination";

// ADDED: Data normalization function to handle missing/invalid fields
function normalizeProduct(product) {
  if (!product || typeof product !== 'object') {
    return null;
  }

  return {
    // Required fields with defaults
    _id: product?._id || `product-${Math.random()}`,
    name: product?.name || "Unnamed Product",
    price: typeof product?.price === 'number' ? product.price : 0,
    
    // Optional fields with safe defaults
    ratings: typeof product?.ratings === 'number' ? Math.max(0, Math.min(5, product.ratings)) : 0,
    _createdAt: product?._createdAt || new Date().toISOString(),
    image: product?.image || "/placeholder-image.jpg",
    description: product?.description || "No description available",
    stock: typeof product?.stock === 'number' ? product.stock : 0,
    
    // Preserve any other custom fields
    ...product,
  };
}

function CategoryPageComponent({ products: data }) {
  const [toggle, setToggle] = useState(false);
  
  const router = useRouter();
  const path = usePathname();
  const searchParams = useSearchParams();
  const sortBy = searchParams.get('sortBy');

  const loading = false;
  const perPage = 6;

  // IMPROVED: Normalize all products and handle invalid data
  const products = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.warn('Invalid products data:', data);
      return [];
    }

    // Normalize all products to ensure required fields exist
    const normalizedProducts = data
      .map(product => normalizeProduct(product))
      .filter(product => product !== null); // Remove any null results

    if (!sortBy || sortBy === "default") {
      return normalizedProducts;
    }

    if (sortBy === "rating") {
      return [...normalizedProducts].sort((a, b) => {
        const ratingA = a?.ratings || 0;
        const ratingB = b?.ratings || 0;
        return ratingB - ratingA;
      });
    }

    if (sortBy === "new") {
      return [...normalizedProducts].sort((a, b) => {
        const dateA = a?._createdAt ? new Date(a._createdAt) : new Date(0);
        const dateB = b?._createdAt ? new Date(b._createdAt) : new Date(0);
        return dateB - dateA;
      });
    }

    return normalizedProducts;
  }, [data, sortBy]);

  const totalCount = products?.length || 0;

  useEffect(() => {
    window.addEventListener("resize", resizeHandle);
    resizeHandle();
    return () => {
      window.removeEventListener("resize", resizeHandle);
    };
  }, []);

  function resizeHandle() {
    if (typeof window !== 'undefined' && document?.querySelector("body")) {
      if (document.querySelector("body").offsetWidth < 992) {
        setToggle(true);
      } else {
        setToggle(false);
      }
    }
  }

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

  // Show error state if data is invalid
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