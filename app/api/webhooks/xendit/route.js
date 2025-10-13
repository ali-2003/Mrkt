// app/api/webhooks/xendit/route.js - ENHANCED: EMAIL ONLY AFTER PAYMENT SUCCESS
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { sendOrderConfirmationEmail } from "@/utils/brevoEmail";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-callback-token');
    
    console.log("🔔 Xendit webhook received");
    console.log("📋 Signature:", signature ? "Present" : "Missing");
    
    // ⚠️ CRITICAL: Verify webhook signature for security
    if (!process.env.XENDIT_CALLBACK_TOKEN) {
      console.error("❌ XENDIT_CALLBACK_TOKEN not configured in environment");
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }
    
    if (signature !== process.env.XENDIT_CALLBACK_TOKEN) {
      console.error('❌ Invalid webhook signature');
      console.error('Expected:', process.env.XENDIT_CALLBACK_TOKEN);
      console.error('Received:', signature);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(body);
    console.log('✅ Xendit webhook verified and parsed:', {
      status: webhookData.status,
      external_id: webhookData.external_id,
      id: webhookData.id,
      payment_method: webhookData.payment_method
    });

    // Handle different webhook events
    switch (webhookData.status) {
      case 'PAID':
      case 'SETTLED': // Some Xendit events use SETTLED instead of PAID
        await handlePaymentSuccess(webhookData);
        break;
      case 'EXPIRED':
        await handlePaymentExpired(webhookData);
        break;
      case 'FAILED':
        await handlePaymentFailed(webhookData);
        break;
      default:
        console.log('⚠️ Unhandled webhook status:', webhookData.status);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 * 1. Update order status to "paid"
 * 2. Send confirmation email to customer
 * 3. Update email status in order
 */
async function handlePaymentSuccess(webhookData) {
  try {
    const orderId = webhookData.external_id;
    
    console.log(`💰 Processing payment success for order: ${orderId}`);
    
    // ⚠️ STEP 1: Update order status in Sanity
    await sanityAdminClient
      .patch(orderId)
      .set({
        paid: true,
        status: 'confirmed',
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        xenditPaymentData: {
          paymentId: webhookData.id,
          paymentMethod: webhookData.payment_method,
          paidAmount: webhookData.paid_amount,
          paymentChannel: webhookData.payment_channel,
          paymentDestination: webhookData.payment_destination
        }
      })
      .commit();

    console.log(`✅ Order ${orderId} marked as PAID in database`);

    // ⚠️ STEP 2: Fetch complete order data with product images
    try {
      console.log(`📧 Fetching complete order data for email...`);
      
      const orderData = await sanityAdminClient.fetch(`
        *[_type == 'order' && _id == $orderId][0]{
          ...,
          products[]{
            name,
            productType,
            quantity,
            price,
            totalPrice,
            shippingSku,
            colorShippingSku,
            imageUrl,
            cartId,
            selectedColor
          }
        }
      `, { orderId });

      if (!orderData) {
        throw new Error(`Order ${orderId} not found in database`);
      }
      
      console.log(`✅ Order data fetched successfully:`, {
        orderId: orderData.orderId,
        email: orderData.email,
        productCount: orderData.products?.length,
        hasDiscount: !!orderData.discount,
        discountAmount: orderData.discount?.amount
      });

      // ⚠️ STEP 3: Enrich products with image URLs from Sanity if missing
      const enrichedProducts = await Promise.all(
        (orderData.products || []).map(async (product) => {
          // If product already has imageUrl, use it
          if (product.imageUrl) {
            return product;
          }
          
          // Otherwise, try to fetch from Sanity using cartId
          try {
            console.log(`🖼️ Fetching image for product: ${product.name} (cartId: ${product.cartId})`);
            
            const productWithImage = await sanityAdminClient.fetch(`
              *[_type == "product" && id == $productId][0] {
                "imageUrl": images[0].asset->url
              }
            `, { productId: product.cartId });
            
            if (productWithImage?.imageUrl) {
              console.log(`✅ Image found for ${product.name}`);
              return {
                ...product,
                imageUrl: productWithImage.imageUrl
              };
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch image for ${product.name}:`, error.message);
          }
          
          // Return product as-is if no image found
          return product;
        })
      );

      // ⚠️ STEP 4: Prepare email data with enriched products
      const emailOrderData = {
        ...orderData,
        products: enrichedProducts.map((item, index) => {
          const productName = item.name + (item.selectedColor?.colorName ? ` - ${item.selectedColor.colorName}` : '');
          const finalSKU = item.colorShippingSku || item.shippingSku || 'N/A';
          
          return {
            name: productName,
            category: item.productType || 'Product',
            skuNo: finalSKU,
            quantity: item.quantity || 1,
            price: `Rp.${Math.round(item.totalPrice || 0).toLocaleString('id-ID')}`,
            imageUrl: item.imageUrl || null,
          };
        })
      };
      
      console.log(`📧 Email data prepared:`, {
        productCount: emailOrderData.products.length,
        productsWithImages: emailOrderData.products.filter(p => p.imageUrl).length,
        hasDiscount: !!emailOrderData.discount,
        discountAmount: emailOrderData.discount?.amount
      });

      // ⚠️ STEP 5: Send email via Brevo
      console.log(`📧 Sending order confirmation email to: ${orderData.email}`);
      
      const emailResult = await sendOrderConfirmationEmail(emailOrderData);
      
      console.log('✅ Order confirmation email sent successfully:', {
        messageId: emailResult.messageId,
        email: orderData.email
      });
      
      // ⚠️ STEP 6: Update email status in order
      await sanityAdminClient
        .patch(orderId)
        .set({
          'emailStatus.paymentSuccessSent': true,
          'emailStatus.orderConfirmationSent': true,
          emailSentAt: new Date().toISOString(),
          brevoMessageId: emailResult.messageId
        })
        .commit();
        
      console.log('✅ Email status updated in database');
      
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
      console.error('❌ Email error details:', emailError.message);
      console.error('❌ Email error stack:', emailError.stack);
      
      // Update email status to failed but don't fail the webhook
      try {
        await sanityAdminClient
          .patch(orderId)
          .set({
            'emailStatus.paymentSuccessSent': false,
            'emailStatus.errorMessage': emailError.message,
            emailFailedAt: new Date().toISOString()
          })
          .commit();
          
        console.log('⚠️ Email status marked as failed in database');
      } catch (updateError) {
        console.error('❌ Failed to update email error status:', updateError);
      }
      
      // ⚠️ IMPORTANT: Don't throw error - payment was successful even if email failed
      console.log('⚠️ Payment marked as successful despite email failure');
    }

  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}

/**
 * Handle payment expiration
 * Update order status to "expired"
 */
async function handlePaymentExpired(webhookData) {
  try {
    const orderId = webhookData.external_id;
    
    console.log(`⏰ Processing payment expiration for order: ${orderId}`);
    
    await sanityAdminClient
      .patch(orderId)
      .set({
        status: 'expired',
        paymentStatus: 'expired',
        expiredAt: new Date().toISOString()
      })
      .commit();
      
    console.log(`✅ Order ${orderId} marked as EXPIRED`);
  } catch (error) {
    console.error('❌ Error handling payment expiry:', error);
    throw error;
  }
}

/**
 * Handle payment failure
 * Update order status to "failed" with failure reason
 */
async function handlePaymentFailed(webhookData) {
  try {
    const orderId = webhookData.external_id;
    
    console.log(`❌ Processing payment failure for order: ${orderId}`);
    console.log(`Failure reason: ${webhookData.failure_reason || 'Unknown'}`);
    
    await sanityAdminClient
      .patch(orderId)
      .set({
        status: 'failed',
        paymentStatus: 'failed',
        failedAt: new Date().toISOString(),
        failureReason: webhookData.failure_reason || 'Payment failed'
      })
      .commit();
      
    console.log(`✅ Order ${orderId} marked as FAILED`);
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    throw error;
  }
}