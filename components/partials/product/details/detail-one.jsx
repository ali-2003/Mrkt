"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  // Check if user is business account
  const isBusinessUser = session?.user?.accountType === 'business';
  
  // BUSINESS QUANTITY LOGIC - Set minimum and initial quantity based on user type
  const getMinQuantity = () => isBusinessUser ? 10 : 1;
  const getInitialQuantity = () => isBusinessUser ? 10 : 1;
  
  // Initialize quantity with appropriate minimum
  const [qty, setQty] = useState(getInitialQuantity());

  // Update quantity when user type changes (login/logout)
  useEffect(() => {
    const initialQty = getInitialQuantity();
    setQty(initialQty);
  }, [isBusinessUser]);

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

  // Function to get the original price (for showing strikethrough)
  function getOriginalPrice() {
    return product?.price || 0;
  }

  // Function to check if we should show sale price styling
  function shouldShowSalePrice() {
    return product?.sale_price && !isBusinessUser && product.sale_price < product.price;
  }

  // BUSINESS QUANTITY - Check if there's enough stock for business minimum
  function hasEnoughStockForBusinessOrder() {
    const currentStock = selectedColor ? selectedColor.stock : product?.stock || 0;
    const minQty = getMinQuantity();
    return currentStock >= minQty;
  }

  function handleColorChange(color) {
    setSelectedColor(color);
    setAvailableStock(color?.stock || 0);
    
    // BUSINESS QUANTITY - Reset to minimum quantity when color changes
    setQty(getInitialQuantity());
    
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

  // BUILT-IN QUANTITY CONTROLS - No external Qty component needed
  function incrementQty() {
    const maxQty = availableStock;
    if (qty < maxQty) {
      setQty(qty + 1);
    } else {
      toast.warning(`Maximum available quantity is ${maxQty} units`);
    }
  }

  function decrementQty() {
    const minQty = getMinQuantity();
    if (qty > minQty) {
      setQty(qty - 1);
    } else {
      toast.warning(`Minimum quantity is ${minQty} units`);
    }
  }

  function handleQtyInputChange(e) {
    const newValue = parseInt(e.target.value) || getMinQuantity();
    const minQty = getMinQuantity();
    const maxQty = availableStock;

    if (newValue < minQty) {
      setQty(minQty);
      toast.warning(`Minimum quantity is ${minQty} units`);
    } else if (newValue > maxQty) {
      setQty(maxQty);
      toast.warning(`Maximum available quantity is ${maxQty} units`);
    } else {
      setQty(newValue);
    }
  }

  function onCartClick() {
    const currentStock = selectedColor ? selectedColor.stock : product?.stock;
    const minQty = getMinQuantity();
    
    // BUSINESS QUANTITY - Enhanced stock validation
    if (!currentStock || currentStock < 1) {
      toast.error("Product is out of stock");
      return;
    }

    // Check minimum quantity requirement for business users
    if (isBusinessUser && qty < minQty) {
      toast.error(`Business orders require minimum ${minQty} units`);
      return;
    }

    // Check if requested quantity exceeds stock
    if (qty > currentStock) {
      toast.error(`Only ${currentStock} units available in stock`);
      return;
    }

    // Check if business user has enough stock for minimum order
    if (isBusinessUser && !hasEnoughStockForBusinessOrder()) {
      toast.error(`Insufficient stock for business order (minimum ${minQty} units required)`);
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
      // Add price based on user type
      displayPrice: getDisplayPrice(),
      isBusinessUser: isBusinessUser,
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
      displayName: productToAdd.displayName,
      displayPrice: productToAdd.displayPrice,
      isBusinessUser: productToAdd.isBusinessUser,
      quantity: qty,
      minQuantity: minQty
    });

    for (let i = 0; i < qty; i++) {
      dispatch(addToCart(productToAdd));
    }
    
    const colorText = selectedColor ? ` (${selectedColor.colorName})` : '';
    const userTypeText = isBusinessUser ? ' (Business Order)' : '';
    toast.success(`${qty} unit(s)${colorText} added to cart${userTypeText}`);
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

      {/* Business User Indicator */}
      {isBusinessUser && (
        <div className="business-user-indicator">
          <span className="business-badge">Business Pricing Applied</span>
          <div className="business-info">
            <small>Minimum order quantity: {getMinQuantity()} units</small>
          </div>
        </div>
      )}

      {/* Color Selection for Pod Products */}
      {product?.productType === 'pod' && product?.podColors?.length > 0 && (
        <div className="color-selection-container mb-3">
          <h4 className="color-selection-title">Available Colors:</h4>
          <div className="color-options">
            {product.podColors.map((color, index) => (
              <div 
                key={index}
                className={`color-option ${selectedColor?.colorName === color.colorName ? 'selected' : ''} ${
                  !color.isAvailable || color.stock <= 0 ? 'out-of-stock' : ''
                } ${
                  isBusinessUser && color.stock < getMinQuantity() ? 'insufficient-business-stock' : ''
                }`}
                onClick={() => color.isAvailable && color.stock > 0 && handleColorChange(color)}
                title={`${color.colorName} - Stock: ${color.stock}${
                  isBusinessUser && color.stock < getMinQuantity() ? ` (Insufficient for business order - min ${getMinQuantity()})` : ''
                }`}
              >
                <div 
                  className="color-circle"
                  style={{ backgroundColor: color.colorCode }}
                ></div>
                <span className="color-name">{color.colorName}</span>
                {color.stock <= 0 && <span className="stock-status">(Out of Stock)</span>}
                {isBusinessUser && color.stock > 0 && color.stock < getMinQuantity() && (
                  <span className="stock-status">(Insufficient Stock)</span>
                )}
              </div>
            ))}
          </div>
          {selectedColor && (
            <div className="selected-color-info">
              <p>
                Selected: <strong>{selectedColor.colorName}</strong> - Stock: <strong>{selectedColor.stock}</strong>
                {isBusinessUser && selectedColor.stock < getMinQuantity() && (
                  <span className="insufficient-warning"> ⚠️ Insufficient for business order</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Updated Pricing Logic */}
      {availableStock < 1 ? (
        <div className="product-price">
          <span className="out-price">
            Rp {getDisplayPrice().toLocaleString('id-ID')}
          </span>
        </div>
      ) : shouldShowSalePrice() ? (
        <div className="product-price">
          <span className="old-price pr-2">Rp {getOriginalPrice().toLocaleString('id-ID')}</span>
          <span className="new-price">Rp {getDisplayPrice().toLocaleString('id-ID')}</span>
        </div>
      ) : (
        <div className="product-price">
          <span className="out-price">
            Rp {getDisplayPrice().toLocaleString('id-ID')}
            {isBusinessUser && product?.business_price && (
              <small className="business-price-note"> (Business Price)</small>
            )}
          </span>
        </div>
      )}

      <div className="product-content">
        <p>{product?.short_desc}</p>
      </div>

      {/* BUSINESS QUANTITY - Show stock warning for business users */}
      {isBusinessUser && !hasEnoughStockForBusinessOrder() && (
        <div className="business-stock-warning">
          <small className="warning-text">
            ⚠️ Insufficient stock for business minimum order ({getMinQuantity()} units required)
          </small>
        </div>
      )}

      {/* BUILT-IN QUANTITY CONTROLS */}
      <div className="details-filter-row details-row-size">
        <label htmlFor="qty">
          Qty{isBusinessUser && ` (Min: ${getMinQuantity()})`}:
        </label>
        <div className="product-details-quantity">
          <input
            className="vertical-quantity"
            type="number"
            value={qty}
            onChange={handleQtyInputChange}
            min={getMinQuantity()}
            max={availableStock}
          />
          <button 
            className="btn btn-increment btn-spinner" 
            type="button"
            onClick={incrementQty}
            disabled={qty >= availableStock}
          >
            <i className="icon-plus"></i>
          </button>
          <button 
            className="btn btn-decrement btn-spinner" 
            type="button"
            onClick={decrementQty}
            disabled={qty <= getMinQuantity()}
          >
            <i className="icon-minus"></i>
          </button>
          
          {/* Show min/max info for business users */}
          {getMinQuantity() > 1 && (
            <div className="qty-info">
              <small>Min: {getMinQuantity()} | Max: {availableStock}</small>
            </div>
          )}
        </div>
      </div>

      <div className="product-details-action">
        <button
          className={`btn-product btn-cart ${
            availableStock < 1 || 
            (product?.productType === 'pod' && !selectedColor) ||
            (isBusinessUser && !hasEnoughStockForBusinessOrder()) ? "btn-disabled" : ""
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
        .business-user-indicator {
          margin: 15px 0;
        }
        
        .business-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 5px 12px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .business-info {
          margin-top: 5px;
        }
        
        .business-info small {
          color: #667eea;
          font-weight: 500;
        }
        
        .business-price-note {
          color: #667eea;
          font-weight: 500;
          margin-left: 5px;
        }
        
        .business-stock-warning {
          margin: 10px 0;
          padding: 8px 12px;
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
        }
        
        .warning-text {
          color: #856404;
          font-weight: 500;
        }
        
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
        
        .color-option:hover:not(.out-of-stock):not(.insufficient-business-stock) {
          border-color: #0088cc;
          background-color: #f0f8ff;
        }
        
        .color-option.selected {
          border-color: #0088cc;
          background-color: #e6f3ff;
        }
        
        .color-option.out-of-stock,
        .color-option.insufficient-business-stock {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .color-option.insufficient-business-stock {
          border-color: #ffa500;
          background-color: #fff8e1;
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
        
        .insufficient-warning {
          color: #e74c3c;
          font-weight: 600;
        }
        
        /* BUILT-IN QUANTITY CONTROLS STYLING */
        .product-details-quantity {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
        }
        
        .vertical-quantity {
          width: 60px;
          height: 40px;
          text-align: center;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .btn-spinner {
          width: 35px;
          height: 35px;
          border: 1px solid #ddd;
          background: #f8f9fa;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-spinner:hover:not(:disabled) {
          background: #e9ecef;
          border-color: #adb5bd;
        }
        
        .btn-spinner:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8f9fa;
        }
        
        .btn-spinner i {
          font-size: 12px;
          color: #495057;
        }
        
        .qty-info {
          margin-top: 5px;
          color: #666;
          font-size: 11px;
        }
        
        /* Remove number input arrows */
        .vertical-quantity::-webkit-outer-spin-button,
        .vertical-quantity::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .vertical-quantity[type=number] {
          -moz-appearance: textfield;
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
          
          .vertical-quantity {
            width: 50px;
            height: 35px;
          }
          
          .btn-spinner {
            width: 30px;
            height: 30px;
          }
        }
      `}</style>
    </div>
  );
}

export default DetailOne;