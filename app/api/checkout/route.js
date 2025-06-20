import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { calculateCartTotal } from "@/utils/discountValue";
import { Xendit } from "xendit-node";
import urlFor from "@/sanity/lib/image";

// Initialize Xendit with proper configuration
const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
  serverUrl: "https://api.xendit.co"
});

// Helper function to get the correct image URL as a string
const getProductImageUrl = (item) => {
  try {
    // Priority: cartImage > selectedColor first image > regular pictures
    if (item.cartImage) {
      // If cartImage is already a string URL, return it
      if (typeof item.cartImage === 'string' && item.cartImage.startsWith('http')) {
        return item.cartImage;
      }
      // If it's a Sanity image object, convert it
      return urlFor(item.cartImage).url();
    } else if (item.selectedColor?.pictures && item.selectedColor.pictures[0]) {
      return urlFor(item.selectedColor.pictures[0]).url();
    } else if (item.pictures && item.pictures.length > 0) {
      return urlFor(item.pictures[0]).url();
    }
    return '/placeholder-image.jpg'; // Fallback
  } catch (error) {
    console.error("Error processing image URL for item:", item.name, error);
    return '/placeholder-image.jpg'; // Fallback on error
  }
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      items, 
      shippingCost, 
      discount, 
      discountCalculation, 
      user,
      shippingInfo
    } = body;
    
    // Debug logging
    console.log("Checkout request received:", {
      itemCount: items?.length,
      shippingCost,
      discountApplied: !!discount,
      userEmail: user?.email,
      shippingInfo: shippingInfo
    });
    
    if (!items || !user || !shippingInfo) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }
    
    // Validate required shipping fields
    const requiredShippingFields = ['fullName', 'email', 'phone', 'streetAddress', 'district', 'city', 'province'];
    for (const field of requiredShippingFields) {
      if (!shippingInfo[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate environment variables
    if (!process.env.XENDIT_SECRET_KEY) {
      console.error("XENDIT_SECRET_KEY is not configured");
      return NextResponse.json(
        { success: false, message: "Payment configuration error" },
        { status: 500 }
      );
    }
    
    // Fetch user data from Sanity to get complete profile
    const userData = await sanityAdminClient.fetch(
      `*[_type == 'user' && email == $email][0]{
        ...,
        "orderCount": count(*[_type == 'order' && email == $email]),
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
      }
    }
    
    const finalTotal = cartCalculation.total + shippingCost;
    
    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Transform cart items to match new schema structure with proper image handling
    const transformedProducts = items.map(item => {
      const productData = {
        name: item.name,
        slug: item.slug?.current || item.slug || '',
        cartId: item.cartId,
        productType: item.productType || 'bottle',
        quantity: item.qty,
        price: item.sale_price || item.price,
        totalPrice: item.sum,
        selectedColor: item.selectedColor ? {
          colorName: item.selectedColor.colorName,
          colorCode: item.selectedColor.colorCode
        } : undefined, // Only include if exists
        image: getProductImageUrl(item) // FIXED: Use helper function to get string URL
      };
      
      // Remove undefined fields to prevent schema issues
      if (productData.selectedColor === undefined) {
        delete productData.selectedColor;
      }
      
      return productData;
    });
    
    // Prepare shipping info with proper field mapping for Indonesian address format
    const formattedShippingInfo = {
      fullName: shippingInfo.fullName,
      email: shippingInfo.email,
      phone: shippingInfo.phone,
      streetAddress: shippingInfo.streetAddress, // FIXED: Use correct field name
      district: shippingInfo.district, // FIXED: Add district field
      city: shippingInfo.city,
      postalCode: shippingInfo.postalCode,
      province: shippingInfo.province, // FIXED: Use province instead of state
      country: shippingInfo.country || "Indonesia", // FIXED: Add country field
      notes: shippingInfo.notes || ""
    };
    
    // Create the order with discount information using new schema
    const orderData = {
      _type: "order",
      orderId: orderId,
      userId: userData?._id || null,
      email: user.email,
      name: shippingInfo.fullName, // Use shipping info name instead of user name
      paid: false,
      contact: shippingInfo.phone,
      subTotal: cartCalculation.original,
      shippingPrice: shippingCost,
      discount: discount && cartCalculation.discountDetails ? {
        name: cartCalculation.discountDetails.name || discount.name,
        code: discount.code,
        percentage: cartCalculation.discountDetails.percentage || discount.percentage,
        amount: cartCalculation.discount,
        email: discount.email || null,
        type: discount.type || 'custom',
        message: cartCalculation.discountDetails.message || ''
      } : null, // FIXED: Set to null if no discount
      totalPrice: finalTotal,
      products: transformedProducts,
      shippingInfo: formattedShippingInfo, // FIXED: Use properly formatted shipping info
      status: "pending",
      paymentStatus: "pending",
      createdAt: new Date().toISOString()
    };
    
    console.log("Order data being saved:", {
      orderId: orderData.orderId,
      productCount: orderData.products.length,
      hasDiscount: !!orderData.discount,
      shippingInfo: orderData.shippingInfo,
      // Log first product to check image field
      firstProductImage: orderData.products[0]?.image
    });
    
    // Save order to Sanity
    const orderResult = await sanityAdminClient.create(orderData);
    console.log("Order saved successfully:", orderResult._id);
    
    // Create Xendit Invoice
    try {
      console.log("Creating Xendit invoice for order:", orderResult._id);
      
      const { Invoice } = xendit;
      const invoiceRequest = {
        externalId: orderResult._id,
        amount: finalTotal,
        description: `Order #${orderId} - MRKT Vape`,
        payerEmail: user.email,
        customerName: shippingInfo.fullName, // Use shipping name
        currency: "IDR",
        reminderTime: 1,
        successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id=${orderResult._id}`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed?order_id=${orderResult._id}`,
        items: transformedProducts.map(item => ({
          name: item.name + (item.selectedColor ? ` - ${item.selectedColor.colorName}` : ''),
          quantity: item.quantity,
          price: item.price,
          category: item.productType
        })),
        customerNotificationPreference: {
          invoiceCreated: ["email"],
          invoicePaid: ["email"],
          invoiceExpired: ["email"]
        },
        invoiceDuration: 86400, // 24 hours
      };

      console.log("Invoice request:", {
        externalId: invoiceRequest.externalId,
        amount: invoiceRequest.amount,
        currency: invoiceRequest.currency,
        payerEmail: invoiceRequest.payerEmail
      });

      const invoice = await Invoice.createInvoice({
        data: invoiceRequest,
      });

      console.log("Xendit invoice created successfully:", invoice.id);

      // Update order with Xendit invoice ID and URL
      await sanityAdminClient
        .patch(orderResult._id)
        .set({ 
          xenditInvoiceId: invoice.id,
          xenditInvoiceUrl: invoice.invoiceUrl,
          expiredAt: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
        })
        .commit();

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
        invoice_url: invoice.invoiceUrl,
        xendit_invoice_id: invoice.id,
        order_number: orderId
      });

    } catch (xenditError) {
      console.error("Xendit error details:", {
        message: xenditError.message,
        status: xenditError.status,
        errorCode: xenditError.errorCode,
        response: xenditError.response
      });
      
      // Update order status to failed
      await sanityAdminClient
        .patch(orderResult._id)
        .set({ 
          status: "failed",
          paymentStatus: "failed",
          failureReason: `Xendit error: ${xenditError.message}`,
          failedAt: new Date().toISOString()
        })
        .commit();
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Payment processing failed. Please try again or contact support.",
          error: xenditError.errorCode || "PAYMENT_ERROR"
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred during checkout" },
      { status: 500 }
    );
  }
}