// app/api/checkout/route.js - COMPLETE FIXED VERSION WITH GUEST SUPPORT
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { calculateCartTotal } from "@/utils/discountValue";
import { sendOrderConfirmationEmail } from "@/utils/brevoEmail";
import { Xendit } from "xendit-node";
import bcrypt from "bcryptjs";

// Initialize Xendit with proper configuration
const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
  serverUrl: "https://api.xendit.co"
});

export async function POST(request) {
  try {
    const body = await request.json();
    
    // UPDATED: Extract new fields for guest checkout support
    const { 
      items, 
      shippingCost, 
      discount, 
      discountCalculation, 
      user,
      shippingInfo,
      isGuest,
      userEmail,
      createAccount,
      accountData
    } = body;
    
    // Debug logging
    console.log("Checkout request received:", {
      itemCount: items?.length,
      shippingCost,
      discountApplied: !!discount,
      isGuest,
      userEmail,
      createAccount,
      hasShippingInfo: !!shippingInfo
    });
    
    // UPDATED: Validation for guest checkout
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No items in cart" },
        { status: 400 }
      );
    }

    if (!shippingInfo) {
      return NextResponse.json(
        { success: false, message: "Shipping information is required" },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
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

    // UPDATED: Handle guest account creation
    let finalUser = user;
    let userData = null;

    if (isGuest && createAccount && accountData) {
      try {
        console.log("Creating new user account for guest...");
        
        // Check if user already exists
        const existingUser = await sanityAdminClient.fetch(
          `*[_type == 'user' && email == $email][0]`,
          { email: userEmail }
        );

        if (existingUser) {
          console.log("User already exists, using existing account");
          userData = existingUser;
          finalUser = { email: existingUser.email, name: existingUser.fullName };
        } else {
          // Hash password
          const hashedPassword = await bcrypt.hash(accountData.password, 12);
          
          // Create new user
          const newUserData = {
            _type: 'user',
            fullName: accountData.fullName || shippingInfo.fullName,
            email: userEmail,
            password: hashedPassword,
            phone: accountData.phone || shippingInfo.phone,
            profileCompleted: true,
            accountType: 'personal',
            createdAt: new Date().toISOString()
          };

          userData = await sanityAdminClient.create(newUserData);
          finalUser = { email: userData.email, name: userData.fullName };
          console.log("New user account created:", userData._id);
        }
      } catch (error) {
        console.error("Error creating user account:", error);
        // Continue as guest if account creation fails
        console.log("Continuing as guest checkout due to account creation error");
      }
    }

    // UPDATED: Fetch user data (for both existing users and guests)
    if (!userData && !isGuest && user?.email) {
      userData = await sanityAdminClient.fetch(
        `*[_type == 'user' && email == $email][0]{
          ...,
          "orderCount": count(*[_type == 'order' && email == $email]),
        }`,
        { email: user.email }
      );
    } else if (!userData && userEmail) {
      // For guests or new accounts, check if they have any previous orders
      userData = await sanityAdminClient.fetch(
        `*[_type == 'user' && email == $email][0]{
          ...,
          "orderCount": count(*[_type == 'order' && email == $email]),
        }`,
        { email: userEmail }
      );
      
      // If no user found, create a minimal userData object for guests
      if (!userData) {
        userData = {
          orderCount: 0,
          lifetimeSpend: 0,
          email: userEmail,
          isGuest: true
        };
      }
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
      cartCalculationTotal: cartCalculation.total,
      isGuest,
      userEmail
    });
    
    // UPDATED: Handle discount updates for both users and guests
    if (userData && userData._id && ((userData.orderCount === 0 || discount?.type === 'referral') && discount)) {
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
          { code: discount.code, email: userEmail }
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
    
    // Transform cart items with _key for Sanity
    const transformedProducts = enrichedItems.map((item, index) => {
      const productData = {
        _key: `product-${Date.now()}-${index}`,
        name: item.name,
        slug: item.slug?.current || item.slug || '',
        cartId: item.cartId,
        productType: item.productType || 'bottle',
        quantity: item.qty,
        price: item.sale_price || item.price,
        totalPrice: item.sum,
        shippingSku: item.shippingSku,
      };
      
      if (item.colorShippingSku) {
        productData.colorShippingSku = item.colorShippingSku;
      }
      
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
    
    // UPDATED: Create the order with proper user handling for guests
    const orderData = {
      _type: "order",
      orderId: orderId,
      userId: userData?._id || null,
      email: userEmail,
      name: shippingInfo.fullName,
      paid: false,
      contact: shippingInfo.phone,
      subTotal: cartCalculation.original,
      shippingPrice: shippingCost,
      isGuest: isGuest || false,
      
      // Discount handling
      discount: (cartCalculation.discount > 0) ? {
        name: cartCalculation.discountDetails?.name || discount?.name || 'Discount Applied',
        code: cartCalculation.discountDetails?.code || discount?.code || 'AUTO-DISCOUNT',
        percentage: cartCalculation.discountDetails?.percentage || discount?.percentage || 0,
        amount: cartCalculation.discount,
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
      discountAmount: orderData.discount?.amount,
      isGuest: orderData.isGuest,
      userEmail: orderData.email
    });
    
    console.log("Order data being saved:", {
      orderId: orderData.orderId,
      productCount: orderData.products.length,
      hasDiscount: !!orderData.discount,
      discountAmount: orderData.discount?.amount,
      isGuest: orderData.isGuest,
      userEmail: orderData.email,
      shippingInfo: orderData.shippingInfo,
      productSKUs: orderData.products.map(p => ({ name: p.name, sku: p.shippingSku, colorSku: p.colorShippingSku }))
    });
    
    // Save order to Sanity
    const orderResult = await sanityAdminClient.create(orderData);
    console.log("✅ Order saved successfully with SKUs:", orderResult._id);
    
    // SEND EMAIL IMMEDIATELY AFTER ORDER CREATION
    try {
      console.log("📧 Sending order confirmation email immediately...");
      
      // Prepare complete order data for email
      const emailOrderData = {
        ...orderResult,
        paidAt: new Date().toISOString(),
        xenditPaymentData: {
          paymentMethod: 'Xendit Payment Gateway'
        },
        products: enrichedItems.map((item, index) => {
          const productName = item.name + (item.selectedColor?.colorName ? ` - ${item.selectedColor.colorName}` : '');
          const finalSKU = item.colorShippingSku || item.shippingSku || 'N/A';
          
          return {
            name: productName,
            category: item.productType || 'Product',
            skuNo: finalSKU,
            quantity: item.qty || 1,
            price: `Rp.${Math.round(item.sum || 0).toLocaleString('id-ID')}`,
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
        isGuest: orderResult.isGuest,
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
      
      console.log("⚠️ Continuing with checkout despite email failure");
    }
    
    // Create Xendit Invoice with validation-safe format
    try {
      console.log("Creating Xendit invoice for order:", orderResult._id);
      
      const { Invoice } = xendit;
      
      // Build safe items array
      const invoiceItems = [];
      
      // Add all products
      transformedProducts.forEach(item => {
        const itemName = item.name + (item.selectedColor ? ` - ${item.selectedColor.colorName}` : '');
        const itemQuantity = parseInt(item.quantity) || 1;
        const itemPrice = Math.round(parseFloat(item.price) || 0);
        
        if (itemPrice > 0) {
          invoiceItems.push({
            name: itemName.substring(0, 255),
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
        payerEmail: userEmail,
        customerName: shippingInfo.fullName.substring(0, 255),
        currency: "IDR",
        reminderTime: 1,
        successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id=${orderResult._id}`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed?order_id=${orderResult._id}`,
        
        items: invoiceItems,
        
        customerNotificationPreference: {
          invoiceCreated: ["email"],
          invoicePaid: ["email"],
          invoiceExpired: ["email"]
        },
        invoiceDuration: 86400, // 24 hours
      };

      console.log("Validated Invoice request:", {
        externalId: invoiceRequest.externalId,
        amount: invoiceRequest.amount,
        currency: invoiceRequest.currency,
        payerEmail: invoiceRequest.payerEmail,
        itemsCount: invoiceItems.length,
        hasShipping: shippingCost > 0,
        hasDiscount: cartCalculation?.discount > 0,
        isGuest: orderResult.isGuest
      });

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
          expiredAt: new Date(Date.now() + 86400000).toISOString()
        })
        .commit();

      // UPDATED: Update user's lifetime spend (only for registered users)
      if (userData && userData._id && !userData.isGuest) {
        try {
          await sanityAdminClient
            .patch(userData._id)
            .set({
              lifetimeSpend: (userData.lifetimeSpend || 0) + cartCalculation.total
            })
            .commit();
        } catch (err) {
          console.error("Error updating user lifetime spend:", err);
        }
      }

      return NextResponse.json({
        success: true,
        order_id: orderResult._id,
        invoice_url: invoice.invoiceUrl,
        xendit_invoice_id: invoice.id,
        order_number: orderId,
        email_sent: true,
        is_guest: orderResult.isGuest,
        debug: {
          skusFetched: transformedProducts.length,
          productSKUs: transformedProducts.map(p => `${p.name}: ${p.shippingSku}`),
          emailAttempted: true,
          invoiceItemsCount: invoiceItems.length,
          hasShipping: shippingCost > 0,
          hasDiscount: cartCalculation?.discount > 0,
          discountAmount: orderResult.discount?.amount,
          finalTotal: validatedFinalTotal,
          isGuest: orderResult.isGuest,
          userEmail: orderResult.email,
          accountCreated: createAccount && !isGuest
        }
      });

    } catch (xenditError) {
      console.error("❌ Xendit error details:", {
        message: xenditError.message,
        status: xenditError.status,
        errorCode: xenditError.errorCode,
        response: xenditError.response
      });
      
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