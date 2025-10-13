// app/api/checkout/route.js - MODIFIED: EMAIL REMOVED, SENT ONLY AFTER PAYMENT
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { calculateCartTotal } from "@/utils/discountValue";
// REMOVED: import { sendOrderConfirmationEmail } from "@/utils/brevoEmail";
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
    
    console.log("📦 Checkout request received:", {
      itemCount: items?.length,
      shippingCost,
      discountApplied: !!discount,
      isGuest,
      userEmail,
      createAccount,
      hasShippingInfo: !!shippingInfo
    });
    
    // Validation
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

    // Handle guest account creation
    let finalUser = user;
    let userData = null;

    if (isGuest && createAccount && accountData) {
      try {
        console.log("Creating new user account for guest...");
        
        const existingUser = await sanityAdminClient.fetch(
          `*[_type == 'user' && email == $email][0]`,
          { email: userEmail }
        );

        if (existingUser) {
          console.log("User already exists, using existing account");
          userData = existingUser;
          finalUser = { email: existingUser.email, name: existingUser.fullName };
        } else {
          const hashedPassword = await bcrypt.hash(accountData.password, 12);
          
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
          console.log("✅ New user account created:", userData._id);
        }
      } catch (error) {
        console.error("Error creating user account:", error);
        console.log("Continuing as guest checkout due to account creation error");
      }
    }

    // Fetch user data
    if (!userData && !isGuest && user?.email) {
      userData = await sanityAdminClient.fetch(
        `*[_type == 'user' && email == $email][0]{
          ...,
          "orderCount": count(*[_type == 'order' && email == $email]),
        }`,
        { email: user.email }
      );
    } else if (!userData && userEmail) {
      userData = await sanityAdminClient.fetch(
        `*[_type == 'user' && email == $email][0]{
          ...,
          "orderCount": count(*[_type == 'order' && email == $email]),
        }`,
        { email: userEmail }
      );
      
      if (!userData) {
        userData = {
          orderCount: 0,
          lifetimeSpend: 0,
          email: userEmail,
          isGuest: true
        };
      }
    }
    
    // Helper function to extract image URL from cart item
    const getCartImageUrl = (cartItem) => {
      const possibleImages = [
        cartItem.imageUrl,
        cartItem.processedImageUrl,
        cartItem.image,
        cartItem.cartImage,
        cartItem.img,
        cartItem.thumbnail
      ];
      
      for (const imageField of possibleImages) {
        if (imageField && typeof imageField === 'string' && (imageField.startsWith('http') || imageField.startsWith('https'))) {
          return imageField;
        }
      }
      
      return null;
    };

    // ======= FETCH SKUs AND IMAGES FROM SANITY =======
    console.log("🏷️ Fetching product SKUs and images from Sanity...");
    
    const enrichedItems = await Promise.all(
      items.map(async (cartItem) => {
        try {
          console.log(`Fetching SKU and image for product ID: ${cartItem.id}`);
          
          const cartImageUrl = getCartImageUrl(cartItem);
          
          const productFromSanity = await sanityAdminClient.fetch(`
            *[_type == "product" && id == $productId][0] {
              _id,
              id,
              name,
              slug,
              productType,
              shippingSku,
              "imageUrl": images[0].asset->url,
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
              colorShippingSku: null,
              imageUrl: cartImageUrl || null
            };
          }

          let mainSKU = productFromSanity.shippingSku;
          let colorSKU = null;

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

          const finalImageUrl = cartImageUrl || productFromSanity.imageUrl || null;
          
          console.log(`✅ ${productFromSanity.name}: ${mainSKU || 'MISSING'}${colorSKU ? ` / ${colorSKU}` : ''} | Image: ${finalImageUrl ? 'YES' : 'NO'}`);

          return {
            ...cartItem,
            shippingSku: mainSKU || `MISSING-${cartItem.id}`,
            colorShippingSku: colorSKU,
            imageUrl: finalImageUrl
          };

        } catch (error) {
          console.error(`❌ Error fetching SKU for product ${cartItem.id}:`, error);
          return {
            ...cartItem,
            shippingSku: `ERROR-${cartItem.id}`,
            colorShippingSku: null,
            imageUrl: getCartImageUrl(cartItem) || null
          };
        }
      })
    );

    console.log("🎯 SKU and image fetching complete!");
    
    // Calculate cart total
    let cartCalculation = discountCalculation;
    if (!cartCalculation) {
      try {
        const validItems = enrichedItems.map(item => ({
          ...item,
          qty: item.qty || 1,
          sum: typeof item.sum === 'number' ? item.sum : (item.sale_price || item.price || 0) * (item.qty || 1),
          productType: item.productType || 'bottle'
        }));
        
        cartCalculation = calculateCartTotal(validItems, userData || {}, discount);
      } catch (error) {
        console.error("Error calculating cart total:", error);
        
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
    
    console.log("💰 Discount calculation:", {
      hasDiscount: !!discount,
      discountCode: discount?.code,
      discountType: discount?.type,
      cartCalculationDiscount: cartCalculation.discount,
      discountAmount: cartCalculation.discount
    });
    
    // Handle discount updates
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
      }
    }
    
    // Track referral usage
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
    
    // Transform cart items with _key for Sanity INCLUDING imageUrl
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
        imageUrl: item.imageUrl || null,
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
    
    console.log("📦 Final products with SKUs and images:");
    transformedProducts.forEach(product => {
      console.log(`   - ${product.name}: ${product.shippingSku}${product.colorShippingSku ? ` / ${product.colorShippingSku}` : ''} | Image: ${product.imageUrl ? 'YES' : 'NO'}`);
    });
    
    // Prepare shipping info
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
    
    // Create the order with PENDING status
    const orderData = {
      _type: "order",
      orderId: orderId,
      userId: userData?._id || null,
      email: userEmail,
      name: shippingInfo.fullName,
      paid: false, // ⚠️ CRITICAL: Order starts as UNPAID
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
      
      status: "pending", // ⚠️ CRITICAL: Order status is PENDING
      paymentStatus: "pending", // ⚠️ CRITICAL: Payment is PENDING
      
      // Email status tracking
      emailStatus: {
        orderConfirmationSent: false, // ⚠️ Email NOT sent yet
        paymentSuccessSent: false,
        shippingNotificationSent: false
      },
      
      createdAt: new Date().toISOString()
    };
    
    console.log("💾 Creating order in Sanity with PENDING status:", {
      orderId: orderData.orderId,
      paymentStatus: orderData.paymentStatus,
      paid: orderData.paid,
      emailWillBeSent: "AFTER_PAYMENT_CONFIRMATION",
      productCount: orderData.products.length,
      hasDiscount: !!orderData.discount,
      discountAmount: orderData.discount?.amount
    });
    
    // Save order to Sanity
    const orderResult = await sanityAdminClient.create(orderData);
    console.log("✅ Order saved successfully with PENDING status:", orderResult._id);
    
    // ⚠️⚠️⚠️ REMOVED: Email sending logic ⚠️⚠️⚠️
    // Email will be sent ONLY after payment confirmation via webhook
    console.log("📧 Email will be sent AFTER payment confirmation via Xendit webhook");
    
    // Create Xendit Invoice
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
      
      // Add shipping cost
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

      console.log("📋 Xendit invoice request:", {
        externalId: invoiceRequest.externalId,
        amount: invoiceRequest.amount,
        itemsCount: invoiceItems.length,
        hasDiscount: cartCalculation?.discount > 0
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

      // Update user's lifetime spend (only for registered users)
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
        email_sent: false, // ⚠️ Email NOT sent yet
        email_will_be_sent: "after_payment_confirmation",
        is_guest: orderResult.isGuest,
        debug: {
          skusFetched: transformedProducts.length,
          productSKUs: transformedProducts.map(p => `${p.name}: ${p.shippingSku}`),
          productImages: transformedProducts.map(p => `${p.name}: ${p.imageUrl ? 'HAS_IMAGE' : 'NO_IMAGE'}`),
          invoiceItemsCount: invoiceItems.length,
          hasDiscount: cartCalculation?.discount > 0,
          discountAmount: orderResult.discount?.amount,
          finalTotal: validatedFinalTotal,
          paymentStatus: "pending",
          emailStatus: "will_be_sent_after_payment"
        }
      });

    } catch (xenditError) {
      console.error("❌ Xendit error details:", {
        message: xenditError.message,
        status: xenditError.status,
        errorCode: xenditError.errorCode
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