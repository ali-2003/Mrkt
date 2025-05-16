import { NextResponse } from "next/server";

import { sanityAdminClient } from "@/sanity/lib/client";


export async function POST(request) {
    try {
        const body = await request.json();
        const { code, email } = body

        if (!email) {
            return NextResponse.error(new Error("Invalid request"))
        }

        const discount = await sanityAdminClient.fetch(`*[_type == 'referral' && referredEmail == $email && referralCode == $code && referAvailed == false]`, { email, code })
        const user = await sanityAdminClient.fetch(`*[_type == 'user' && email == $email]`, { email })
        if (discount?.length) {
            const res = await sanityAdminClient.patch(user[0]._id).set({ discountsAvailable: [{
                _key: Math.random().toString(36).substring(7),
                name: "Refer Friend Discount",
                code: code,
                percentage: 30,
            }] }).commit()
        } else {
            const res = await sanityAdminClient.patch(user?.[0]._id).set({ discountsAvailable: [{
                _key: Math.random().toString(36).substring(7),
                name: "First Order Discount",
                code: code,
                percentage: 10,
            }] }).commit()
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error(error)
        return NextResponse.error(error)
    }
}