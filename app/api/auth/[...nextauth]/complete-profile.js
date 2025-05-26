// app/api/complete-profile/route.js

import { sanityAdminClient } from "@/sanity/lib/client"
import { AFFILIATE_DISCOUNT, FIRST_ORDER_DISCOUNT, REFER_FRIEND_DISCOUNT_IND } from "@/utils/discountValue.js"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Updated path for App Router

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session) {
            return Response.json({
                status: "error",
                message: "Unauthorized"
            }, { status: 401 })
        }

        const body = await request.json()
        const { userId, whatsapp, dob, code } = body

        // Verify user exists and profile is incomplete
        const user = await sanityAdminClient.fetch(
            `*[_type == 'user' && _id == $userId && profileCompleted == false][0]`,
            { userId }
        )

        if (!user) {
            return Response.json({
                status: "error",
                message: "Invalid user or profile already completed"
            }, { status: 400 })
        }

        // Handle referral code logic
        let discountValid = false
        let discount = null
        let referalUserEmail
        let referalUser

        if (code) {
            discount = await sanityAdminClient.fetch(
                `*[_type == 'referral' && referredEmail == $email && referralCode == $code && referAvailed == false]`, 
                { email: user.email, code }
            )
            
            if (discount?.length) {
                referalUserEmail = discount[0].referralEmail
                referalUser = await sanityAdminClient.fetch(
                    `*[_type == 'user' && email == $referalUserEmail]{..., discountAvailable}[0]`, 
                    { referalUserEmail }
                )
                
                if (user.accountType === referalUser?.accountType) {
                    discountValid = true
                }
            }
        }

        // Validate age
        const today = new Date()
        const dobDate = new Date(dob)
        if (today.getFullYear() - dobDate.getFullYear() < 18) {
            return Response.json({
                status: "error",
                message: "You must be at least 18 years old"
            }, { status: 400 })
        }

        // Update user profile
        const updatedUser = await sanityAdminClient.patch(userId).set({
            whatsapp,
            dob,
            balance: 0,
            profileCompleted: true,
            discountsAvailable: discountValid ? 
                [{
                    _key: Math.random().toString(36).substring(7),
                    name: "Refer Friend Discount",
                    code: code,
                    type: 'refer',
                    percentage: REFER_FRIEND_DISCOUNT_IND,
                }] :
                [{
                    _key: Math.random().toString(36).substring(7),
                    name: "First Order Discount",
                    code: code || 'FIRST',
                    type: 'first',
                    percentage: FIRST_ORDER_DISCOUNT,
                }]
        }).commit()

        // Create affiliate discount code
        await sanityAdminClient.create({
            _type: 'discount',
            name: `Affiliate Discount Code for ${user.email}`,
            email: user.email,
            code: Array.from({length: Math.floor(Math.random() * 2) + 5}, 
                () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))).join(''),
            type: 'affiliate',
            percentage: AFFILIATE_DISCOUNT
        })

        // Handle referral reward
        if (discountValid && referalUser) {
            await sanityAdminClient.patch(referalUser._id).set({ 
                discountsAvailable: [
                    ...(referalUser.discountsAvailable || []),
                    {
                        _key: Math.random().toString(36).substring(7),
                        name: "Refer Friend Discount",
                        code: code,
                        type: 'refer',
                        percentage: REFER_FRIEND_DISCOUNT_IND,
                    }
                ] 
            }).commit()

            await sanityAdminClient.patch(discount[0]._id).set({ referAvailed: true }).commit()
        }

        return Response.json({
            status: "success",
            message: "Profile completed successfully"
        }, { status: 200 })

    } catch (error) {
        console.error("Complete profile error:", error)
        return Response.json({
            status: "error",
            message: "Error completing profile"
        }, { status: 500 })
    }
}