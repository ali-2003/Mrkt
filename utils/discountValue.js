// discount-utils.js

// Discount Percentages
export const FIRST_ORDER_DISCOUNT = 20; // First order is 20% off
export const REFER_FRIEND_DISCOUNT = 40; // Referral code gives 40% off
export const REFERRED_FIRST_ORDER_DISCOUNT = 40; // First order for referred customer is 40% off

// Product Bundle Discounts
export const THREE_BOTTLES_DISCOUNT = 20; // Buy 3 bottles, get 20% off
export const FIVE_BOTTLES_DISCOUNT = 30; // Buy 5 bottles, get 30% off
export const POD_ONE_BOTTLE_DISCOUNT = 30; // Buy pod + 1 bottle, get 30% off the bottle
export const POD_THREE_BOTTLES_DISCOUNT = 50; // Buy pod + 3 bottles, get 50% off the bottles

// Loyalty Discount
export const LOYALTY_DISCOUNT_THRESHOLD = 1000000; // 1 million spent
export const LOYALTY_DISCOUNT_AMOUNT = 100000; // 100,000 Rph discount

/**
 * Count the number of products by type in cart
 */
export const countProductType = (items, productType) => {
  if (!items || !Array.isArray(items) || items.length === 0) return 0;
  
  return items.reduce((count, item) => {
    if (item && item.productType === productType) {
      return count + (parseInt(item.qty) || 0);
    }
    return count;
  }, 0);
};

/**
 * Calculate the total price for a specific product type
 */
export const getProductTypeTotal = (items, productType) => {
  if (!items || !Array.isArray(items) || items.length === 0) return 0;
  
  return items.reduce((total, item) => {
    if (item && item.productType === productType && item.sum) {
      return total + parseFloat(item.sum);
    }
    return total;
  }, 0);
};

/**
 * Generate a unique referral code
 */
export const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 6) + Math.floor(Math.random() * 10);
};

/**
 * Calculate the total price of all items in cart
 */
export const cartPriceTotal = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) return 0;
  
  return items.reduce((acc, item) => {
    if (item && typeof item.sum === 'number') {
      return acc + item.sum;
    }
    return acc;
  }, 0);
};

/**
 * Calculate the cart total with all applicable discounts
 */
