import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { getRandomId } from "@/utils/idGenerator";

const initialState = {
  items: [],
  shippingCost: 0,
  discount: null,
  total: 0,
  quantity: 0
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      
      // Create a unique identifier that includes color information AND business pricing context
      const getUniqueKey = (product) => {
        const baseKey = `${product.id}-${product.productType || 'bottle'}`;
        const colorKey = product.selectedColor 
          ? `-${product.selectedColor.colorName.replace(/\s+/g, '-').toLowerCase()}` 
          : '';
        const businessKey = product.isBusinessUser ? '-business' : '-regular';
        return `${baseKey}${colorKey}${businessKey}`;
      };

      const uniqueKey = getUniqueKey(product);
      
      // Find existing item with same product ID, type, color, AND pricing context
      const existingIndex = state.items.findIndex(item => {
        const itemKey = getUniqueKey(item);
        return itemKey === uniqueKey;
      });

      // Determine the correct price based on user type and product pricing
      const getEffectivePrice = (product) => {
        if (product.isBusinessUser && product.business_price) {
          return product.business_price;
        }
        if (product.sale_price && !product.isBusinessUser) {
          return product.sale_price;
        }
        return product.price || 0;
      };

      const effectivePrice = product.displayPrice || getEffectivePrice(product);

      // Extract necessary product information including color data and business context
      const {
        id,
        description,
        name,
        pictures,
        stock,
        slug,
        short_desc,
        price,
        sale_price,
        business_price,
        productType = 'bottle', // Default to bottle if not specified
        selectedColor,         // Color information
        selectedColorId,       // Color ID
        cartImage,            // Color-specific image
        displayName,          // Product name with color
        originalProduct,      // Original product data
        isBusinessUser = false, // Business user context
        addedAsBusinessUser = false // Business context when added
      } = product;

      if (existingIndex === -1) {
        // Add new item to cart with all color information and business pricing
        const cartItem = {
          id,
          qty: 1,
          price,                    // Original price
          sale_price,              // Sale price
          business_price,          // Business price
          effectivePrice,          // Price that was actually shown to user
          cartId: getRandomId(),
          productType,
          sum: effectivePrice,     // Total for this item (qty * effectivePrice)
          description,
          name: displayName || name, // Use display name if available (includes color)
          originalName: name,       // Keep original name
          pictures,
          stock,
          slug,
          short_desc,
          
          // Color-specific properties
          selectedColor,
          selectedColorId,
          cartImage: cartImage || pictures?.[0], // Use color-specific image or fallback
          displayName,
          originalProduct,
          
          // Business pricing context
          isBusinessUser,
          addedAsBusinessUser,
          pricingContext: isBusinessUser ? 'business' : 'regular',
          
          // Metadata
          uniqueKey, // Store the unique key for easy identification
          addedAt: new Date().toISOString()
        };
        
        state.items.push(cartItem);
      } else {
        // Update existing item quantity
        const item = state.items[existingIndex];
        item.qty += 1;
        item.sum = item.qty * item.effectivePrice;
      }

      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);

      // Enhanced toast message with color info and pricing context
      const colorText = selectedColor ? ` (${selectedColor.colorName})` : '';
      const priceText = isBusinessUser ? ' at business price' : '';
      toast.success(`Product${colorText} added to cart${priceText}`);
    },

    removeFromCart: (state, action) => {
      const cartItem = state.items.find(item => item.cartId === action.payload);
      const colorText = cartItem?.selectedColor ? ` (${cartItem.selectedColor.colorName})` : '';
      
      state.items = state.items.filter((item) => item.cartId !== action.payload);
      
      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);
      
      toast.success(`Product${colorText} removed from cart`);
    },

    updateItemQuantity: (state, action) => {
      const { cartId, qty } = action.payload;
      const itemIndex = state.items.findIndex((item) => item.cartId === cartId);
      
      if (itemIndex !== -1) {
        const item = state.items[itemIndex];
        
        // Check stock limits - prioritize color-specific stock
        const maxStock = item.selectedColor?.stock || item.stock || 999;
        const newQty = Math.min(Math.max(1, qty), maxStock);
        
        if (qty > maxStock) {
          const colorText = item.selectedColor ? ` for ${item.selectedColor.colorName}` : '';
          toast.warning(`Only ${maxStock} items available${colorText}`);
        }
        
        item.qty = newQty;
        item.sum = newQty * item.effectivePrice;
        
        // Recalculate totals
        cartSlice.caseReducers.calculateTotals(state);
      }
    },

    // New action: Update pricing context when user logs in/out
    updatePricingContext: (state, action) => {
      const { isBusinessUser } = action.payload;
      
      // Create a map to track which items need to be merged
      const itemsToUpdate = [];
      const itemsToRemove = [];
      
      state.items.forEach((item, index) => {
        // Update the business user context
        const oldUniqueKey = item.uniqueKey;
        
        // Recalculate effective price based on new context
        let newEffectivePrice;
        if (isBusinessUser && item.business_price) {
          newEffectivePrice = item.business_price;
        } else if (!isBusinessUser && item.sale_price) {
          newEffectivePrice = item.sale_price;
        } else {
          newEffectivePrice = item.price;
        }
        
        // Update item properties
        item.isBusinessUser = isBusinessUser;
        item.pricingContext = isBusinessUser ? 'business' : 'regular';
        item.effectivePrice = newEffectivePrice;
        item.sum = item.qty * newEffectivePrice;
        
        // Update unique key to reflect new pricing context
        const baseKey = `${item.id}-${item.productType || 'bottle'}`;
        const colorKey = item.selectedColor 
          ? `-${item.selectedColor.colorName.replace(/\s+/g, '-').toLowerCase()}` 
          : '';
        const businessKey = isBusinessUser ? '-business' : '-regular';
        item.uniqueKey = `${baseKey}${colorKey}${businessKey}`;
      });
      
      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);
      
      // Show notification about price updates
      const contextText = isBusinessUser ? 'Business pricing' : 'Regular pricing';
      toast.info(`Cart updated with ${contextText.toLowerCase()}`);
    },

    emptyCart: (state) => {
      state.items = [];
      state.shippingCost = 0;
      state.discount = null;
      state.total = 0;
      state.quantity = 0;
    },

    addShippingCost: (state, action) => {
      state.shippingCost = action.payload;
    },

    applyDiscount: (state, action) => {
      state.discount = action.payload;
      toast.success("Discount applied successfully!");
    },

    removeDiscount: (state) => {
      state.discount = null;
      toast.info("Discount removed");
    },

    // Calculate totals helper
    calculateTotals: (state) => {
      state.total = state.items.reduce((total, item) => total + item.sum, 0);
      state.quantity = state.items.reduce((quantity, item) => quantity + item.qty, 0);
    }
  },
});

