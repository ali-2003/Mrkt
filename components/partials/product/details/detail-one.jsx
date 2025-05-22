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

  // Enhanced Facebook sharing for better desktop pre-filling and mobile app opening
  function shareFacebook(e) {
    e.preventDefault();
    
    // Get product data
    const prodName = product.name;
    const prodUrl = currentUrl;
    
    // Different approaches for mobile vs desktop
    if (isMobile) {
      // MOBILE: Try to open the Facebook app directly
      try {
        // First try the Facebook app intent
        const fbAppUrl = `fb://share?link=${encodeURIComponent(prodUrl)}&text=${encodeURIComponent(prodName)}`;
        
        // Create an invisible iframe to try opening the app without changing page
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.src = fbAppUrl;
        
        // Show toast
        toast.info("Opening Facebook app...");
        
        // Set a timer to check if app opened (if the page is still here after delay)
        setTimeout(() => {
          // Try a different approach - direct location change
          window.location.href = fbAppUrl;
          
          // Fallback to browser if app doesn't open after another delay
          setTimeout(() => {
            // If we're still here, try the browser version with intent protocol
            const intentUrl = `intent://share?text=${encodeURIComponent(prodName)}&url=${encodeURIComponent(prodUrl)}#Intent;package=com.facebook.katana;scheme=fb;end`;
            window.location.href = intentUrl;
            
            // Final fallback to basic browser sharing
            setTimeout(() => {
              const fbUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(prodUrl)}&quote=${encodeURIComponent(prodName)}`;
              window.open(fbUrl, '_blank');
              toast.info("Opened Facebook in browser instead. The app may not be installed.");
            }, 1000);
          }, 1000);
        }, 1000);
      } catch (error) {
        console.error("Facebook app sharing error:", error);
        
        // Fallback to browser sharing
        const fbUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(prodUrl)}&quote=${encodeURIComponent(prodName)}`;
        window.open(fbUrl, '_blank');
        toast.info("Opened Facebook in browser instead.");
      }
    } else {
      // DESKTOP: Try improved sharing with hashtag and quote parameters
      try {
        // The most reliable approach for pre-filling text without an app ID
        // Uses both quote and hashtag parameters which can help with pre-filling
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(prodUrl)}&quote=${encodeURIComponent(prodName)}&hashtag=${encodeURIComponent('#' + prodName.replace(/\s+/g, ''))}`;
        
        // Open Facebook share dialog in a popup window
        const width = 626;
        const height = 436;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        
        window.open(
          fbUrl, 
          'facebook-share-dialog', 
          `width=${width},height=${height},top=${top},left=${left},toolbar=0,location=0,menubar=0,scrollbars=0`
        );
        
        // Also copy to clipboard as backup
        try {
          const shareText = `${prodName} ${prodUrl}`;
          navigator.clipboard.writeText(shareText);
          toast.success("Product details also copied to clipboard (if needed)");
        } catch (clipError) {
          console.error("Clipboard error:", clipError);
        }
      } catch (error) {
        console.error("Facebook sharing error:", error);
        toast.error("Couldn't open Facebook sharing");
        
        // Fallback to copying if failed
        try {
          const shareText = `${prodName} ${prodUrl}`;
          navigator.clipboard.writeText(shareText);
          toast.info("Link copied to clipboard instead. You can paste it on Facebook.");
        } catch (clipError) {
          console.error("Clipboard error:", clipError);
        }
      }
    }
  }

  // WhatsApp sharing
  function shareWhatsApp(e) {
    e.preventDefault();
    
    // Prepare the text and URL for WhatsApp
    const shareText = `${product.name}`;
    const prodUrl = currentUrl;
    const whatsappText = `${shareText} ${prodUrl}`;
    
    try {
      // WhatsApp web API URL
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      
      // Open WhatsApp in new tab/app
      window.open(whatsappUrl, '_blank');
      
      toast.info("Opening WhatsApp...");
    } catch (error) {
      console.error("WhatsApp sharing error:", error);
      toast.error("Couldn't open WhatsApp sharing");
    }
  }

  // Copy link function
  function copyLink(e) {
    e.preventDefault();
    
    // The URL to copy
    const prodUrl = currentUrl;
    
    try {
      // Copy to clipboard using navigator API or execCommand fallback
      if (navigator.clipboard) {
        navigator.clipboard.writeText(prodUrl)
          .then(() => {
            toast.success("Product link copied to clipboard");
          })
          .catch(err => {
            console.error("Clipboard error:", err);
            toast.error("Couldn't copy link automatically");
          });
      } else {
        // Fallback clipboard method
        const textarea = document.createElement('textarea');
        textarea.value = prodUrl;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (success) {
          toast.success("Product link copied to clipboard");
        } else {
          toast.error("Couldn't copy link automatically");
        }
      }
    } catch (error) {
      console.error("Copy link error:", error);
      toast.error("Couldn't copy link");
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
            title="Share on Facebook"
            onClick={shareFacebook}
          >
            <i className="icon-facebook-f"></i>
          </a>
          
          {/* WhatsApp sharing */}
          <a 
            href="#" 
            className="social-icon" 
            title="Share on WhatsApp"
            onClick={shareWhatsApp}
          >
            <i className="icon-whatsapp"></i>
          </a>
          
          {/* Copy link option */}
          <a 
            href="#" 
            className="social-icon" 
            title="Copy link"
            onClick={copyLink}
          >
            <i className="icon-copy"></i>
          </a>
        </div>
      </div>
    </div>
  );
}

export default DetailOne;