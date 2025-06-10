// app/api/webhooks/xendit/route.js
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-callback-token');
    
    // Verify webhook signature
    if (signature !== process.env.XENDIT_CALLBACK_TOKEN) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(body);
    console.log('Xendit webhook received:', webhookData);

    // Handle different webhook events
    switch (webhookData.status) {
      case 'PAID':
        await handlePaymentSuccess(webhookData);
        break;
      case 'EXPIRED':
        await handlePaymentExpired(webhookData);
        break;
      case 'FAILED':
        await handlePaymentFailed(webhookData);
        break;
      default:
        console.log('Unhandled webhook status:', webhookData.status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(webhookData) {
  try {
    const orderId = webhookData.external_id;
    
    // Update order status in Sanity using new schema
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

    console.log(`Order ${orderId} marked as paid`);

    // Here you could add additional logic like:
    // - Send confirmation email
    // - Update inventory
    // - Trigger fulfillment process
    
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentExpired(webhookData) {
  try {
    const orderId = webhookData.external_id;
    
    await sanityAdminClient
      .patch(orderId)
      .set({
        status: 'expired',
        paymentStatus: 'expired',
        expiredAt: new Date().toISOString()
      })
      .commit();

    console.log(`Order ${orderId} marked as expired`);
  } catch (error) {
    console.error('Error handling payment expiry:', error);
    throw error;
  }
}

async function handlePaymentFailed(webhookData) {
  try {
    const orderId = webhookData.external_id;
    
    await sanityAdminClient
      .patch(orderId)
      .set({
        status: 'failed',
        paymentStatus: 'failed',
        failedAt: new Date().toISOString(),
        failureReason: webhookData.failure_reason || 'Payment failed'
      })
      .commit();

    console.log(`Order ${orderId} marked as failed`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}