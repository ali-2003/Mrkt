"use client";

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

export const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      console.log("🚀 ~ state:", state)
      const idx = state.items.findIndex(
        (item) => item.id === action.payload.id
      );

      if (idx === -1) {
        state.items.push(action.payload);
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    emptyWishlist: (state) => {
      state.items = [];
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  emptyWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
