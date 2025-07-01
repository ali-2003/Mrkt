// app/api/checkout/route.js - COMPLETE FIXED VERSION
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { calculateCartTotal } from "@/utils/discountValue";
import { sendOrderConfirmationEmail } from "@/utils/brevoEmail"; // Import email function
import { Xendit } from "xendit-node";

// Initialize Xendit with proper configuration
const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
  serverUrl: "https://api.xendit.co"
});

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
    
    // ======= FETCH SKUs FROM SANITY =======
    console.log("🏷️ Fetching product SKUs from Sanity...");
    
    const enrichedItems = await Promise.all(
      items.map(async (cartItem) => {
        try {
          console.log(`Fetching SKU for product ID: ${cartItem.id}`);
          
          // Fetch complete product from Sanity using the product ID
          const productFromSanity = await sanityAdminClient.fetch(`
            *[_type == "product" && id == $productId][0] {
              _id,
              id,
              name,
              slug,
              productType,
              shippingSku,
              podColors[] {
                colorName,
                colorCode,
                colorShippingSku
              }
            }
          `, { productId: cartItem.id });

          if (!productFromSanity) {
            console.warn(`⚠️ Product not found in Sanity for ID: ${cartItem.id}`);
            return {
              ...cartItem,
              shippingSku: `MANUAL-${cartItem.id}`,
              colorShippingSku: null
            };
          }

          // Determine the correct SKUs
          let mainSKU = productFromSanity.shippingSku;
          let colorSKU = null;

          // For pod products with color selection
          if (productFromSanity.productType === 'pod' && cartItem.selectedColor && productFromSanity.podColors) {
            const selectedColorData = productFromSanity.podColors.find(color => 
              color.colorName === cartItem.selectedColor.colorName || 
              color.colorName === cartItem.selectedColor ||
              (typeof cartItem.selectedColor === 'string' && color.colorName === cartItem.selectedColor)
            );
            
            if (selectedColorData?.colorShippingSku) {
              colorSKU = selectedColorData.colorShippingSku;
            }
          }

          console.log(`✅ ${productFromSanity.name}: ${mainSKU || 'MISSING'}${colorSKU ? ` / ${colorSKU}` : ''}`);

          return {
            ...cartItem,
            shippingSku: mainSKU || `MISSING-${cartItem.id}`,
            colorShippingSku: colorSKU
          };

        } catch (error) {
          console.error(`❌ Error fetching SKU for product ${cartItem.id}:`, error);
          return {
            ...cartItem,
            shippingSku: `ERROR-${cartItem.id}`,
            colorShippingSku: null
          };
        }
      })
    );

    console.log("🎯 SKU fetching complete!");
    
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
        // Validate items before calculating (use enriched items)
        const validItems = enrichedItems.map(item => ({
          ...item,
          qty: item.qty || 1,
          sum: typeof item.sum === 'number' ? item.sum : (item.sale_price || item.price || 0) * (item.qty || 1),
          productType: item.productType || 'bottle'
        }));
        
        cartCalculation = calculateCartTotal(validItems, userData || {}, discount);
      } catch (error) {
        console.error("Error calculating cart total:", error);
        
        // Fallback calculation if there's an error
        const subtotal = enrichedItems.reduce((total, item) => {
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
    
    // Add debug logging for discount values before order creation
    console.log("💰 DISCOUNT DEBUG BEFORE ORDER CREATION:", {
      hasOriginalDiscount: !!discount,
      discountCode: discount?.code,
      discountType: discount?.type,
      cartCalculationDiscount: cartCalculation.discount,
      cartCalculationDiscountDetails: cartCalculation.discountDetails,
      cartCalculationOriginal: cartCalculation.original,
      cartCalculationTotal: cartCalculation.total
    });
    
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
    
    // 🎯 FIXED: Transform cart items with _key for Sanity
    const transformedProducts = enrichedItems.map((item, index) => {
      const productData = {
        _key: `product-${Date.now()}-${index}`, // 🎯 CRITICAL FIX: Add unique _key for Sanity
        name: item.name,
        slug: item.slug?.current || item.slug || '',
        cartId: item.cartId,
        productType: item.productType || 'bottle',
        quantity: item.qty,
        price: item.sale_price || item.price,
        totalPrice: item.sum,
        
        // Include shipping SKUs for warehouse fulfillment
        shippingSku: item.shippingSku,
      };
      
      // 🎯 Only add colorShippingSku if it exists (not all products have color variants)
      if (item.colorShippingSku) {
        productData.colorShippingSku = item.colorShippingSku;
      }
      
      // 🎯 Only add selectedColor if it exists (not all products have colors)
      if (item.selectedColor && item.selectedColor.colorName) {
        productData.selectedColor = {
          colorName: item.selectedColor.colorName,
          colorCode: item.selectedColor.colorCode
        };
      }
      
      return productData;
    });
    
    // Log the final products with SKUs
    console.log("📦 Final products with SKUs:");
    transformedProducts.forEach(product => {
      console.log(`   - ${product.name}: ${product.shippingSku}${product.colorShippingSku ? ` / ${product.colorShippingSku}` : ''}`);
    });
    
    // Prepare shipping info with proper field mapping for Indonesian address format
    const formattedShippingInfo = {
      fullName: shippingInfo.fullName,
      email: shippingInfo.email,
      phone: shippingInfo.phone,
      streetAddress: shippingInfo.streetAddress,
      district: shippingInfo.district,
      city: shippingInfo.city,
      postalCode: shippingInfo.postalCode,
      province: shippingInfo.province,
      country: shippingInfo.country || "Indonesia",
      notes: shippingInfo.notes || ""
    };
    
    // 🎯 FIXED: Create the order with proper discount object creation
    const orderData = {
      _type: "order",
      orderId: orderId,
      userId: userData?._id || null,
      email: user.email,
      name: shippingInfo.fullName,
      paid: false,
      contact: shippingInfo.phone,
      subTotal: cartCalculation.original,
      shippingPrice: shippingCost,
      
      // 🎯 CRITICAL FIX: Check cartCalculation.discount instead of original discount object
      // This fixes automatic first-order discounts that don't have a manual discount code
      discount: (cartCalculation.discount > 0) ? {
        name: cartCalculation.discountDetails?.name || discount?.name || 'Discount Applied',
        code: cartCalculation.discountDetails?.code || discount?.code || 'AUTO-DISCOUNT',
        percentage: cartCalculation.discountDetails?.percentage || discount?.percentage || 0,
        amount: cartCalculation.discount, // This is the key field!
        email: discount?.email || null,
        type: cartCalculation.discountDetails?.type || discount?.type || 'automatic',
        message: cartCalculation.discountDetails?.message || discount?.message || ''
      } : null,
      
      totalPrice: finalTotal,
      products: transformedProducts,
      shippingInfo: formattedShippingInfo,
      
      // Warehouse fulfillment tracking
      warehouseFulfillment: {
        status: 'pending',
        pickedBy: null,
        packedBy: null,
        pickingNotes: null,
        shippingProvider: null,
        trackingNumber: null
      },
      
      status: "pending",
      paymentStatus: "pending",
      
      // Email status tracking
      emailStatus: {
        orderConfirmationSent: false,
        paymentSuccessSent: false,
        shippingNotificationSent: false
      },
      
      createdAt: new Date().toISOString()
    };
    
    // Add debug logging to see what's happening with discount
    console.log("💰 DISCOUNT DEBUG AFTER ORDER CREATION:", {
      hasOriginalDiscount: !!discount,
      discountCode: discount?.code,
      cartCalculationDiscount: cartCalculation.discount,
      cartCalculationDiscountDetails: cartCalculation.discountDetails,
      finalDiscountObject: orderData.discount,
      discountAmount: orderData.discount?.amount
    });
    
    console.log("Order data being saved:", {
      orderId: orderData.orderId,
      productCount: orderData.products.length,
      hasDiscount: !!orderData.discount,
      discountAmount: orderData.discount?.amount,
      shippingInfo: orderData.shippingInfo,
      productSKUs: orderData.products.map(p => ({ name: p.name, sku: p.shippingSku, colorSku: p.colorShippingSku }))
    });
    
    // Save order to Sanity
    const orderResult = await sanityAdminClient.create(orderData);
    console.log("✅ Order saved successfully with SKUs:", orderResult._id);
    
    // 🔥 SEND EMAIL IMMEDIATELY AFTER ORDER CREATION (NO WEBHOOK NEEDED)
    try {
      console.log("📧 Sending order confirmation email immediately...");
      
      // 🎯 FIXED: Prepare complete order data for email (NO IMAGE URLs)
      const emailOrderData = {
        ...orderResult,
        // Add computed fields for email template
        paidAt: new Date().toISOString(), // Use current time since order just created
        xenditPaymentData: {
          paymentMethod: 'Xendit Payment Gateway'
        },
        // 🎯 SIMPLIFIED: Products without image URLs
        products: enrichedItems.map((item, index) => {
          const productName = item.name + (item.selectedColor?.colorName ? ` - ${item.selectedColor.colorName}` : '');
          // 🎯 Use the most specific SKU available (color SKU if exists, otherwise main SKU)
          const finalSKU = item.colorShippingSku || item.shippingSku || 'N/A';
          
          return {
            name: productName,
            category: item.productType || 'Product',
            skuNo: finalSKU,
            quantity: item.qty || 1,
            price: `Rp.${Math.round(item.sum || 0).toLocaleString('id-ID')}`,
            // 🎯 REMOVED: imageUrl since you don't need it
          };
        })
      };
      
      console.log("📧 Email order data:", {
        orderId: emailOrderData.orderId,
        email: emailOrderData.email,
        name: emailOrderData.name,
        productCount: emailOrderData.products?.length,
        hasDiscount: !!(cartCalculation?.discount > 0),
        discountAmount: cartCalculation?.discount || 0,
        savedDiscountAmount: orderResult.discount?.amount,
        shippingCost: shippingCost,
        productsWithSKUs: emailOrderData.products.map(p => ({ name: p.name, sku: p.skuNo }))
      });
      
      // Send the email
      const emailResult = await sendOrderConfirmationEmail(emailOrderData);
      console.log("✅ Order confirmation email sent successfully:", emailResult);
      
      // Update email status in the order
      await sanityAdminClient
        .patch(orderResult._id)
        .set({
          'emailStatus.orderConfirmationSent': true,
          emailSentAt: new Date().toISOString(),
          brevoMessageId: emailResult.messageId
        })
        .commit();
        
      console.log("✅ Email status updated in order");
      
    } catch (emailError) {
      console.error("❌ Failed to send order confirmation email:", emailError);
      console.error("❌ Email error details:", emailError.message);
      
      // Update email status to failed but don't fail the entire checkout
      try {
        await sanityAdminClient
          .patch(orderResult._id)
          .set({
            'emailStatus.orderConfirmationSent': false,
            'emailStatus.errorMessage': emailError.message,
            emailFailedAt: new Date().toISOString()
          })
          .commit();
      } catch (updateError) {
        console.error("Failed to update email error status:", updateError);
      }
      
      // Continue with checkout even if email fails
      console.log("⚠️ Continuing with checkout despite email failure");
    }
    
    // 🔥 FIXED: Create Xendit Invoice with validation-safe format
    try {
      console.log("Creating Xendit invoice for order:", orderResult._id);
      
      const { Invoice } = xendit;
      
      // Build safe items array (NO negative prices - Xendit doesn't allow them)
      const invoiceItems = [];
      
      // Add all products
      transformedProducts.forEach(item => {
        // Ensure all required fields are present and valid
        const itemName = item.name + (item.selectedColor ? ` - ${item.selectedColor.colorName}` : '');
        const itemQuantity = parseInt(item.quantity) || 1;
        const itemPrice = Math.round(parseFloat(item.price) || 0);
        
        if (itemPrice > 0) { // Only add items with positive prices
          invoiceItems.push({
            name: itemName.substring(0, 255), // Xendit has character limits
            quantity: itemQuantity,
            price: itemPrice,
            category: (item.productType || 'product').substring(0, 50)
          });
        }
      });
      
      // Add shipping cost as separate line item if > 0
      if (shippingCost > 0) {
        invoiceItems.push({
          name: `Ongkos Kirim - ${formattedShippingInfo.province}`.substring(0, 255),
          quantity: 1,
          price: Math.round(parseFloat(shippingCost)),
          category: 'shipping'
        });
      }
      
      // DON'T add discount as line item - handle in description instead
      let invoiceDescription = `Order #${orderId} - MRKT Vape`;
      if (cartCalculation?.discount > 0 && cartCalculation?.discountDetails) {
        invoiceDescription += ` (${cartCalculation.discountDetails.name} diterapkan)`;
      }
      
      // Validate final total
      const validatedFinalTotal = Math.round(parseFloat(finalTotal));
      if (validatedFinalTotal <= 0) {
        throw new Error("Invalid final total amount");
      }
      
      const invoiceRequest = {
        externalId: orderResult._id,
        amount: validatedFinalTotal,
        description: invoiceDescription.substring(0, 255),
        payerEmail: user.email,
        customerName: shippingInfo.fullName.substring(0, 255),
        currency: "IDR",
        reminderTime: 1,
        successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id=${orderResult._id}`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed?order_id=${orderResult._id}`,
        
        // Safe items array (no negative prices)
        items: invoiceItems,
        
        customerNotificationPreference: {
          invoiceCreated: ["email"],
          invoicePaid: ["email"],
          invoiceExpired: ["email"]
        },
        invoiceDuration: 86400, // 24 hours
      };

      // Validate invoice request before sending
      console.log("Validated Invoice request:", {
        externalId: invoiceRequest.externalId,
        amount: invoiceRequest.amount,
        currency: invoiceRequest.currency,
        payerEmail: invoiceRequest.payerEmail,
        itemsCount: invoiceItems.length,
        hasShipping: shippingCost > 0,
        hasDiscount: cartCalculation?.discount > 0
      });

      console.log("Safe invoice items breakdown:", invoiceItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category
      })));

      const invoice = await Invoice.createInvoice({
        data: invoiceRequest,
      });

      console.log("✅ Xendit invoice created successfully:", invoice.id);

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
        order_number: orderId,
        email_sent: true, // Indicate email was sent
        debug: {
          skusFetched: transformedProducts.length,
          productSKUs: transformedProducts.map(p => `${p.name}: ${p.shippingSku}`),
          emailAttempted: true,
          invoiceItemsCount: invoiceItems.length,
          hasShipping: shippingCost > 0,
          hasDiscount: cartCalculation?.discount > 0,
          discountAmount: orderResult.discount?.amount,
          finalTotal: validatedFinalTotal,
          productImagesIncluded: false
        }
      });

    } catch (xenditError) {
      console.error("❌ Xendit error details:", {
        message: xenditError.message,
        status: xenditError.status,
        errorCode: xenditError.errorCode,
        response: xenditError.response
      });
      
      // Log more detailed error info
      if (xenditError.response?.errors) {
        console.error("❌ Xendit validation errors:", xenditError.response.errors);
      }
      
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
          error: xenditError.errorCode || "PAYMENT_ERROR",
          details: xenditError.response?.errors || []
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