import { client, sanityAdminClient } from "@/sanity/lib/client.js";
import { NextResponse } from "next/server.js";

const authToken = Buffer.from(`${process.env.XENDIT_WITHDRAW_API_KEY}:`).toString("base64");

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, session, balance } = body;

    const user = await client.fetch(`*[_type == "user" && email == $email]`, {
      email: session.user.email,
    });

    if (user[0].balance < balance) {
      return NextResponse.json({ statusCode: 401, message: "Insufficient balance" })
    }

    const requestData = {
      id: `${session.user.id}-${Date.now()}`,
      amount: balance,
      channel_code: "ID_BCA",
      currency: "IDR",
      description: "Affiliate Withdrawal",
      reference_id: `${session.user.id}-${Date.now()}`,
      status: "ACCEPTED",
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      business_id: "666bd77cc7ca9fd365d6c6ae",
      channel_properties: {
        account_holder_name: data.accountName,
        account_number: data.accountNo,
      },
      receipt_notification: {
        email_to: [session.user.email],
        //   email_cc: [process.env.MRKT_EMAIL_ID],
      },
    };

    const res = await fetch("https://api.xendit.co/v2/payouts", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
        "Idempotency-key": `${session.user.id}-${Date.now()}`,
      },
      body: JSON.stringify(requestData),
    });

    const resData = await res.json();

    
    await sanityAdminClient.patch(user[0]._id).set({ balance: 0 }).commit();
  
    return NextResponse.json({ statusCode: 200, message: "Withdrawal successful" });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ statusCode: 401, message: err?.message || "Failed to withdraw" });
  }
}
