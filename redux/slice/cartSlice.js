"use client";

import { getRandomId } from "@/utils/idGenerator";
import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

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
      const idx = state.items.findIndex((item) => item.id === action.payload.id);
      const { description, name, pictures, stock, slug, short_desc } = action.payload;

      if (idx === -1) {
        state.items.push({
          qty: 1,
          price: action.payload?.sale_price ?? action.payload.price,
          cartId: getRandomId(),
          discountApplied: false,
          sum: action.payload?.sale_price ?? action.payload.price,
          description,
          name,
          pictures,
          stock,
          slug,
          short_desc,
        });
      } else {
        state.items[idx].qty += 1;
        state.items[idx].sum += action.payload?.sale_price ?? action.payload.price;
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.cartId !== action.payload);
    },
    emptyCart: (state) => {
      state.items = [];
      state.shippingCost = 0;
    },
    updateCart: (state, action) => {
      const idx = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      state.items[idx].qty = action.payload.qty;
      state.items[idx].sum =
        action.payload.qty * state.items[idx]?.sale_price ||
        state.items[idx]?.price;
    },
    addShippingCost: (state, action) => {
      state.shippingCost = action.payload;
    },
    updateDiscount: (state, action) => {
      state.discount = action.payload;
    },
    applyDiscount: (state, action) => {
      state.cart.discount = action.payload;

      toast.success("Discount applied!");
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  emptyCart,
  updateCart,
  addShippingCost,
  updateDiscount,
  applyDiscount,
} = cartSlice.actions;

export default cartSlice.reducer;
