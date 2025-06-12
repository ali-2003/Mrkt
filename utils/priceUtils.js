// utils/priceUtils.js

/**
 * Get the appropriate price for a user based on their account type
 * @param {Object} product - Product object with price fields
 * @param {Object} session - User session object
 * @returns {number} - The appropriate price to display
 */
export function getDisplayPrice(product, session) {
    const isBusinessUser = session?.user?.accountType === 'business';
    
    // Business users get business price if available
    if (isBusinessUser && product?.business_price) {
      return product.business_price;
    }
    
    // Regular users get sale price if available and they're not business users
    if (product?.sale_price && !isBusinessUser) {
      return product.sale_price;
    }
    
    // Fall back to regular price
    return product?.price || 0;
  }
  
  /**
   * Get the original price (for showing strikethrough)
   * @param {Object} product - Product object with price fields
   * @returns {number} - The original price
   */
  export function getOriginalPrice(product) {
    return product?.price || 0;
  }
  
  /**
   * Check if we should show sale price styling (strikethrough original price)
   * @param {Object} product - Product object with price fields
   * @param {Object} session - User session object
   * @returns {boolean} - Whether to show sale price styling
   */
  export function shouldShowSalePrice(product, session) {
    const isBusinessUser = session?.user?.accountType === 'business';
    return product?.sale_price && !isBusinessUser && product.sale_price < product.price;
  }
  
  /**
   * Check if user is a business account
   * @param {Object} session - User session object
   * @returns {boolean} - Whether user is a business account
   */
  export function isBusinessUser(session) {
    return session?.user?.accountType === 'business';
  }
  
  /**
   * Format price for display
   * @param {number} price - Price to format
   * @param {string} currency - Currency symbol (default: 'Rp')
   * @returns {string} - Formatted price string
   */
  export function formatPrice(price, currency = 'Rp') {
    if (!price) return `${currency} 0`;
    return `${currency} ${price.toLocaleString('id-ID')}`;
  }
  
  /**
   * Get price display info for a product
   * @param {Object} product - Product object
   * @param {Object} session - User session object
   * @returns {Object} - Object with display price info
   */
  export function getPriceDisplayInfo(product, session) {
    const displayPrice = getDisplayPrice(product, session);
    const originalPrice = getOriginalPrice(product);
    const showSalePrice = shouldShowSalePrice(product, session);
    const isBusiness = isBusinessUser(session);
    
    return {
      displayPrice,
      originalPrice,
      showSalePrice,
      isBusiness,
      formattedDisplayPrice: formatPrice(displayPrice),
      formattedOriginalPrice: formatPrice(originalPrice),
      isUsingBusinessPrice: isBusiness && product?.business_price && displayPrice === product.business_price
    };
  }