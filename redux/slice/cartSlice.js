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
      const existingIndex = state.items.findIndex(
        (item) => item.id === product.id && item.productType === product.productType
      );
      
      // Extract necessary product information
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
        productType = 'bottle' // Default to bottle if not specified
      } = product;
      
      if (existingIndex === -1) {
        // Add new item to cart
        state.items.push({
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
        });
      } else {
        // Update existing item quantity
        state.items[existingIndex].qty += 1;
        state.items[existingIndex].sum =
          state.items[existingIndex].qty * (sale_price || price);
      }
      
      toast.success("Product added to cart");
    },
    
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.cartId !== action.payload);
      toast.success("Product removed from cart");
    },
    
    updateItemQuantity: (state, action) => {
      const { cartId, qty } = action.payload;
      const itemIndex = state.items.findIndex((item) => item.cartId === cartId);
      
      if (itemIndex !== -1) {
        state.items[itemIndex].qty = qty;
        state.items[itemIndex].sum =
          qty * (state.items[itemIndex].sale_price || state.items[itemIndex].price);
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