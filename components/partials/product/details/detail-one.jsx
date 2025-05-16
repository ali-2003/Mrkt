"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import Qty from "@/components/features/qty";

import { isInWishlist } from "@/utils";
import Link from "next/link";
import { addToCart } from "@/redux/slice/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { nicotinePercentage } from "@/utils/constants";
import { addToWishlist } from "@/redux/slice/wishlistSlice";
import { useSession } from "next-auth/react";

function DetailOne(props) {
  const { product } = props;
  const [qty, setQty] = useState(1);
  const [nicotine, setNicotine] = useState();
  const [currentUrl, setCurrentUrl] = useState("");
  const [shareableContent, setShareableContent] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [productImageUrl, setProductImageUrl] = useState("");

  const { data: session } = useSession();

  const ref = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.items);

  // Set current URL, detect mobile, and prepare shareable content
  useEffect(() => {
    // Set current URL for sharing
    setCurrentUrl(window.location.href);
    
    // Set shareable content with product name
    setShareableContent(`${product.name}`);
    
    // Detect if user is on mobile
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    // Get absolute product image URL - important for sharing
    const rawImageUrl = product.image || product.thumbnail || "";
    if (rawImageUrl) {
      // Make sure we have an absolute URL
      if (rawImageUrl.startsWith('http')) {
        setProductImageUrl(rawImageUrl);
      } else {
        // Convert relative URL to absolute
        setProductImageUrl(window.location.origin + (rawImageUrl.startsWith('/') ? '' : '/') + rawImageUrl);
      }
    }
  }, [product.name, product.image, product.thumbnail]);

  function onWishlistClick(e) {
    e.preventDefault();
    if (!isInWishlist(wishlist, product)) {
      dispatch(addToWishlist(product));
    } else {
      router?.push("/favorit");
    }
  }

  function onChangeQty(current) {
    setQty(current);
  }

  function onCartClick() {
    if (!product?.stock || qty > product?.stock) {
      toast.error("Insufficient stock");
      return
    }

    for (let i = 0; i < qty; i++) {
      dispatch(addToCart({
        ...product,
      }));
    }
    toast.success("Product added to cart");
  }

  // Facebook sharing - simplified to just share product name and URL
  function shareFacebook(e) {
    e.preventDefault();
    
    // Simplified sharing text - just product name
    const shareText = `${product.name}`;
    const prodUrl = currentUrl;
    
    if (isMobile) {
      // MOBILE: Try to use Facebook app for story sharing
      try {
        const encodedQuote = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(prodUrl);
        
        // Generate a deep link for Facebook - simpler, no hashtags
        const fbStoryUrl = `fb://story?quote=${encodedQuote}&link=${encodedUrl}`;
        
        // Try to open the Facebook app
        window.location.href = fbStoryUrl;
        
        // Show guidance to the user
        toast.info("Opening Facebook...");
        
        // Fallback if the app doesn't open after a delay
        setTimeout(() => {
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`;
          window.open(fbUrl, '_blank');
        }, 2500);
      } catch (error) {
        console.error("Facebook sharing error:", error);
        // Fallback to browser sharing
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(prodUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(fbUrl, '_blank');
      }
    } else {
      // DESKTOP: Open Facebook's web sharing dialog with pre-filled details - no hashtags
      try {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(prodUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(fbUrl, '_blank', 'width=650,height=500');
      } catch (error) {
        console.error("Facebook sharing error:", error);
        toast.error("Couldn't open Facebook sharing");
      }
    }
  }

  // Instagram sharing - simplified to just copy product name and URL to clipboard
  function shareInstagram(e) {
    e.preventDefault();
    
    // The final URL to share (with UTM parameters for tracking)
    const prodUrl = currentUrl + "?utm_source=instagram&utm_medium=story&utm_campaign=product_share";
    const prodName = product.name;
    
    // Simply copy the product details to clipboard
    try {
      // Create a text with product name and details - no hashtags
      const clipText = `${prodName}\n${prodUrl}`;
      
      // Copy to clipboard using navigator API or execCommand fallback
      if (navigator.clipboard) {
        navigator.clipboard.writeText(clipText)
          .then(() => {
            toast.success("Product details copied to clipboard");
            toast.info("Open Instagram and paste to share");
            
            // Open Instagram app on mobile or website on desktop
            if (isMobile) {
              window.location.href = "instagram://";
            } else {
              window.open('https://instagram.com', '_blank');
            }
          })
          .catch(err => {
            console.error("Clipboard error:", err);
            toast.error("Couldn't copy product details automatically");
            
            // Still try to open Instagram
            if (isMobile) {
              window.location.href = "instagram://";
            } else {
              window.open('https://instagram.com', '_blank');
            }
          });
      } else {
        // Fallback clipboard method
        const textarea = document.createElement('textarea');
        textarea.value = clipText;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (success) {
          toast.success("Product details copied to clipboard");
          toast.info("Open Instagram and paste to share");
        } else {
          toast.error("Couldn't copy product details automatically");
        }
        
        // Open Instagram
        if (isMobile) {
          window.location.href = "instagram://";
        } else {
          window.open('https://instagram.com', '_blank');
        }
      }
    } catch (error) {
      console.error("Instagram sharing error:", error);
      toast.error("Couldn't prepare Instagram sharing");
      
      // Still try to open Instagram as a fallback
      if (isMobile) {
        window.location.href = "instagram://";
      } else {
        window.open('https://instagram.com', '_blank');
      }
    }
  }

  return (
    <div className="product-details" ref={ref}>
      <h1 className="product-title">{product.name}</h1>

      <div className="ratings-container">
        <div className="ratings">
          <div
            className="ratings-val"
            style={{ width: product?.ratings * 20 + "%" }}
          ></div>
          <span className="tooltip-text">{product?.ratings.toFixed(2)}</span>
        </div>
        {product?.reviews?.length && (
          <span className="ratings-text">
            ( {product?.reviews?.length} Reviews )
          </span>
        )}
      </div>

      {product?.stock && product?.stock < 1 ? (
        <div className="product-price">
          <span className="out-price">
            Rp {session && session?.user?.type === 'business' ? product?.business_price?.toFixed(3) : product?.sale_price?.toFixed(3) || product.price.toFixed(3)}
          </span>
        </div>
      ) : product?.sale_price && (!session || session?.user?.type === 'user') ? (
        <div className="product-price">
          <span className="old-price pr-2">Rp {product.price.toFixed(3)}</span>
          <span className="new-price">Rp {product.sale_price.toFixed(3)}</span>
        </div>
      ) : (
        <div className="product-price">
          <span className="out-price">Rp {session && session?.user?.type === 'business' ? product?.business_price?.toFixed(3) : product.price?.toFixed(3)}</span>
        </div>
      )}

      <div className="product-content">
        <p>{product?.short_desc}</p>
      </div>

      <div className="details-filter-row details-row-size">
        <label htmlFor="qty">Qty:</label>
        <Qty changeQty={onChangeQty} max={product?.stock} value={qty}></Qty>
      </div>

      <div className="product-details-action">
        <button
          className={`btn-product btn-cart ${
            product?.stock && product?.stock < 1 ? "btn-disabled" : ""
          }`}
          onClick={onCartClick}
        >
          <span>Keranjang</span>
        </button>
        <div className="details-action-wrapper">
          {isInWishlist(wishlist, product) ? (
            <Link
              href="favorit"
              className="btn-product btn-wishlist added-to-wishlist"
            >
              <span>Go to Wishlist</span>
            </Link>
          ) : (
            <a
              href="#"
              className="btn-product btn-wishlist"
              onClick={onWishlistClick}
            >
              <span>Favorit</span>
            </a>
          )}
        </div>
      </div>

      <div className="product-details-footer">
        <div className="social-icons social-icons-sm">
          <span className="social-label">Share:</span>
          
          {/* Facebook sharing */}
          <a 
            href="#" 
            className="social-icon" 
            title="Facebook"
            onClick={shareFacebook}
          >
            <i className="icon-facebook-f"></i>
          </a>
          
          {/* Instagram sharing - simplified to clipboard copying */}
          <a 
            href="#" 
            className="social-icon" 
            title="Copy for Instagram"
            onClick={shareInstagram}
          >
            <i className="icon-instagram"></i>
          </a>
        </div>
      </div>
    </div>
  );
}

export default DetailOne;