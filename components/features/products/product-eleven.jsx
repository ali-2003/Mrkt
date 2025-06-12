"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/slice/cartSlice";
import { toast } from "react-toastify";

// Import the price utility functions
import { getPriceDisplayInfo, isBusinessUser } from "@/utils/priceUtils";

function ProductEleven({ product }) {
  const { data: session } = useSession();
  const dispatch = useDispatch();
  
  // Get price display information
  const priceInfo = getPriceDisplayInfo(product, session);
  const isBusiness = isBusinessUser(session);

  // Handle quick add to cart
  function handleQuickAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product?.stock || product.stock < 1) {
      toast.error("Product out of stock");
      return;
    }

    // For pod products, we can't quick add without color selection
    if (product?.productType === 'pod') {
      toast.info("Please visit product page to select color");
      return;
    }

    // Add product with appropriate price
    const productToAdd = {
      ...product,
      displayPrice: priceInfo.displayPrice,
      isBusinessUser: isBusiness
    };

    dispatch(addToCart(productToAdd));
    toast.success("Product added to cart");
  }

  // Get the main product image
  function getProductImage() {
    if (product?.productType === 'pod' && product?.podColors?.length > 0) {
      // For pods, use the first available color's first image
      const firstColor = product.podColors.find(color => color.isAvailable) || product.podColors[0];
      return firstColor?.pictures?.[0] || product?.pictures?.[0];
    }
    return product?.pictures?.[0];
  }

  // Check if product is in stock
  function isInStock() {
    if (product?.productType === 'pod') {
      return product?.podColors?.some(color => color.isAvailable && color.stock > 0);
    }
    return product?.stock > 0;
  }

  const productImage = getProductImage();
  const inStock = isInStock();

  return (
    <div className="product product-11 text-center">
      <figure className="product-media">
        <Link href={`/products/${product.slug?.current || product.id}`}>
          <img
            src={productImage?.asset?.url || '/images/placeholder.jpg'}
            alt={product.name}
            className="product-image"
          />
        </Link>

        {/* Product badges */}
        <div className="product-badges">
          {product?.hot && <span className="product-badge badge-hot">Hot</span>}
          {product?.featured && <span className="product-badge badge-featured">Featured</span>}
          {!inStock && <span className="product-badge badge-out-of-stock">Out of Stock</span>}
          {isBusiness && product?.business_price && (
            <span className="product-badge badge-business">Business Price</span>
          )}
        </div>

        {/* Quick actions */}
        <div className="product-action">
          {inStock && product?.productType !== 'pod' ? (
            <button 
              className="btn-product btn-cart" 
              onClick={handleQuickAddToCart}
              title="Add to cart"
            >
              <span>Quick Add</span>
            </button>
          ) : (
            <Link 
              href={`/products/${product.slug?.current || product.id}`}
              className="btn-product btn-cart"
            >
              <span>View Product</span>
            </Link>
          )}
        </div>
      </figure>

      <div className="product-body">
        <div className="product-cat">
          <span className="product-category">{product?.productType || 'Product'}</span>
        </div>

        <h3 className="product-title">
          <Link href={`/products/${product.slug?.current || product.id}`}>
            {product.name}
          </Link>
        </h3>

        {/* Ratings */}
        {product?.ratings && (
          <div className="ratings-container">
            <div className="ratings">
              <div
                className="ratings-val"
                style={{ width: `${product.ratings * 20}%` }}
              ></div>
            </div>
            <span className="ratings-text">({product.ratings.toFixed(1)})</span>
          </div>
        )}

        {/* Price Display */}
        <div className="product-price">
          {!inStock ? (
            <span className="out-price">{priceInfo.formattedDisplayPrice}</span>
          ) : priceInfo.showSalePrice ? (
            <>
              <span className="old-price">{priceInfo.formattedOriginalPrice}</span>
              <span className="new-price">{priceInfo.formattedDisplayPrice}</span>
            </>
          ) : (
            <span className="price">
              {priceInfo.formattedDisplayPrice}
              {priceInfo.isUsingBusinessPrice && (
                <small className="business-indicator"> (Business)</small>
              )}
            </span>
          )}
        </div>

        {/* Stock indicator for pods */}
        {product?.productType === 'pod' && (
          <div className="color-stock-info">
            <small className="text-muted">
              {product.podColors?.filter(c => c.isAvailable && c.stock > 0).length || 0} colors available
            </small>
          </div>
        )}
      </div>

      <style jsx>{`
        .product {
          position: relative;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .product:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .product-media {
          position: relative;
          margin: 0;
          overflow: hidden;
        }

        .product-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product:hover .product-image {
          transform: scale(1.05);
        }

        .product-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .product-badge {
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          border-radius: 12px;
          color: white;
        }

        .badge-hot {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        }

        .badge-featured {
          background: linear-gradient(135deg, #feca57, #ff9ff3);
        }

        .badge-out-of-stock {
          background: linear-gradient(135deg, #666, #333);
        }

        .badge-business {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .product-action {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .product:hover .product-action {
          opacity: 1;
        }

        .btn-product {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-product:hover {
          background: linear-gradient(135deg, #5a67d8, #6b46c1);
          transform: translateY(-2px);
        }

        .product-body {
          padding: 15px;
        }

        .product-category {
          color: #667eea;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .product-title {
          margin: 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .product-title a {
          color: #333;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .product-title a:hover {
          color: #667eea;
        }

        .ratings-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 8px 0;
        }

        .ratings {
          position: relative;
          width: 60px;
          height: 12px;
          background: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }

        .ratings-val {
          height: 100%;
          background: linear-gradient(135deg, #feca57, #ff9ff3);
          border-radius: 6px;
          transition: width 0.3s ease;
        }

        .ratings-text {
          font-size: 11px;
          color: #666;
        }

        .product-price {
          margin: 10px 0;
          font-weight: 600;
        }

        .old-price {
          color: #999;
          text-decoration: line-through;
          margin-right: 8px;
          font-size: 12px;
        }

        .new-price {
          color: #e74c3c;
          font-size: 14px;
        }

        .price {
          color: #333;
          font-size: 14px;
        }

        .out-price {
          color: #999;
          font-size: 14px;
        }

        .business-indicator {
          color: #667eea;
          font-weight: 500;
          font-size: 10px;
        }

        .color-stock-info {
          margin-top: 8px;
        }

        .text-muted {
          color: #999 !important;
        }

        @media (max-width: 768px) {
          .product-image {
            height: 150px;
          }
          
          .product-body {
            padding: 10px;
          }
          
          .product-title {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}

export default ProductEleven;