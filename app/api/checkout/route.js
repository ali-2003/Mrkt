// app/api/checkout/route.js - FIXED: Create order FIRST, use its ID for Xendit

// ... existing code ...

// ===== ⭐ REORDERED: CREATE ORDER FIRST, THEN XENDIT INVOICE =====

console.log("💾 Creating order in Sanity FIRST (to get the order ID)...");

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
  
  status: "pending_payment", // Different status to indicate payment not yet created
  paymentStatus: "pending",
  
  emailStatus: {
    orderConfirmationSent: false,
    paymentSuccessSent: false,
    shippingNotificationSent: false
  },
  
  createdAt: new Date().toISOString()
};

// Create the order
const orderResult = await sanityAdminClient.create(orderData);
console.log("✅ Order created with ID:", orderResult._id);

// ===== ⭐ NOW CREATE XENDIT INVOICE WITH THE REAL ORDER ID =====

console.log("💳 Creating Xendit invoice with real order ID as externalId...");

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
    invoiceDescription += ` (${cartCalculation.discountDetails.name} diterapkan)`;
  }
  
  const validatedFinalTotal = Math.round(parseFloat(finalTotal));
  if (validatedFinalTotal <= 0) {
    throw new Error("Invalid final total amount");
  }
  
  // ⭐ USE REAL ORDER ID HERE
  const invoiceRequest = {
    externalId: orderResult._id, // ⭐ REAL ORDER ID, NOT TEMPORARY
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

  console.log("📋 Creating Xendit invoice:", {
    externalId: invoiceRequest.externalId,
    amount: invoiceRequest.amount,
    itemsCount: invoiceItems.length
  });

  invoice = await Invoice.createInvoice({
    data: invoiceRequest,
  });

  console.log("✅ Xendit invoice created successfully:", invoice.id);

} catch (xenditError) {
  console.error("❌ Xendit error - DELETING ORDER:", {
    message: xenditError.message,
    status: xenditError.status,
    errorCode: xenditError.errorCode
  });
  
  // ⭐ DELETE THE ORDER IF XENDIT FAILS
  try {
    await sanityAdminClient.delete(orderResult._id);
    console.log("✅ Order deleted due to Xendit failure");
  } catch (deleteError) {
    console.error("❌ Failed to delete order:", deleteError);
    // Still report the Xendit error even if delete fails
  }
  
  return NextResponse.json(
    { 
      success: false, 
      message: "Terjadi kesalahan pada gateway pembayaran. Silakan coba lagi dalam beberapa saat.",
      error: xenditError.errorCode || "XENDIT_ERROR",
      timestamp: new Date().toISOString()
    },
    { status: 503 }
  );
}

// ===== ⭐ ONLY AFTER XENDIT SUCCESS, UPDATE ORDER WITH INVOICE INFO =====

try {
  await sanityAdminClient
    .patch(orderResult._id)
    .set({
      status: "pending", // Now payment is pending
      xenditInvoiceId: invoice.id,
      xenditInvoiceUrl: invoice.invoiceUrl,
      expiredAt: new Date(Date.now() + 86400000).toISOString()
    })
    .commit();
  
  console.log("✅ Order updated with Xendit invoice info");
} catch (updateError) {
  console.error("❌ Failed to update order with invoice info:", updateError);
  // Don't fail here - order and invoice are both created
}

// Update user lifetime spend if registered user
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

console.log("✅ Checkout completed successfully", {
  orderId: orderResult._id,
  invoiceId: invoice.id,
  totalTime: `${Date.now() - startTime}ms`
});

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