// app/api/checkout/route.js - COMPLETE FILE
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { calculateCartTotal } from "@/utils/discountValue";
import { Xendit } from "xendit-node";
import bcrypt from "bcryptjs";

const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
  serverUrl: "https://api.xendit.co"
});

export async function POST(request) {
  const startTime = Date.now();
  
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
      isGuest,
      userEmail
    });
    
    // ===== VALIDATION =====
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
    
    const requiredShippingFields = ['fullName', 'email', 'phone', 'streetAddress', 'district', 'city', 'province'];
    for (const field of requiredShippingFields) {
      if (!shippingInfo[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    if (!process.env.XENDIT_SECRET_KEY) {
      console.error("XENDIT_SECRET_KEY is not configured");
      return NextResponse.json(
        { success: false, message: "Payment configuration error" },
        { status: 500 }
      );
    }

    // ===== PREPARE DATA =====
    
    const validatedItems = items.map(item => ({
      ...item,
      qty: Math.max(1, Math.round(item.qty || 1)),
      sum: typeof item.sum === 'number' ? item.sum : (item.sale_price || item.price || 0) * (item.qty || 1),
      productType: item.productType || 'bottle'
    }));

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
          console.log("User already exists");
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
    
    // Get product SKUs and images
    console.log("🏷️ Fetching product SKUs and images from Sanity...");
    
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

    const enrichedItems = await Promise.all(
      validatedItems.map(async (cartItem) => {
        try {
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
            console.warn(`⚠️ Product not found for ID: ${cartItem.id}`);
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
          
          return {
            ...cartItem,
            shippingSku: mainSKU || `MISSING-${cartItem.id}`,
            colorShippingSku: colorSKU,
            imageUrl: finalImageUrl
          };

        } catch (error) {
          console.error(`Error fetching SKU for product ${cartItem.id}:`, error);
          return {
            ...cartItem,
            shippingSku: `ERROR-${cartItem.id}`,
            colorShippingSku: null,
            imageUrl: getCartImageUrl(cartItem) || null
          };
        }
      })
    );

    // Calculate cart total
    let cartCalculation = discountCalculation;
    if (!cartCalculation) {
      try {
        cartCalculation = calculateCartTotal(enrichedItems, userData || {}, discount);
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

    const finalTotal = cartCalculation.total + shippingCost;
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Transform cart items
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

    // ===== CREATE ORDER FIRST =====
    console.log("💾 Creating order in Sanity...");
    
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
      
      warehouseFulfillment: {
        status: 'pending',
        pickedBy: null,
        packedBy: null,
        pickingNotes: null,
        shippingProvider: null,
        trackingNumber: null
      },
      
      status: "pending_payment",
      paymentStatus: "pending",
      
      emailStatus: {
        orderConfirmationSent: false,
        paymentSuccessSent: false,
        shippingNotificationSent: false
      },
      
      createdAt: new Date().toISOString()
    };

    const orderResult = await sanityAdminClient.create(orderData);
    console.log("✅ Order created:", orderResult._id);

    // ===== CREATE XENDIT INVOICE WITH ORDER ID =====
    console.log("💳 Creating Xendit invoice...");
    
    let invoice = null;
    
    try {
      const { Invoice } = xendit;
      
      const invoiceItems = [];
      
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
        invoiceDescription += ` (${cartCalculation.discountDetails.name})`;
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
        invoiceDuration: 86400,
      };

      invoice = await Invoice.createInvoice({
        data: invoiceRequest,
      });

      console.log("✅ Xendit invoice created:", invoice.id);

    } catch (xenditError) {
      console.error("❌ Xendit error:", xenditError.message);
      
      try {
        await sanityAdminClient.delete(orderResult._id);
        console.log("✅ Order deleted due to Xendit failure");
      } catch (deleteError) {
        console.error("Error deleting order:", deleteError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Terjadi kesalahan pada gateway pembayaran. Silakan coba lagi.",
          error: xenditError.errorCode || "XENDIT_ERROR"
        },
        { status: 503 }
      );
    }

    // ===== UPDATE ORDER WITH INVOICE INFO =====
    await sanityAdminClient
      .patch(orderResult._id)
      .set({
        status: "pending",
        xenditInvoiceId: invoice.id,
        xenditInvoiceUrl: invoice.invoiceUrl,
        expiredAt: new Date(Date.now() + 86400000).toISOString()
      })
      .commit();

    console.log("✅ Checkout completed successfully");

    return NextResponse.json({
      success: true,
      order_id: orderResult._id,
      invoice_url: invoice.invoiceUrl,
      xendit_invoice_id: invoice.id,
      order_number: orderId,
      email_sent: false,
      email_will_be_sent: "after_payment_confirmation",
      is_guest: orderResult.isGuest
    });
    
  } catch (error) {
    console.error("Checkout error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.",
        error: error.message 
      },
      { status: 500 }
    );
  }
}