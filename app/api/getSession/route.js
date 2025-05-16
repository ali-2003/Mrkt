// import { client, sanityAdminClient } from "@/sanity/lib/client.js";
import { client, sanityAdminClient } from "@/sanity/lib/client.js";
import { NextResponse } from "next/server";

const authToken = Buffer.from(`${process.env.XENDIT_CHECKOUT_API_KEY}:`).toString("base64");

const manageDiscount = async (orderInSanity, data) => {
  const user = await sanityAdminClient.fetch(
    `*[_type == "user" && email == $email]{
      ...,
      "discountsAvailable": discountsAvailable[]{
        ...
      }
    }[0]`,
    {
      email: data.customer?.email,
    }
  );
  console.log("🚀 ~ manageDiscount ~ user:", user)

  const updatedDiscounts = [...user.discountsAvailable].shift();

  await sanityAdminClient
    .patch(user._id)
    .set({
      discountsAvailable: updatedDiscounts,
    })
    .commit();


  if (orderInSanity.discount.type === "affiliate") {
    const amountAdded = (orderInSanity.discount.percentage / 100) * orderInSanity.subTotal;
    const affiliateUser = await client.fetch(`*[_type == "user" && email == $email]`, {
      email: orderInSanity.discount.email,
    });

    await sanityAdminClient.patch(affiliateUser[0]._id).set({
      balance: affiliateUser.balance + amountAdded,
    }).commit();
  }
};

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ message: "No session id" });
    }

    const response = await fetch(`https://api.xendit.co/v2/invoices/?external_id=${sessionId}`, {
      headers: {
        Authorization: `Basic ${authToken}`,
      },
    });
    const data = await response.json();

    if (!data.length || data[0].status !== "PAID" || data[0].external_id !== sessionId) {
      return NextResponse.json({
        statusCode: 404,
        message: "Error getting order details. Although, your order has been placed. Contact support for more info.",
      });
    }

    const orderInSanity = await client.fetch(`*[_type == "order" && orderId == $id]`, {
      id: sessionId,
    });

    if (!orderInSanity.length) return NextResponse.json({ statusCode: 404, message: "Order not found in database" });
    if (orderInSanity[0].paid) return NextResponse.json({ statusCode: 200, message: "Order already paid" });


    await sanityAdminClient.patch(orderInSanity[0]._id).set({ paid: true }).commit();

    if (orderInSanity[0].discount.name) {
      await manageDiscount(orderInSanity[0], data[0]);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.log(err);
    const errorMessage = err instanceof Error ? err.message : "Session ID not found";
    return NextResponse.json({ statusCode: 404, message: errorMessage });
  }
}
