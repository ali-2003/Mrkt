// app/api/admin/orders/[orderId]/route.js
import { NextResponse } from 'next/server';
import { sanityAdminClient } from '@/sanity/lib/client';

export async function GET(request, { params }) {
  try {
    const orderId = params.orderId;
    
    const order = await sanityAdminClient.fetch(`
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
          cartId,
          selectedColor
        }
      }
    `, { orderId });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}