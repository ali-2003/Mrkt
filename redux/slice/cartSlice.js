import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { getRandomId } from "@/utils/idGenerator";

const initialState = {
  items: [],
  shippingCost: 0,
  discount: null
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      
      // Create a unique identifier that includes color information
      const getUniqueKey = (product) => {
        const baseKey = `${product.id}-${product.productType || 'bottle'}`;
        if (product.selectedColor) {
          return `${baseKey}-${product.selectedColor.colorName.replace(/\s+/g, '-').toLowerCase()}`;
        }
        return baseKey;
      };

      const uniqueKey = getUniqueKey(product);
      
      // Find existing item with same product ID, type, AND color
      const existingIndex = state.items.findIndex(item => {
        const itemKey = getUniqueKey(item);
        return itemKey === uniqueKey;
      });

      // Extract necessary product information including color data
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
        originalProduct       // Original product data
      } = product;

      if (existingIndex === -1) {
        // Add new item to cart with all color information
        const cartItem = {
          id,
          qty: 1,
          price,
          sale_price,
          business_price,
          cartId: getRandomId(),
          productType,
          sum: sale_price || price,
          description,
          name,
          pictures,
          stock,
          slug,
          short_desc,
          // Color-specific properties
          selectedColor,
          selectedColorId,
          cartImage,
          displayName,
          originalProduct,
          uniqueKey, // Store the unique key for easy identification
          addedAt: new Date().toISOString()
        };
        
        state.items.push(cartItem);
      } else {
        // Update existing item quantity
        state.items[existingIndex].qty += 1;
        state.items[existingIndex].sum = 
          state.items[existingIndex].qty * (sale_price || price);
      }

      // Enhanced toast message with color info
      const colorText = selectedColor ? ` (${selectedColor.colorName})` : '';
      toast.success(`Product${colorText} added to cart`);
    },

    removeFromCart: (state, action) => {
      const cartItem = state.items.find(item => item.cartId === action.payload);
      const colorText = cartItem?.selectedColor ? ` (${cartItem.selectedColor.colorName})` : '';
      
      state.items = state.items.filter((item) => item.cartId !== action.payload);
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
        
        state.items[itemIndex].qty = newQty;
        state.items[itemIndex].sum = 
          newQty * (state.items[itemIndex].sale_price || state.items[itemIndex].price);
      }
    },

    emptyCart: (state) => {
      state.items = [];
      state.shippingCost = 0;
      state.discount = null;
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
    }
  },
});

export const {
  addToCart,
  removeFromCart,
  updateItemQuantity,
  emptyCart,
  addShippingCost,
  applyDiscount,
  removeDiscount
} = cartSlice.actions;

export default cartSlice.reducer;