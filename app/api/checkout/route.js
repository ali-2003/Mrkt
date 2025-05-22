import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { calculateCartTotal } from "@/utils/discountValue";

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, shippingCost, discount, discountCalculation, user } = body;
    
    if (!items || !user) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }
    
    // Fetch user data from Sanity to get complete profile
    const userData = await sanityAdminClient.fetch(
      `*[_type == 'user' && email == $email][0]{
        ...,
        "orderCount": count(*[_type == 'order' && customerEmail == $email]),
        
      }`,
      { email: user.email }
    );
    
    // Use provided calculation if available, otherwise recalculate
    let cartCalculation = discountCalculation;
    if (!cartCalculation) {
      try {
        // Validate items before calculating
        const validItems = items.map(item => ({
          ...item,
          qty: item.qty || 1,
          sum: typeof item.sum === 'number' ? item.sum : (item.sale_price || item.price || 0) * (item.qty || 1),
          productType: item.productType || 'bottle'
        }));
        
        cartCalculation = calculateCartTotal(validItems, userData || {}, discount);
      } catch (error) {
        console.error("Error calculating cart total:", error);
        
        // Fallback calculation if there's an error
        const subtotal = items.reduce((total, item) => {
          if (item && typeof item.sum === 'number') {
            return total + item.sum;
          }
          const price = item.sale_price || item.price || 0;
          const qty = item.qty || 1;
          return total + (price * qty);
        }, 0);
        
        cartCalculation = {
          original: subtotal,
          discount: 0,
          total: subtotal,
          discountDetails: null
        };
      }
    }
    
    // If this is a first order with discount, or a referral was used,
    // update the user's discount record
    if (userData && ((userData.orderCount === 0 || discount?.type === 'referral') && discount)) {
      // Remove the used discount from available discounts
      try {
        const updatedDiscounts = (userData.discountsAvailable || []).filter(
          d => d.code !== discount.code
        );
        
        await sanityAdminClient
          .patch(userData._id)
          .set({ discountsAvailable: updatedDiscounts })
          .commit();
      } catch (err) {
        console.error("Error updating user discounts:", err);
        // Continue with checkout even if discount update fails
      }
    }
    
    // Track if a referral was used
    if (discount?.type === 'referral') {
      try {
        // Find and update the referral record
        const referral = await sanityAdminClient.fetch(
          `*[_type == 'referral' && referralCode == $code && referredEmail == $email][0]`,
          { code: discount.code, email: user.email }
        );
        
        if (referral) {
          await sanityAdminClient
            .patch(referral._id)
            .set({ referAvailed: true })
            .commit();
        }
      } catch (err) {
        console.error("Error updating referral:", err);
        // Continue with checkout even if referral update fails
      }
    }
    
    // Create the order with discount information
    const orderData = {
      _type: "order",
      customerEmail: user.email,
      customerName: user.name,
      items: items,
      subtotal: cartCalculation.original,
      discountAmount: cartCalculation.discount,
      discountDetails: cartCalculation.discountDetails
        ? {
            name: cartCalculation.discountDetails.name,
            percentage: cartCalculation.discountDetails.percentage,
            amount: cartCalculation.discountDetails.amount,
            message: cartCalculation.discountDetails.message
          }
        : null,
      shippingCost: shippingCost,
      total: cartCalculation.total + shippingCost,
      status: "pending",
      dateCreated: new Date()
    };
    
    // Save order to Sanity
    const orderResult = await sanityAdminClient.create(orderData);
    
    // Generate invoice URL
    const invoice_url = `/invoice/${orderResult._id}`;
    
    // After successful order, update user's lifetime spend
    if (userData && userData._id) {
      try {
        await sanityAdminClient
          .patch(userData._id)
          .set({
            lifetimeSpend: (userData.lifetimeSpend || 0) + cartCalculation.total
          })
          .commit();
      } catch (err) {
        console.error("Error updating user lifetime spend:", err);
        // Continue with successful checkout even if this update fails
      }
    }
    
    return NextResponse.json({
      success: true,
      order_id: orderResult._id,
      invoice_url
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred during checkout" },
      { status: 500 }
    );
  }
}