// api/checkout/route.js (Modified to include discount handling)
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { calculateCartTotal } from "@/utils/discountValue";

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, shippingCost, discount, user } = body;
    
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
        "lifetimeSpend": sum(*[_type == 'order' && customerEmail == $email].total)
      }`,
      { email: user.email }
    );
    
    // Calculate cart totals with all applicable discounts
    const cartCalculation = calculateCartTotal(items, userData, discount);
    
    // If this is a first order with discount, or a referral was used,
    // update the user's discount record
    if ((userData.orderCount === 0 || discount?.type === 'referral') && discount) {
      // Remove the used discount from available discounts
      const updatedDiscounts = (userData.discountsAvailable || []).filter(
        d => d.code !== discount.code
      );
      
      await sanityAdminClient
        .patch(userData._id)
        .set({ discountsAvailable: updatedDiscounts })
        .commit();
    }
    
    // Track if a referral was used
    if (discount?.type === 'referral') {
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
            amount: cartCalculation.discountDetails.amount
          } 
        : null,
      shippingCost: shippingCost,
      total: cartCalculation.total + shippingCost,
      status: "pending",
      dateCreated: new Date()
    };
    
    // Save order to Sanity
    const orderResult = await sanityAdminClient.create(orderData);
    
    // Generate invoice URL (implementation depends on your payment processor)
    // This is a placeholder - replace with your actual payment processing logic
    const invoice_url = `/invoice/${orderResult._id}`;
    
    // After successful order, update user's lifetime spend
    await sanityAdminClient
      .patch(userData._id)
      .set({ 
        lifetimeSpend: (userData.lifetimeSpend || 0) + cartCalculation.total 
      })
      .commit();
    
    return NextResponse.json({ 
      success: true,
      order_id: orderResult._id,
      invoice_url
    });
    
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during checkout" },
      { status: 500 }
    );
  }
}