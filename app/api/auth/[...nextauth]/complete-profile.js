// Save this file as /app/api/auth/complete-profile/route.js
import { sanityAdminClient } from "@/sanity/lib/client";
import { FIRST_ORDER_DISCOUNT } from "@/utils/discountValue.js";

export async function POST(request) {
    try {
        const body = await request.json();
        const { 
            email, 
            name, 
            whatsapp, 
            dob, 
            authType
        } = body;

        // Check if user already exists
        const existingUser = await sanityAdminClient.fetch(`*[_type == 'user' && email == $email][0]`, { email });

        if (existingUser) {
            return Response.json({
                status: "error",
                message: 'An account already exists with this email.'
            }, { status: 400 });
        }

        // Create a new user in Sanity
        const registeredUser = await sanityAdminClient.create({
            _type: 'user',
            name,
            email,
            password: '', // No password for Google auth users
            authType: authType || 'google', // Default to 'google' if not specified
            createdAt: new Date().toISOString(),
            accountType: 'user', // Google auth only for personal accounts
            approved: true,
            whatsapp,
            dob,
            balance: 0,
            discountsAvailable: [{
                _key: Math.random().toString(36).substring(7),
                name: "First Order Discount",
                type: 'first',
                percentage: FIRST_ORDER_DISCOUNT,
            }]
        });

        // Create an affiliate discount for this user
        const discount = await sanityAdminClient.create({
            _type: 'discount',
            name: `Affiliate Discount Code for ${email}`,
            email,
            code: Array.from({length: Math.floor(Math.random() * 2) + 5}, () => 
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))
            ).join(''),
            type: 'affiliate',
            percentage: 5 // Adjust based on your discount strategy
        });

        return Response.json({
            status: "success",
            message: "User profile completed successfully",
            user: {
                id: registeredUser._id,
                name,
                email,
                accountType: 'user'
            }
        }, { status: 200 });

    } catch (err) {
        console.error(err);
        return Response.json({
            status: "error",
            message: "Error completing profile."
        }, { status: 500 });
    }
}