export const calculateCartTotal = (items, userData, discount = null) => {
  try {
    // Ensure items is an array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return { 
        original: 0, 
        discount: 0, 
        total: 0,
        discountDetails: null
      };
    }
    
    // Make sure all items have the required fields
    const validItems = items.filter(item => 
      item && 
      typeof item.sum === 'number' && 
      item.sum >= 0 &&
      typeof item.qty === 'number' && 
      item.qty > 0
    );
    
    // Calculate original total
    const originalTotal = cartPriceTotal(validItems);
    let discountAmount = 0;
    let discountDetails = null;
    
    // Business accounts don't get automatic discounts
    if (userData && userData.type === 'business') {
      // But they can still use discount codes
      if (discount) {
        // Apply discount code logic for business users
        if (discount.percentage && typeof discount.percentage === 'number') {
          discountAmount = originalTotal * (discount.percentage / 100);
          discountDetails = {
            name: discount.name || "Coupon Discount",
            percentage: discount.percentage,
            amount: discountAmount,
            message: discount.message || `${discount.percentage}% off`
          };
        } else if (discount.amount && typeof discount.amount === 'number') {
          discountAmount = discount.amount;
          discountDetails = {
            name: discount.name || "Coupon Discount",
            amount: discount.amount,
            fixed: true,
            message: discount.message || `${discount.amount.toLocaleString()} Rph off`
          };
        }
      }
      
      return {
        original: originalTotal,
        discount: discountAmount,
        total: originalTotal - discountAmount,
        discountDetails
      };
    }
    
    // For regular users, apply automatic discounts
    
    // 1. First, check for first order discount
    if (userData && userData.orderCount === 0) {
      if (userData.referredBy) {
        // First order with referral gets 40% off
        discountAmount = originalTotal * (REFERRED_FIRST_ORDER_DISCOUNT / 100);
        discountDetails = {
          name: "First Order + Referral Discount",
          percentage: REFERRED_FIRST_ORDER_DISCOUNT,
          amount: discountAmount,
          message: `${REFERRED_FIRST_ORDER_DISCOUNT}% off your first order`
        };
      } else {
        // Regular first order gets 20% off
        discountAmount = originalTotal * (FIRST_ORDER_DISCOUNT / 100);
        discountDetails = {
          name: "First Order Discount",
          percentage: FIRST_ORDER_DISCOUNT,
          amount: discountAmount,
          message: `${FIRST_ORDER_DISCOUNT}% off your first order`
        };
      }
    } 
    // 2. For existing customers, check for bundle discounts
    else {
      const bottleCount = countProductType(validItems, 'bottle');
      const hasPodDevice = countProductType(validItems, 'pod') > 0;
      const bottleTotal = getProductTypeTotal(validItems, 'bottle');
      
      // Pod device + bottles discounts take precedence
      if (hasPodDevice && bottleCount >= 3) {
        discountAmount = bottleTotal * (POD_THREE_BOTTLES_DISCOUNT / 100);
        discountDetails = {
          name: "Bundle Discount",
          percentage: POD_THREE_BOTTLES_DISCOUNT,
          amount: discountAmount,
          message: `Pod device + ${bottleCount} bottles: ${POD_THREE_BOTTLES_DISCOUNT}% off bottles`
        };
      } else if (hasPodDevice && bottleCount >= 1) {
        discountAmount = bottleTotal * (POD_ONE_BOTTLE_DISCOUNT / 100);
        discountDetails = {
          name: "Bundle Discount",
          percentage: POD_ONE_BOTTLE_DISCOUNT,
          amount: discountAmount,
          message: `Pod device + bottle: ${POD_ONE_BOTTLE_DISCOUNT}% off bottle`
        };
      } 
      // Multiple bottles discounts
      else if (bottleCount >= 5) {
        discountAmount = bottleTotal * (FIVE_BOTTLES_DISCOUNT / 100);
        discountDetails = {
          name: "Bundle Discount",
          percentage: FIVE_BOTTLES_DISCOUNT,
          amount: discountAmount,
          message: `${bottleCount} bottles bundle: ${FIVE_BOTTLES_DISCOUNT}% off`
        };
      } else if (bottleCount >= 3) {
        discountAmount = bottleTotal * (THREE_BOTTLES_DISCOUNT / 100);
        discountDetails = {
          name: "Bundle Discount",
          percentage: THREE_BOTTLES_DISCOUNT,
          amount: discountAmount,
          message: `${bottleCount} bottles bundle: ${THREE_BOTTLES_DISCOUNT}% off`
        };
      }
    }
    
    // 3. Check for loyalty discount (for non-business accounts)
    if (userData && userData.lifetimeSpend && 
        typeof userData.lifetimeSpend === 'number' && 
        userData.lifetimeSpend >= LOYALTY_DISCOUNT_THRESHOLD) {
      
      const loyaltyDiscountMultiplier = Math.floor(userData.lifetimeSpend / LOYALTY_DISCOUNT_THRESHOLD);
      const loyaltyDiscount = loyaltyDiscountMultiplier * LOYALTY_DISCOUNT_AMOUNT;
      
      // If we already have a discount, keep the larger one
      if (loyaltyDiscount > discountAmount) {
        discountAmount = loyaltyDiscount;
        discountDetails = {
          name: "Loyalty Discount",
          amount: loyaltyDiscount,
          fixed: true,
          message: `${loyaltyDiscount.toLocaleString()} Rph off for loyal customers`
        };
      }
    }
    
    // 4. Check for manual discount code - this takes precedence if it gives a better discount
    if (discount) {
      let codeDiscountAmount = 0;
      
      // For referral discounts, apply only to bottles for non-first-orders
      if (discount.type === 'referral' && !(userData && userData.orderCount === 0)) {
        const bottleTotal = getProductTypeTotal(validItems, 'bottle');
        codeDiscountAmount = bottleTotal * (REFER_FRIEND_DISCOUNT / 100);
        
        // Only apply if this gives better discount
        if (codeDiscountAmount > discountAmount) {
          discountAmount = codeDiscountAmount;
          discountDetails = {
            name: "Referral Discount",
            percentage: REFER_FRIEND_DISCOUNT,
            amount: discountAmount,
            message: `${REFER_FRIEND_DISCOUNT}% off e-liquid bottles`
          };
        }
      } 
      // For percentage discounts from the database
      else if (discount.percentage && typeof discount.percentage === 'number') {
        codeDiscountAmount = originalTotal * (discount.percentage / 100);
        
        // Only apply if this gives better discount
        if (codeDiscountAmount > discountAmount) {
          discountAmount = codeDiscountAmount;
          discountDetails = {
            name: discount.name || "Coupon Discount",
            percentage: discount.percentage,
            amount: discountAmount,
            message: discount.message || `${discount.percentage}% off`
          };
        }
      }
      // For fixed amount discounts
      else if (discount.amount && typeof discount.amount === 'number') {
        codeDiscountAmount = discount.amount;
        
        // Only apply if this gives better discount
        if (codeDiscountAmount > discountAmount) {
          discountAmount = codeDiscountAmount;
          discountDetails = {
            name: discount.name || "Coupon Discount",
            amount: codeDiscountAmount,
            fixed: true,
            message: discount.message || `${codeDiscountAmount.toLocaleString()} Rph off`
          };
        }
      }
    }
    
    // Calculate final total (don't allow negative totals)
    const finalTotal = Math.max(0, originalTotal - discountAmount);
    
    return {
      original: originalTotal,
      discount: discountAmount,
      total: finalTotal,
      discountDetails
    };
  } catch (error) {
    console.error("Error calculating cart total:", error);
    
    // Return a safe default value
    return {
      original: Array.isArray(items) ? items.reduce((sum, item) => sum + (item?.sum || 0), 0) : 0,
      discount: 0,
      total: Array.isArray(items) ? items.reduce((sum, item) => sum + (item?.sum || 0), 0) : 0,
      discountDetails: null,
      error: error.message
    };
  }
};