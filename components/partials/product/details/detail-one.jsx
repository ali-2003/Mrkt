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
  const { product, onColorChange } = props;
  const [qty, setQty] = useState(1);
  const [nicotine, setNicotine] = useState();
  const [currentUrl, setCurrentUrl] = useState("");
  const [shareableContent, setShareableContent] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [productImageUrl, setProductImageUrl] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [availableStock, setAvailableStock] = useState(0);

  const { data: session } = useSession();

  const ref = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.items);

  // Initialize selected color for pod products and sync with parent
  useEffect(() => {
    if (product?.productType === 'pod' && product?.podColors?.length > 0) {
      // If no color is selected, find the first available color
      if (!selectedColor) {
        const firstAvailableColor = product.podColors.find(color => color.isAvailable && color.stock > 0) || product.podColors[0];
        setSelectedColor(firstAvailableColor);
        setAvailableStock(firstAvailableColor?.stock || 0);
        
        // Notify parent of initial color selection
        if (onColorChange && firstAvailableColor) {
          onColorChange(firstAvailableColor);
        }
      }
    } else {
      setSelectedColor(null);
      setAvailableStock(product?.stock || 0);
    }
  }, [product]);

  // Sync with external color changes (from gallery)
  useEffect(() => {
    if (props.selectedColor && props.selectedColor !== selectedColor) {
      setSelectedColor(props.selectedColor);
      setAvailableStock(props.selectedColor?.stock || product?.stock || 0);
    }
  }, [props.selectedColor]);

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

  function handleColorChange(color) {
    setSelectedColor(color);
    setAvailableStock(color?.stock || 0);
    setQty(1); // Reset quantity when color changes
    
    // Notify parent component about color change
    if (onColorChange) {
      onColorChange(color);
    }
  }

  function onWishlistClick(e) {
    e.preventDefault();
    const productToAdd = selectedColor 
      ? { 
          ...product, 
          selectedColor: {
            colorName: selectedColor.colorName,
            colorCode: selectedColor.colorCode,
            stock: selectedColor.stock
          },
          selectedColorId: selectedColor.colorName,
          cartImage: selectedColor.pictures?.[0] || product.pictures?.[0],
          displayName: `${product.name} - ${selectedColor.colorName}`
        }
      : product;
      
    if (!isInWishlist(wishlist, productToAdd)) {
      dispatch(addToWishlist(productToAdd));
    } else {
      router?.push("/favorit");
    }
  }

  function onChangeQty(current) {
    setQty(current);
  }

  function onCartClick() {
    const currentStock = selectedColor ? selectedColor.stock : product?.stock;
    
    if (!currentStock || qty > currentStock) {
      toast.error("Insufficient stock");
      return;
    }

    // Check if color is selected for pod products
    if (product?.productType === 'pod' && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    // Create product with color information for cart
    const productToAdd = {
      ...product,
      // Add selected color information if available
      ...(selectedColor && {
        selectedColor: {
          colorName: selectedColor.colorName,
          colorCode: selectedColor.colorCode,
          stock: selectedColor.stock,
          pictures: selectedColor.pictures // Include the pictures array
        },
        selectedColorId: selectedColor.colorName,
        // Use first image of selected color as cart image
        cartImage: selectedColor.pictures?.[0] || product.pictures?.[0],
        // Update display name to include color
        displayName: `${product.name} - ${selectedColor.colorName}`,
        // Store original product info
        originalProduct: {
          name: product.name,
          price: product.price,
          sale_price: product.sale_price,
          business_price: product.business_price,
          pictures: product.pictures
        }
      })
    };

    console.log("Adding to cart:", {
      productName: productToAdd.name,
      selectedColor: productToAdd.selectedColor,
      cartImage: productToAdd.cartImage,
      displayName: productToAdd.displayName
    });

    for (let i = 0; i < qty; i++) {
      dispatch(addToCart(productToAdd));
    }
    
    const colorText = selectedColor ? ` (${selectedColor.colorName})` : '';
    toast.success(`Product${colorText} added to cart`);
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

      {/* Color Selection for Pod Products */}
      {product?.productType === 'pod' && product?.podColors?.length > 0 && (
        <div className="color-selection-container mb-3">
          <h4 className="color-selection-title">Available Colors:</h4>
          <div className="color-options">
            {product.podColors.map((color, index) => (
              <div 
                key={index}
                className={`color-option ${selectedColor?.colorName === color.colorName ? 'selected' : ''} ${!color.isAvailable || color.stock <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => color.isAvailable && color.stock > 0 && handleColorChange(color)}
                title={`${color.colorName} - Stock: ${color.stock}`}
              >
                <div 
                  className="color-circle"
                  style={{ backgroundColor: color.colorCode }}
                ></div>
                <span className="color-name">{color.colorName}</span>
                {color.stock <= 0 && <span className="stock-status">(Out of Stock)</span>}
              </div>
            ))}
          </div>
          {selectedColor && (
            <div className="selected-color-info">
              <p>Selected: <strong>{selectedColor.colorName}</strong> - Stock: <strong>{selectedColor.stock}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* Pricing */}
      {availableStock < 1 ? (
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
        <Qty changeQty={onChangeQty} max={availableStock} value={qty}></Qty>
      </div>

      <div className="product-details-action">
        <button
          className={`btn-product btn-cart ${
            availableStock < 1 || (product?.productType === 'pod' && !selectedColor) ? "btn-disabled" : ""
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

      <style jsx>{`
        .color-selection-container {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        .color-selection-title {
          margin-bottom: 15px;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .color-options {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        
        .color-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          min-width: 80px;
          text-align: center;
        }
        
        .color-option:hover:not(.out-of-stock) {
          border-color: #0088cc;
          background-color: #f0f8ff;
        }
        
        .color-option.selected {
          border-color: #0088cc;
          background-color: #e6f3ff;
        }
        
        .color-option.out-of-stock {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .color-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #ddd;
          margin-bottom: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .color-name {
          font-size: 12px;
          font-weight: 500;
          color: #333;
          text-transform: capitalize;
        }
        
        .stock-status {
          font-size: 10px;
          color: #e74c3c;
          font-weight: 500;
        }
        
        .selected-color-info {
          margin-top: 15px;
          padding: 10px;
          background-color: #e6f3ff;
          border-radius: 5px;
          font-size: 14px;
        }
        
        .selected-color-info p {
          margin: 0;
          color: #0088cc;
        }
        
        @media (max-width: 768px) {
          .color-options {
            gap: 8px;
          }
          
          .color-option {
            min-width: 70px;
            padding: 6px;
          }
          
          .color-circle {
            width: 35px;
            height: 35px;
          }
          
          .color-name {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}

export default DetailOne;