export const {
  addToCart,
  removeFromCart,
  updateItemQuantity,
  updatePricingContext,
  emptyCart,
  addShippingCost,
  applyDiscount,
  removeDiscount,
  calculateTotals
} = cartSlice.actions;

export default cartSlice.reducer;

// Enhanced selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartQuantity = (state) => state.cart.quantity;
export const selectCartSubtotal = (state) => state.cart.total;
export const selectCartTotalWithShipping = (state) => state.cart.total + state.cart.shippingCost;
export const selectShippingCost = (state) => state.cart.shippingCost;
export const selectDiscount = (state) => state.cart.discount;

// Get final total with shipping and discount
export const selectCartFinalTotal = (state) => {
  const subtotal = state.cart.total;
  const shipping = state.cart.shippingCost;
  const discount = state.cart.discount;
  
  let total = subtotal + shipping;
  
  if (discount) {
    if (discount.percentage) {
      total = total - (total * discount.percentage / 100);
    } else if (discount.amount) {
      total = Math.max(0, total - discount.amount);
    }
  }
  
  return total;
};

// Helper function to get cart item count for a specific product
export const selectProductCartQuantity = (productId, selectedColorId = null, isBusinessUser = false) => (state) => {
  const baseKey = `${productId}-bottle`; // Assuming bottle as default
  const colorKey = selectedColorId ? `-${selectedColorId.replace(/\s+/g, '-').toLowerCase()}` : '';
  const businessKey = isBusinessUser ? '-business' : '-regular';
  const uniqueKey = `${baseKey}${colorKey}${businessKey}`;
  
  const item = state.cart.items.find(item => item.uniqueKey === uniqueKey);
  return item ? item.qty : 0;
};

// Get business vs regular pricing breakdown
export const selectCartPricingBreakdown = (state) => {
  const businessItems = state.cart.items.filter(item => item.pricingContext === 'business');
  const regularItems = state.cart.items.filter(item => item.pricingContext === 'regular');
  
  return {
    businessTotal: businessItems.reduce((total, item) => total + item.sum, 0),
    regularTotal: regularItems.reduce((total, item) => total + item.sum, 0),
    businessItemCount: businessItems.length,
    regularItemCount: regularItems.length,
    totalSavings: businessItems.reduce((savings, item) => {
      if (item.price && item.business_price) {
        return savings + ((item.price - item.business_price) * item.qty);
      }
      return savings;
    }, 0)
  };
};