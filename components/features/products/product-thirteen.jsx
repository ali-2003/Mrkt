// ProductThirteen.js - Fixed version with pod support
'use client'
import { addToCart } from "@/redux/slice/cartSlice";
import urlFor from "@/sanity/lib/image.js";
import { nicotinePercentage } from "@/utils/constants";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

function ProductThirteen({ product }) {
  const dispatch = useDispatch()
  const { data: session } = useSession()

  // FIXED: Early return if product is invalid to prevent rendering errors
  if (!product || !product.slug || !product.name) {
    return null;
  }

  // Check if user is business account (corrected field name)
  const isBusinessUser = session?.user?.accountType === 'business';

  // FIXED: Safe image URL helper with proper fallbacks
  const getImageUrl = (imageRef) => {
    if (!imageRef) return '/placeholder-image.jpg';
    
    try {
      const url = urlFor(imageRef).url();
      return url || '/placeholder-image.jpg';
    } catch (error) {
      console.error('Error processing image URL:', error);
      return '/placeholder-image.jpg';
    }
  };

  // NEW: Function to get images based on product type
  const getProductImages = () => {
    // For pod products, get images from the first available color
    if (product.productType === 'pod' && product.podColors?.length > 0) {
      // Find the first available color with images
      const availableColor = product.podColors.find(color => 
        color.isAvailable !== false && color.pictures?.length > 0
      );
      
      if (availableColor && availableColor.pictures?.length > 0) {
        return {
          primary: availableColor.pictures[0],
          hover: availableColor.pictures.length >= 2 ? availableColor.pictures[1] : null
        };
      }
    }
    
    // For regular products or fallback
    if (product.pictures?.length > 0) {
      return {
        primary: product.pictures[0],
        hover: product.pictures.length >= 2 ? product.pictures[1] : null
      };
    }
    
    // No images found
    return {
      primary: null,
      hover: null
    };
  };

  // NEW: Function to get total stock for pod products
  const getTotalStock = () => {
    if (product.productType === 'pod' && product.podColors?.length > 0) {
      return product.podColors.reduce((total, color) => {
        return total + (color.isAvailable !== false ? (color.stock || 0) : 0);
      }, 0);
    }
    return product.stock || 0;
  };

  // Function to get the appropriate price based on user type
  function getDisplayPrice() {
    if (isBusinessUser && product?.business_price) {
      return product.business_price;
    }
    if (product?.sale_price && !isBusinessUser) {
      return product.sale_price;
    }
    return product?.price || 0;
  }

  // Function to check if we should show sale price styling
  function shouldShowSalePrice() {
    return product?.sale_price && !isBusinessUser && product.sale_price < product.price;
  }

  // Function to format price consistently
  function formatPrice(price) {
    return `Rp ${price.toLocaleString('id-ID')}`;
  }

  function onCartClick(e) {
    e.preventDefault();

    // For pod products, we need to redirect to product page to select color
    if (product.productType === 'pod') {
      window.location.href = `/produk/${product.slug.current}`;
      return;
    }

    // Add business pricing context to cart item
    const cartItem = {
      ...product,
      displayPrice: getDisplayPrice(),
      isBusinessUser: isBusinessUser,
      addedAsBusinessUser: isBusinessUser
    };

    dispatch(addToCart(cartItem));
    toast.success("Item added to cart")
  }

  // Get images for this product
  const productImages = getProductImages();
  const primaryImageSrc = getImageUrl(productImages.primary);
  const hoverImageSrc = productImages.hover ? getImageUrl(productImages.hover) : null;
  
  // Get stock for this product
  const currentStock = getTotalStock();

  return (
    <div className="tooltip">
      <figure className="product-media">
        <Link href={`/produk/${product.slug.current}`}>
          {/* FIXED: Primary image with error handling */}
          <Image
            alt={product.name || "product"}
            src={primaryImageSrc}
            className="product-image"
            fill
            onError={(e) => {
              e.target.src = '/placeholder-image.jpg';
            }}
          />
          
          {/* FIXED: Hover image with proper conditional rendering */}
          {hoverImageSrc && (
            <Image
              alt={`${product.name} hover` || "product hover"}
              src={hoverImageSrc}
              className="product-image-hover"
              fill
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          )}
        </Link>
      </figure>
      
      <div className="product-body">
        <h3 className="product-title">
          <Link href={`/produk/${product.slug.current}`}>{product?.name}</Link>
        </h3>

        {/* Updated Price Display Logic */}
        {currentStock < 1 ? (
          <div className="product-price">
            <span className="out-price">{formatPrice(getDisplayPrice())}</span>
          </div>
        ) : shouldShowSalePrice() ? (
          <div className="product-price">
            <span className="old-price">Rp {product.price.toLocaleString('id-ID')}</span>
            <span className="new-price">{formatPrice(getDisplayPrice())}</span>
          </div>
        ) : (
          <div className="product-price">
            <span className="out-price">
              {formatPrice(getDisplayPrice())}
              {isBusinessUser && product?.business_price && (
                <small className="business-indicator"> (Business)</small>
              )}
            </span>
          </div>
        )}

        {/* NEW: Show color indicator for pod products */}
        {product.productType === 'pod' && product.podColors?.length > 0 && (
          <div className="color-indicator">
            <small>{product.podColors.length} color{product.podColors.length > 1 ? 's' : ''} available</small>
          </div>
        )}

        {/* Updated Cart Button Logic */}
        {currentStock && currentStock !== 0 ? (
          product.productType === 'pod' || (nicotinePercentage?.length > 0) ? (
            <Link
              href={`/produk/${product?.slug.current}`}
              className="btn btn-link btn-link-secondary-dark"
            >
              <span>
                {product.productType === 'pod' ? 'Pilih Warna' : 'Pilih Varian'}
              </span>
            </Link>
          ) : (
            <a
              href="#"
              className="btn btn-link btn-link-secondary-dark"
              onClick={onCartClick}
            >
              <span>Keranjang</span>
            </a>
          )
        ) : (
          ""
        )}
      </div>

      <style jsx>{`
        .business-indicator {
          color: #667eea;
          font-weight: 500;
          font-size: 0.8em;
        }
        .color-indicator {
          margin-top: 4px;
        }
        .color-indicator small {
          color: #666;
          font-size: 0.85em;
        }
      `}</style>
    </div>
  );
}

export default ProductThirteen;