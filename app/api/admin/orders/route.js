// app/api/admin/orders/route.js
import { NextResponse } from 'next/server';
import { sanityAdminClient } from '@/sanity/lib/client';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request) {
  try {
    // Fetch all orders with proper null handling
    const orders = await sanityAdminClient.fetch(`
      *[_type == 'order'] | order(createdAt desc) {
        _id,
        orderId,
        email,
        name,
        "customerName": coalesce(name, shippingInfo.fullName, email),
        paymentStatus,
        status,
        totalPrice,
        createdAt,
        paidAt,
        shippingInfo
      }
    `);

    // Filter out orders with invalid data and format them
    const validOrders = orders
      .filter(order => order._id && order.createdAt)
      .map(order => ({
        _id: order._id,
        orderId: order.orderId || 'NO-ID',
        email: order.email || 'no-email@example.com',
        name: order.customerName || 'Unknown Customer',
        paymentStatus: order.paymentStatus || 'unknown',
        status: order.status || 'unknown',
        totalPrice: order.totalPrice || 0,
        createdAt: order.createdAt,
        paidAt: order.paidAt || null
      }));

    return NextResponse.json(validOrders, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}