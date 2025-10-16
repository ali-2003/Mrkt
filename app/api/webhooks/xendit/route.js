// app/api/webhooks/xendit/route.js
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { sendOrderConfirmationEmail } from "@/utils/brevoEmail";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const xInvoiceToken = request.headers.get("x-xendit-token");

    console.log("🔔 Xendit webhook received:", {
      eventType: body.event,
      invoiceId: body.id,
      status: body.status
    });

    // SECURITY: Verify webhook signature
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    if (!webhookToken || xInvoiceToken !== webhookToken) {
      console.error("❌ Invalid webhook token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Handle invoice paid event
    if (body.status === "PAID" || body.event === "invoice.paid") {
      console.log("✅ Invoice paid:", body.id);

      // Find order by Xendit invoice ID
      const order = await sanityAdminClient.fetch(
        `*[_type == 'order' && xenditInvoiceId == $invoiceId][0]`,
        { invoiceId: body.id }
      );

      if (!order) {
        console.warn("⚠️ Order not found for invoice:", body.id);
        return NextResponse.json({
          success: false,
          message: "Order not found"
        });
      }

      console.log("Found order:", order._id);

      // Update order status to paid
      await sanityAdminClient
        .patch(order._id)
        .set({
          paid: true,
          paymentStatus: "paid",
          status: "confirmed", // Move to confirmed status
          paidAt: new Date().toISOString(),
          xenditPaymentId: body.id,
          xenditPaymentMethod: body.payment_method || "unknown"
        })
        .commit();

      console.log("✅ Order marked as paid");

      // Send order confirmation email ONLY NOW (after payment)
      try {
        console.log("📧 Sending order confirmation email...");
        await sendOrderConfirmationEmail(order);
        
        // Update email status
        await sanityAdminClient
          .patch(order._id)
          .set({
            "emailStatus.orderConfirmationSent": true
          })
          .commit();
        
        console.log("✅ Order confirmation email sent");
      } catch (emailError) {
        console.error("⚠️ Error sending email:", emailError.message);
        // Don't fail the webhook if email fails
        // Update status to note email failed
        await sanityAdminClient
          .patch(order._id)
          .set({
            "emailStatus.orderConfirmationSentError": emailError.message
          })
          .commit();
      }

      // Webhook response
      return NextResponse.json({
        success: true,
        message: "Order updated successfully",
        orderId: order._id
      });
    }

    // Handle invoice expired
    if (body.status === "EXPIRED" || body.event === "invoice.expired") {
      console.log("⏰ Invoice expired:", body.id);

      const order = await sanityAdminClient.fetch(
        `*[_type == 'order' && xenditInvoiceId == $invoiceId][0]`,
        { invoiceId: body.id }
      );

      if (order && order.paymentStatus === "pending") {
        await sanityAdminClient
          .patch(order._id)
          .set({
            paymentStatus: "expired",
            status: "cancelled",
            expiredAt: new Date().toISOString(),
            cancelReason: "Invoice expired - payment not completed within 24 hours"
          })
          .commit();

        console.log("✅ Order marked as expired");
      }

      return NextResponse.json({
        success: true,
        message: "Invoice expiration processed"
      });
    }

    // Log unhandled events
    console.log("ℹ️ Unhandled Xendit event:", body.event);

    return NextResponse.json({
      success: true,
      message: "Webhook received"
    });

  } catch (error) {
    console.error("❌ Webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}