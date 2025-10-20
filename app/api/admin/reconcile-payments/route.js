// app/api/admin/reconcile-payments.js
import { NextResponse } from "next/server";
import { sanityAdminClient } from "@/sanity/lib/client";
import { sendOrderConfirmationEmail } from "@/utils/brevoEmail";

// Check Xendit invoice status via API
async function checkXenditInvoiceStatus(invoiceId) {
  try {
    const response = await fetch(
      `https://api.xendit.co/invoices/${invoiceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.XENDIT_SECRET_KEY}:`
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `⚠️ Xendit API error for invoice ${invoiceId}:`,
        response.status
      );
      return null;
    }

    const invoice = await response.json();
    return invoice;
  } catch (error) {
    console.error(`❌ Error checking Xendit invoice ${invoiceId}:`, error);
    return null;
  }
}

// Main handler (POST from admin button click)
export async function POST(request) {
  try {
    console.log("🔄 Payment reconciliation started (manual trigger)...");

    // Query Sanity for unpaid orders from last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoISO = oneMonthAgo.toISOString();

    const unpaidOrders = await sanityAdminClient.fetch(
      `*[
        _type == 'order' 
        && paymentStatus == 'pending' 
        && createdAt >= $oneMonthAgo
        && xenditInvoiceId != null
      ] | order(createdAt desc) {
        _id,
        orderId,
        email,
        name,
        xenditInvoiceId,
        paid,
        paymentStatus,
        emailStatus,
        createdAt
      }`,
      { oneMonthAgo: oneMonthAgoISO }
    );

    console.log(`📋 Found ${unpaidOrders.length} unpaid orders to check`);

    let processedCount = 0;
    let paidCount = 0;
    let emailsSent = 0;
    let errors = [];

    // Process each unpaid order
    for (const order of unpaidOrders) {
      try {
        console.log(
          `🔍 Checking invoice status for order ${order.orderId} (${order.xenditInvoiceId})`
        );

        // Check Xendit API
        const xenditInvoice = await checkXenditInvoiceStatus(
          order.xenditInvoiceId
        );

        if (!xenditInvoice) {
          console.warn(`⚠️ Could not fetch invoice data for ${order.orderId}`);
          continue;
        }

        processedCount++;

        // If invoice is PAID or SETTLED, update order
        if (
          xenditInvoice.status === "PAID" ||
          xenditInvoice.status === "paid" ||
          xenditInvoice.status === "SETTLED" ||
          xenditInvoice.status === "settled"
        ) {
          console.log(`✅ Invoice PAID: ${order.orderId}`);

          // Update order to paid
          const updateData = {
            paid: true,
            paymentStatus: "paid",
            status: "confirmed",
            paidAt: new Date().toISOString(),
            xenditPaymentId: xenditInvoice.id,
            xenditPaymentMethod: xenditInvoice.payment_method || "unknown",
          };

          await sanityAdminClient
            .patch(order._id)
            .set(updateData)
            .commit();

          paidCount++;
          console.log(`💾 Order updated in Sanity: ${order._id}`);

          // Send confirmation email if not already sent
          if (!order.emailStatus?.orderConfirmationSent) {
            try {
              console.log(`📧 Sending confirmation email for ${order.orderId}`);

              // Fetch full order data for email
              const fullOrder = await sanityAdminClient.fetch(
                `*[_type == 'order' && _id == $orderId][0]`,
                { orderId: order._id }
              );

              await sendOrderConfirmationEmail(fullOrder);

              // Mark email as sent
              await sanityAdminClient
                .patch(order._id)
                .set({
                  "emailStatus.orderConfirmationSent": true,
                })
                .commit();

              emailsSent++;
              console.log(`✅ Email sent for order ${order.orderId}`);
            } catch (emailError) {
              console.error(
                `⚠️ Error sending email for ${order.orderId}:`,
                emailError.message
              );

              // Log error but don't fail the cron
              await sanityAdminClient
                .patch(order._id)
                .set({
                  "emailStatus.orderConfirmationSentError": emailError.message,
                })
                .commit();

              errors.push({
                orderId: order.orderId,
                error: emailError.message,
              });
            }
          } else {
            console.log(
              `ℹ️ Email already sent for order ${order.orderId}, skipping`
            );
          }
        } else {
          console.log(
            `ℹ️ Invoice still ${xenditInvoice.status}: ${order.orderId}`
          );
        }
      } catch (error) {
        console.error(`❌ Error processing order ${order.orderId}:`, error);
        errors.push({
          orderId: order.orderId,
          error: error.message,
        });
      }
    }

    console.log("✅ Payment reconciliation cron completed!");

    return NextResponse.json({
      success: true,
      message: "Reconciliation completed",
      stats: {
        totalOrdersChecked: processedCount,
        paidOrdersFound: paidCount,
        emailsSent: emailsSent,
        errors: errors.length > 0 ? errors : null,
      },
    });
  } catch (error) {
    console.error("❌ Cron error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}