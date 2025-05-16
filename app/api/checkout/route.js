import { sanityAdminClient } from "@/sanity/lib/client.js";
import { getRandomId } from "@/utils/idGenerator.js";
import { NextResponse } from "next/server";

const authToken = Buffer.from(`${process.env.XENDIT_CHECKOUT_API_KEY}:`).toString('base64');

const uploadToSanity = async (data, discount) => {
    const response = await sanityAdminClient.create({
        _type: 'order',
        orderId: data.external_id,
        userId: data?.user_id,
        paid: false,
        subTotal: data.items.reduce((acc, item) => acc + (item.price * item?.quantity), 0),
        totalPrice: data.amount,
        products: data.items.map(item => {
            return {
                _key: getRandomId(),
                name: item.name,
                price: item.price,
                quantity: `${item.quantity}`,
            }
        }),
        name: data.customer?.given_names,
        email: data.customer?.email,
        contact: data.customer?.mobile_number,
        discount: discount ? {
            name: discount.name,
            code: discount.code,
            percentage: discount.percentage,
            type: discount?.type || 'first',
            email: discount?.email,
        } : {}
    })

    console.log(response)
}

export async function POST(request) {
    try {
        const body = await request.json();
        
        const { user, discount, shippingCost } = body
        const items = body?.items?.map(item => {
            return {
                name: item.name,
                quantity: item?.qty || 1,
                price: item.price,
                category: 'Vape Flavor'
            }
        });

        const amount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0) + shippingCost
        const discountAmount = discount ? amount * ((100-discount?.percentage) / 100) : amount

        const ID = `${user?.id}-${new Date().getTime()}`

        const response = await fetch('https://api.xendit.co/v2/invoices', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              external_id: ID,
              amount: discountAmount,
              currency: 'IDR',
              customer: {
                given_names: `${user?.name || ''}`,
                surname: user.type,
                email: `${user?.email || ''}`,
                mobile_number: `${user?.whatsapp || ''}`,
              },
              customer_notification_preference: {
                invoice_paid: ['email', 'whatsapp'],
              },
              success_redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}success?sessionId=${ID}`,
              failure_redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}failure?sessionId=${ID}`,
              items,
            //   fees: [
            //     {
            //       type: 'Shipping',
            //       value: 10000,
            //     },
            //   ],
            }),
          });
          
        const data = await response.json();
        
        const { invoice_url } = data;

        await uploadToSanity(data, discount)

        console.log("Request successful", ID, data)

        return NextResponse.json({
            invoice_url,
        });

    } catch (error) {
        console.log("Request failed", error)
        return NextResponse.error(error);
    }
}